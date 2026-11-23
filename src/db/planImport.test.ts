import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db";
import { addExercise } from "./plan";
import { finishSession, logSet, startSession } from "./repo";
import { applyImport, buildPreview, exportPlan, parsePlanText, planTemplate, suggestName } from "./planImport";

let db: TreinoDB;
beforeEach(async () => { db = new TreinoDB("pi-" + Math.random()); await seedIfEmpty(db); });
const file = (o: unknown) => JSON.stringify({ app: "treino", kind: "plano", schema: 1, ...(o as object) });

describe("importar treinos: leitura", () => {
  it("o modelo para baixar é aceito e resolve nomes e cardio", async () => {
    const plan = parsePlanText(JSON.stringify(planTemplate()));
    const prev = await buildPreview(db, plan);
    expect(prev.workouts).toHaveLength(1);
    expect(prev.workouts[0].items[0]).toMatchObject({ exerciseId: "leg-press", sets: 3, repMin: 10, repMax: 12, restSec: 90 });
    expect(prev.workouts[0].items.at(-1)).toMatchObject({ exerciseId: "cardio", durationMin: 15, sets: 1 });
    expect(prev.newExercises.map((e) => e.name)).toEqual(["Remada curvada com barra"]);
    expect(prev.newExercises[0].muscle).toBe("costas");
  });
  it("aceita nome sem acento/caixa, 'reps' como texto e valores padrão", async () => {
    const plan = parsePlanText(file({ workouts: [{ name: "X", items: [{ exerciseName: "ELEVACAO LATERAL COM HALTERES", reps: "12–15" }, { exercise: "leg press", reps: 10 }] }] }));
    const p = await buildPreview(db, plan);
    expect(p.workouts[0].items[0]).toMatchObject({ exerciseId: "elevacao-lateral", repMin: 12, repMax: 15, sets: 3, restSec: 60 });
    expect(p.workouts[0].items[1]).toMatchObject({ exerciseId: "leg-press", repMin: 10, repMax: 10 });
  });
  it("aceita um backup completo e usa só os treinos", async () => {
    const backup = JSON.stringify({ app: "treino", schema: 1, exportedAt: "x", exercises: [], sessions: [{ lixo: 1 }], workouts: [{ name: "Do backup", items: [{ exerciseId: "leg-press", sets: 3, repMin: 8, repMax: 10, restSec: 60 }] }] });
    const p = await buildPreview(db, parsePlanText(backup));
    expect(p.workouts[0].name).toBe("Do backup");
  });
  it.each([
    ["não é JSON", "oi", /não é válido/],
    ["outro app", JSON.stringify({ app: "x" }), /não é do Treino/],
    ["versão", JSON.stringify({ app: "treino", schema: 7, workouts: [] }), /versão/],
    ["sem treinos", file({ workouts: [] }), /nenhum treino/],
    ["treino sem itens", file({ workouts: [{ name: "A", items: [] }] }), /1 a 20 exercícios/],
    ["item sem exercício", file({ workouts: [{ name: "A", items: [{ sets: 3 }] }] }), /não diz qual é o exercício/],
    ["reps ruins", file({ workouts: [{ name: "A", items: [{ exerciseName: "Leg press", reps: "muitas" }] }] }), /repetições/],
    ["série como texto", file({ workouts: [{ name: "A", items: [{ exerciseName: "Leg press", sets: "3" }] }] }), /séries/],
    ["nome gigante", file({ workouts: [{ name: "A".repeat(41), items: [{ exerciseName: "Leg press" }] }] }), /nome do treino/],
    ["muitos treinos", file({ workouts: Array.from({ length: 21 }, (_, i) => ({ name: "T" + i, items: [{ exerciseName: "Leg press" }] })) }), /treinos demais/],
    ["id de exercício perigoso", file({ exercises: [{ id: "custom-<x>", name: "Y", muscle: "peito" }], workouts: [{ name: "A", items: [{ exerciseName: "Y" }] }] }), /id de exercício próprio/],
  ])("recusa: %s", (_n, content, re) => {
    expect(() => parsePlanText(content as string)).toThrow(re as RegExp);
  });
  it("nome desconhecido sem grupo muscular é erro que lista o nome", async () => {
    const plan = parsePlanText(file({ workouts: [{ name: "A", items: [{ exerciseName: "Exercício que não existe" }, { exerciseName: "Leg press" }] }] }));
    await expect(buildPreview(db, plan)).rejects.toThrow(/Exercício que não existe/);
  });
  it("limites do treino valem na importação (séries 99)", async () => {
    const plan = parsePlanText(file({ workouts: [{ name: "A", items: [{ exerciseName: "Leg press", sets: 99 }] }] }));
    await expect(buildPreview(db, plan)).rejects.toThrow(/séries deve ser de 1 a 10/);
  });
});

