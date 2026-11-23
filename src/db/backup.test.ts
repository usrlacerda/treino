import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db";
import { addExercise, saveWorkout } from "./plan";
import { finishSession, logSet, startSession } from "./repo";
import { backupFileName, exportData, importBackup, parseBackup, parseBackupText } from "./backup";

let db: TreinoDB;
beforeEach(async () => { db = new TreinoDB("bk-" + Math.random()); await seedIfEmpty(db); });

async function withData() {
  const ex = await addExercise(db, { name: "Remada curvada", muscle: "costas", equipment: "Barra", cue: "Coluna neutra." });
  const w = (await db.workouts.get("A"))!;
  w.items.push({ exerciseId: ex.id, sets: 3, repMin: 8, repMax: 10, restSec: 75 });
  await saveWorkout(db, w);
  const s = await startSession(db, "A");
  await logSet(db, s, { exerciseId: "ds-0770", setIndex: 0, weightKg: 42.5, reps: 8, doneAt: 1700000000000 });
  await finishSession(db, s);
  return ex;
}
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("backup: ida e volta", () => {
  it("exporta, importa em outro banco e recupera treinos, exercícios próprios e histórico", async () => {
    const ex = await withData();
    const json = JSON.stringify(await exportData(db));
    const other = new TreinoDB("bk2-" + Math.random());
    await importBackup(other, parseBackupText(json));
    expect((await other.exercises.get(ex.id))?.name).toBe("Remada curvada");
    expect((await other.workouts.get("A"))?.items.at(-1)?.exerciseId).toBe(ex.id);
    const sessions = await other.sessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sets[0].weightKg).toBe(42.5);
    expect(await other.exercises.count()).toBe(25); // 24 padrão + 1 próprio
  });
  it("só exporta exercícios próprios (os padrão vêm do app)", async () => {
    await withData();
    const b = await exportData(db);
    expect(b.exercises.map((e) => e.name)).toEqual(["Remada curvada"]);
  });
  it("importar substitui os dados atuais", async () => {
    await withData();
    const empty = new TreinoDB("bk3-" + Math.random());
    await seedIfEmpty(empty);
    await importBackup(db, parseBackup(clone(await exportData(empty))));
    expect(await db.sessions.count()).toBe(0);
    expect(await db.exercises.count()).toBe(24);
  });
  it("nome do arquivo com data", () => {
    expect(backupFileName(new Date("2026-11-22T12:00:00Z"))).toBe("treino-backup-2026-11-22.json");
  });
});

describe("backup: arquivo inválido é recusado com motivo", () => {
  const good = async () => clone(await exportData(db));
  const reject = (b: unknown, re: RegExp) => expect(() => parseBackup(b)).toThrow(re);

  it("não é JSON, não é objeto, outro app, outra versão", async () => {
    expect(() => parseBackupText("{oi")).toThrow(/não é JSON/);
    reject(null, /não é um backup do Treino/);
    reject([], /não é um backup do Treino/);
    reject({ app: "outro" }, /não é um backup do Treino/);
    reject({ ...(await good()), schema: 99 }, /versão que o app não reconhece/);
  });
  it.each([
    ["carga absurda", (b: any) => { b.sessions[0].sets[0].weightKg = 1e9; }, /carga/],
    ["carga negativa", (b: any) => { b.sessions[0].sets[0].weightKg = -5; }, /carga/],
    ["repetições quebradas", (b: any) => { b.sessions[0].sets[0].reps = 1.5; }, /repetições/],
    ["carga como texto", (b: any) => { b.sessions[0].sets[0].weightKg = "40"; }, /carga/],
    ["sessão repetida", (b: any) => { b.sessions.push(b.sessions[0]); }, /repetidas/],
    ["sessão de treino inexistente", (b: any) => { b.sessions[0].workoutId = "Z"; }, /não existe no backup/],
    ["treino com exercício desconhecido", (b: any) => { b.workouts[0].items[0].exerciseId = "fantasma"; }, /não encontrado/],
    ["treino com mínimo > máximo", (b: any) => { b.workouts[0].items[0].repMin = 20; }, /mínimo de repetições/],
    ["treinos repetidos", (b: any) => { b.workouts.push(b.workouts[0]); }, /treinos repetidos/],
    ["sem treinos", (b: any) => { b.workouts = []; b.sessions = []; }, /nenhum treino/],
    ["exercício próprio com id que imita o padrão", (b: any) => { b.exercises[0].id = "ds-1463"; }, /id de exercício próprio/],
    ["id com caracteres perigosos", (b: any) => { b.exercises[0].id = "custom-<script>"; }, /id de exercício próprio/],
    ["grupo muscular inválido", (b: any) => { b.exercises[0].muscle = "cabelo"; }, /grupo muscular/],
    ["lista não é lista", (b: any) => { b.sessions = {}; }, /lista de sessões/],
  ])("%s", async (_n, mut, re) => {
    await withData();
    const b = await good(); mut(b);
    reject(b, re as RegExp);
  });
  it("campos extras (como __proto__) não passam para o resultado", async () => {
    await withData();
    const b: any = await good();
    b.sessions[0].__proto__ = { hack: true }; b.sessions[0].extra = "x";
    const p = parseBackup(JSON.parse(JSON.stringify(b)));
    expect((p.sessions[0] as any).extra).toBeUndefined();
    expect(({} as any).hack).toBeUndefined();
  });
});

describe("backup: importação atômica", () => {
  it("se a gravação falhar no meio, nada muda", async () => {
    await withData();
    const before = { w: await db.workouts.count(), s: await db.sessions.count(), e: await db.exercises.count() };
    const b = parseBackup(clone(await exportData(db)));
    b.sessions.push({ ...b.sessions[0] }); // id repetido só depois da validação: força erro no banco
    await expect(importBackup(db, b)).rejects.toThrow();
    expect({ w: await db.workouts.count(), s: await db.sessions.count(), e: await db.exercises.count() }).toEqual(before);
  });
});
