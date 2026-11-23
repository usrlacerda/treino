import type { TreinoDB } from "./db";
import { validateWorkout } from "./plan";
import { MUSCLES } from "../lib/muscles";
import { exercises as seedExercises } from "./seed";
import { migrateId } from "./legacy";
import type { Exercise, Muscle, PlanItem, Workout } from "./types";

export const PLAN_KIND = "plano";
export const MAX_FILE_WORKOUTS = 20;
export const MAX_WORKOUTS_TOTAL = 50;

export class PlanImportError extends Error {}
const bad = (m: string): never => { throw new PlanImportError(m); };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").trim();
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

interface FileExercise { id?: string; name: string; muscle: Muscle; equipment: string; cue: string }
interface FileItem { exerciseId?: string; exerciseName?: string; muscle?: Muscle; sets: number; repMin: number; repMax: number; restSec: number; durationMin?: number }
export interface FileWorkout { name: string; items: FileItem[] }
export interface PlanFile { exercises: FileExercise[]; workouts: FileWorkout[] }

function text(v: unknown, what: string, min: number, max: number): string {
  if (typeof v !== "string" || v.trim().length < min || v.length > max) bad(`Arquivo inválido: ${what}.`);
  return (v as string).trim();
}
function numField(v: unknown, def: number, what: string): number {
  if (v === undefined) return def;
  if (typeof v !== "number" || !Number.isFinite(v)) bad(`Arquivo inválido: ${what}.`);
  return v as number;
}
/** "8-12", "12", 12 → [min, max] */
function parseReps(i: Record<string, unknown>): [number, number] {
  if (i.reps !== undefined) {
    const m = /^\s*(\d{1,2})\s*(?:[-–a]\s*(\d{1,2}))?\s*$/.exec(String(i.reps));
    if (!m) return bad("Arquivo inválido: repetições (use, por exemplo, \"8-12\" ou \"12\").");
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    return [a, b];
  }
  return [numField(i.repMin, 8, "repetições mínimas"), numField(i.repMax, 12, "repetições máximas")];
}

/** Aceita um arquivo de plano ou um backup completo (só os treinos são usados). */
export function parsePlanText(raw: string): PlanFile {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return bad("O arquivo não é válido (não é JSON)."); }
  if (!isObj(data) || data.app !== "treino") return bad("Este arquivo não é do Treino. Baixe o modelo para ver o formato.");
  if (data.schema !== 1) return bad("Este arquivo é de uma versão que o app não reconhece.");
  if (!Array.isArray(data.workouts) || data.workouts.length < 1) return bad("O arquivo não tem nenhum treino.");
  if (data.workouts.length > MAX_FILE_WORKOUTS) return bad(`O arquivo tem treinos demais (máximo de ${MAX_FILE_WORKOUTS} por importação).`);

  const exercises: FileExercise[] = [];
  if (data.exercises !== undefined) {
    if (!Array.isArray(data.exercises) || data.exercises.length > 200) return bad("Arquivo inválido: lista de exercícios.");
    for (const e of data.exercises) {
      if (!isObj(e)) return bad("Arquivo inválido: exercício.");
      if (!MUSCLES.includes(e.muscle as Muscle)) return bad("Arquivo inválido: grupo muscular de um exercício.");
      const id = e.id === undefined ? undefined : text(e.id, "id do exercício", 5, 64);
      if (id && !/^(custom|ds)-[a-z0-9-]+$/.test(id)) return bad("Arquivo inválido: id de exercício próprio.");
      exercises.push({ id, name: text(e.name, "nome do exercício", 1, 60), muscle: e.muscle as Muscle,
        equipment: e.equipment === undefined ? "Livre" : text(e.equipment, "equipamento", 0, 40) || "Livre",
        cue: e.cue === undefined ? "" : text(e.cue, "dica", 0, 200) });
    }
  }

  const workouts = data.workouts.map((w): FileWorkout => {
    if (!isObj(w)) return bad("Arquivo inválido: treino.");
    const name = text(w.name, "nome do treino", 1, 40);
    if (!Array.isArray(w.items) || w.items.length < 1 || w.items.length > 20) return bad(`Arquivo inválido: o treino “${name}” precisa de 1 a 20 exercícios.`);
    const items = w.items.map((i): FileItem => {
      if (!isObj(i)) return bad(`Arquivo inválido: item do treino “${name}”.`);
      const exerciseId = i.exerciseId === undefined ? undefined : text(i.exerciseId, "id do exercício", 1, 64);
      const exerciseName = (i.exerciseName ?? i.exercise) === undefined ? undefined : text(i.exerciseName ?? i.exercise, "nome do exercício", 1, 60);
      if (!exerciseId && !exerciseName) return bad(`Arquivo inválido: um item do treino “${name}” não diz qual é o exercício.`);
      if (i.muscle !== undefined && !MUSCLES.includes(i.muscle as Muscle)) return bad("Arquivo inválido: grupo muscular de um item.");
      const [repMin, repMax] = parseReps(i);
      const item: FileItem = { exerciseId, exerciseName, muscle: i.muscle as Muscle | undefined, sets: numField(i.sets, 3, "séries"), repMin, repMax, restSec: numField(i.restSec ?? i.rest, 60, "descanso") };
      if (i.durationMin !== undefined) item.durationMin = numField(i.durationMin, 15, "duração");
      return item;
    });
    return { name, items };
  });
  return { exercises, workouts };
}