describe("importar treinos: aplicar", () => {
  const two = () => parsePlanText(file({ workouts: [
    { name: "Treino D", items: [{ exerciseName: "Leg press", reps: "10-12" }, { exerciseName: "Remada nova", muscle: "costas" }] },
    { name: "Treino E", items: [{ exerciseName: "Crucifixo na máquina" }] },
  ] }));

  it("adiciona sem apagar nada, na ordem, e cria só o exercício novo usado", async () => {
    const ses = await startSession(db, "A");
    await logSet(db, ses, { exerciseId: "leg-press", setIndex: 0, weightKg: 100, reps: 10, doneAt: 1 });
    await finishSession(db, ses);
    const prev = await buildPreview(db, two());
    const n = await applyImport(db, prev, [{ index: 0, name: "Treino D" }, { index: 1, name: "Treino E" }]);
    expect(n).toBe(2);
    const ws = await db.workouts.orderBy("order").toArray();
    expect(ws.map((w) => w.name)).toEqual(["Treino A", "Treino B", "Treino C", "Treino D", "Treino E"]);
    expect(await db.sessions.count()).toBe(1);
    expect((await db.exercises.toArray()).filter((e) => e.id.startsWith("custom-")).map((e) => e.name)).toEqual(["Remada nova"]);
  });
  it("importar só o segundo treino não cria o exercício do primeiro", async () => {
    const prev = await buildPreview(db, two());
    await applyImport(db, prev, [{ index: 1, name: "Treino E" }]);
    expect((await db.exercises.toArray()).some((e) => e.id.startsWith("custom-"))).toBe(false);
  });
  it("renomear permite importar um treino com nome repetido; nome repetido sem renomear é recusado e nada é gravado", async () => {
    const prev = await buildPreview(db, parsePlanText(file({ workouts: [{ name: "Treino A", items: [{ exerciseName: "Leg press" }] }] })));
    await expect(applyImport(db, prev, [{ index: 0, name: "treino a" }])).rejects.toThrow(/Já existe um treino chamado/);
    expect(await db.workouts.count()).toBe(3);
    await applyImport(db, prev, [{ index: 0, name: suggestName("Treino A", ["Treino A", "Treino B", "Treino C"]) }]);
    expect((await db.workouts.toArray()).some((w) => w.name === "Treino A (2)")).toBe(true);
  });
  it("dois treinos escolhidos com o mesmo nome: recusa e não grava nenhum", async () => {
    const prev = await buildPreview(db, two());
    await expect(applyImport(db, prev, [{ index: 0, name: "Igual" }, { index: 1, name: "igual" }])).rejects.toThrow(/Já existe/);
    expect(await db.workouts.count()).toBe(3);
  });
  it("nenhum selecionado e limite total de treinos", async () => {
    const prev = await buildPreview(db, two());
    await expect(applyImport(db, prev, [])).rejects.toThrow(/pelo menos um/);
    for (let i = 0; i < 47; i++) await db.workouts.add({ id: "w" + i, name: "W" + i, order: 10 + i, items: [{ exerciseId: "leg-press", sets: 3, repMin: 8, repMax: 10, restSec: 60 }] });
    await expect(applyImport(db, prev, [{ index: 0, name: "N1" }, { index: 1, name: "N2" }])).rejects.toThrow(/no máximo 50/);
  });
  it("reaproveita exercício próprio que já existe (mesmo nome) em vez de duplicar", async () => {
    await addExercise(db, { name: "Remada nova", muscle: "costas", equipment: "", cue: "" });
    const prev = await buildPreview(db, two());
    expect(prev.newExercises).toEqual([]);
  });
  it("ida e volta: exportar só treinos e importar em outro banco", async () => {
    const ex = await addExercise(db, { name: "Prancha lateral", muscle: "abdomen", equipment: "", cue: "Corpo reto." });
    const w = (await db.workouts.get("A"))!; w.items.push({ exerciseId: ex.id, sets: 2, repMin: 10, repMax: 10, restSec: 45 });
    await db.workouts.put(w);
    const json = JSON.stringify(await exportPlan(db));
    expect(JSON.parse(json).sessions).toBeUndefined();
    const other = new TreinoDB("pi2-" + Math.random()); await seedIfEmpty(other);
    const prev = await buildPreview(other, parsePlanText(json));
    expect(prev.workouts).toHaveLength(3);
    await applyImport(other, prev, [{ index: 0, name: "A importado" }]);
    const got = (await other.workouts.toArray()).find((x) => x.name === "A importado")!;
    const last = got.items.at(-1)!;
    expect((await other.exercises.get(last.exerciseId))?.name).toBe("Prancha lateral");
    expect(last).toMatchObject({ sets: 2, repMin: 10, repMax: 10, restSec: 45 });
  });
  it("sugere nomes livres", () => {
    expect(suggestName("A", [])).toBe("A");
    expect(suggestName("A", ["a"])).toBe("A (2)");
    expect(suggestName("A", ["A", "A (2)"])).toBe("A (3)");
    expect(suggestName("N".repeat(40), ["N".repeat(40)]).length).toBeLessThanOrEqual(40);
  });
});