export interface PreviewWorkout { name: string; items: PlanItem[] }
export interface ImportPreview { workouts: PreviewWorkout[]; newExercises: Exercise[] }

const newId = () => `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Liga cada item a um exercício da biblioteca (ou a um novo exercício próprio) e valida os limites. */
export async function buildPreview(db: TreinoDB, plan: PlanFile): Promise<ImportPreview> {
  const existing = await db.exercises.toArray();
  const byId = new Map(existing.map((e) => [e.id, e]));
  const byName = new Map(existing.map((e) => [norm(e.name), e]));
  const created = new Map<string, Exercise>(); // chave: nome normalizado
  const fileByName = new Map(plan.exercises.map((e) => [norm(e.name), e]));
  const fileById = new Map(plan.exercises.filter((e) => e.id).map((e) => [e.id!, e]));
  const unknown = new Set<string>();

  const make = (f: FileExercise): Exercise => {
    const key = norm(f.name);
    let ex = created.get(key);
    if (!ex) {
      const id = f.id && !byId.has(f.id) && ![...created.values()].some((c) => c.id === f.id) ? f.id : newId();
      ex = { id, name: f.name, muscle: f.muscle, equipment: f.equipment, cue: f.cue };
      created.set(key, ex);
    }
    return ex;
  };

  const resolve = (raw: FileItem): string | undefined => {
    const it = raw.exerciseId ? { ...raw, exerciseId: migrateId(raw.exerciseId) } : raw;
    if (it.exerciseId && byId.has(it.exerciseId)) return it.exerciseId;
    const asFile: FileExercise | undefined = (it.exerciseId ? fileById.get(it.exerciseId) : undefined) ?? (it.exerciseName ? fileByName.get(norm(it.exerciseName)) : undefined);
    const nm = it.exerciseName ?? asFile?.name ?? it.exerciseId ?? "";
    const hit = byName.get(norm(nm));
    if (hit) return hit.id;
    if (asFile) return make(asFile).id;
    if (it.exerciseName && it.muscle) return make({ name: it.exerciseName, muscle: it.muscle, equipment: "Livre", cue: "" }).id;
    unknown.add(it.exerciseName ?? it.exerciseId ?? "?");
    return undefined;
  };

  const workouts = plan.workouts.map((w): PreviewWorkout => ({
    name: w.name,
    items: w.items.map((it): PlanItem => ({
      exerciseId: resolve(it) ?? "",
      sets: it.durationMin !== undefined ? 1 : it.sets,
      repMin: it.durationMin !== undefined ? 0 : it.repMin,
      repMax: it.durationMin !== undefined ? 0 : it.repMax,
      restSec: it.durationMin !== undefined ? 0 : it.restSec,
      ...(it.durationMin !== undefined ? { durationMin: it.durationMin } : {}),
    })),
  }));

  if (unknown.size) {
    const list = [...unknown].slice(0, 5).map((n) => `“${n}”`).join(", ");
    bad(`Não encontramos estes exercícios na biblioteca: ${list}${unknown.size > 5 ? " e outros" : ""}. Use o nome igual ao da Biblioteca ou informe o grupo muscular (campo "muscle") para criar o exercício.`);
  }
  const known = new Set([...existing.map((e) => e.id), ...[...created.values()].map((e) => e.id)]);
  for (const w of workouts) {
    const errs = validateWorkout({ id: "x", name: w.name, order: 0, items: w.items }, known);
    if (errs.length) bad(`No treino “${w.name}”: ${errs[0]}`);
  }
  return { workouts, newExercises: [...created.values()] };
}

export interface Selection { index: number; name: string }

/** Nome livre: se já existir, sugere "Nome (2)", "Nome (3)"… */
export function suggestName(name: string, taken: string[]): string {
  const t = new Set(taken.map(norm));
  if (!t.has(norm(name))) return name;
  for (let n = 2; n < 100; n++) { const c = `${name.slice(0, 40 - String(n).length - 3)} (${n})`; if (!t.has(norm(c))) return c; }
  return name;
}

/** Adiciona os treinos escolhidos (e só os exercícios novos que eles usam). Não apaga nada. */
export async function applyImport(db: TreinoDB, preview: ImportPreview, selected: Selection[]): Promise<number> {
  if (!selected.length) bad("Escolha pelo menos um treino para importar.");
  await db.transaction("rw", db.exercises, db.workouts, async () => {
    const current = await db.workouts.toArray();
    if (current.length + selected.length > MAX_WORKOUTS_TOTAL) bad(`Você pode ter no máximo ${MAX_WORKOUTS_TOTAL} treinos.`);
    const names = new Set(current.map((w) => norm(w.name)));
    const known = new Set((await db.exercises.toArray()).map((e) => e.id));
    for (const e of preview.newExercises) known.add(e.id);
    const used = new Set<string>();
    let order = Math.max(0, ...current.map((w) => w.order));
    const toAdd: Workout[] = [];
    for (const s of selected) {
      const src = preview.workouts[s.index];
      if (!src) bad("Treino não encontrado na pré-visualização.");
      const name = s.name.trim();
      if (name.length < 1 || name.length > 40) bad("O nome do treino deve ter de 1 a 40 caracteres.");
      if (names.has(norm(name))) bad(`Já existe um treino chamado “${name}”. Mude o nome.`);
      names.add(norm(name));
      const w: Workout = { id: `plano-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name, order: ++order, items: src.items.map((i) => ({ ...i })) };
      const errs = validateWorkout(w, known);
      if (errs.length) bad(`No treino “${name}”: ${errs[0]}`);
      w.items.forEach((i) => used.add(i.exerciseId));
      toAdd.push(w);
    }
    const mine = preview.newExercises.filter((e) => used.has(e.id));
    if (mine.length) await db.exercises.bulkAdd(mine);
    await db.workouts.bulkAdd(toAdd);
  });
  return selected.length;
}

/** Arquivo só com treinos (e os exercícios próprios que eles usam), para compartilhar. */
export async function exportPlan(db: TreinoDB) {
  const [workouts, ex] = await Promise.all([db.workouts.orderBy("order").toArray(), db.exercises.toArray()]);
  const used = new Set(workouts.flatMap((w) => w.items.map((i) => i.exerciseId)));
  return {
    app: "treino", kind: PLAN_KIND, schema: 1, exportedAt: new Date().toISOString(),
    exercises: ex.filter((e) => /^(custom|ds)-/.test(e.id) && used.has(e.id)).map(({ id, name, muscle, equipment, cue }) => ({ id, name, muscle, equipment, cue })),
    workouts: workouts.map((w) => ({ name: w.name, items: w.items.map((i) => ({ ...i })) })),
  };
}

/** Modelo de arquivo escrito à mão: usa nomes de exercício e "reps". */
export function planTemplate() {
  const names = new Map(seedExercises.map((e) => [e.id, e.name]));
  const n = (id: string) => names.get(id) ?? id;
  return {
    app: "treino", kind: PLAN_KIND, schema: 1,
    comentario: "Edite os treinos abaixo. Use o nome do exercício igual ao da Biblioteca, ou informe \"muscle\" (peito, costas, ombros, biceps, triceps, quadriceps, posterior, gluteos, panturrilha, abdomen, cardio) para criar um exercício novo.",
    workouts: [{
      name: "Treino D (exemplo)",
      items: [
        { exerciseName: n("ds-1463"), sets: 3, reps: "10-12", restSec: 90 },
        { exerciseName: n("ds-1299"), sets: 3, reps: "10-12", restSec: 75 },
        { exerciseName: "Remada curvada com barra", muscle: "costas", sets: 3, reps: "8-10", restSec: 75 },
        { exerciseName: n("ds-3666"), durationMin: 15 },
      ],
    }],
  };
}
