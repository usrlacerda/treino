import type { TreinoDB } from "./db";
import { exercises as seedExercises } from "./seed";
import { validateWorkout } from "./plan";
import { MUSCLES } from "../lib/muscles";
import type { Exercise, LoggedSet, Session, Workout } from "./types";

export const BACKUP_APP = "treino";
export const BACKUP_SCHEMA = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface Backup {
  app: typeof BACKUP_APP;
  schema: number;
  exportedAt: string;
  exercises: Exercise[]; // só os exercícios próprios
  workouts: Workout[];
  sessions: Session[];
}

export async function exportData(db: TreinoDB): Promise<Backup> {
  const [ex, workouts, sessions] = await Promise.all([db.exercises.toArray(), db.workouts.orderBy("order").toArray(), db.sessions.toArray()]);
  return { app: BACKUP_APP, schema: BACKUP_SCHEMA, exportedAt: new Date().toISOString(), exercises: ex.filter((e) => /^(custom|ds)-/.test(e.id)), workouts, sessions };
}

class BackupError extends Error {}
const bad = (msg: string): never => { throw new BackupError(msg); };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, what: string, min: number, max: number): string => {
  if (typeof v !== "string" || v.length < min || v.length > max) bad(`Arquivo inválido: ${what}.`);
  return v as string;
};
const int = (v: unknown, what: string, min: number, max: number): number => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) bad(`Arquivo inválido: ${what}.`);
  return v as number;
};
const num = (v: unknown, what: string, min: number, max: number): number => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) bad(`Arquivo inválido: ${what}.`);
  return v as number;
};
const arr = (v: unknown, what: string, max: number): unknown[] => {
  if (!Array.isArray(v) || v.length > max) bad(`Arquivo inválido: ${what}.`);
  return v as unknown[];
};

/** Valida e reconstrói o backup campo a campo (nada do arquivo é usado como veio). */
export function parseBackup(raw: unknown): Backup {
  if (!isObj(raw) || raw.app !== BACKUP_APP) return bad("Este arquivo não é um backup do Treino.");
  if (raw.schema !== BACKUP_SCHEMA) return bad("Este backup é de uma versão que o app não reconhece.");
  const exportedAt = str(raw.exportedAt, "data do backup", 1, 40);

  const seedIds = new Set(seedExercises.map((e) => e.id));
  const exercises = arr(raw.exercises, "lista de exercícios", 500).map((e): Exercise => {
    if (!isObj(e)) return bad("Arquivo inválido: exercício.");
    const id = str(e.id, "id do exercício", 5, 64);
    if (!/^(custom|ds)-[a-z0-9-]+$/.test(id)) bad("Arquivo inválido: id de exercício próprio.");
    const muscle = e.muscle as never;
    if (!MUSCLES.includes(muscle)) bad("Arquivo inválido: grupo muscular.");
    return { id, name: str(e.name, "nome do exercício", 1, 60), muscle, equipment: str(e.equipment, "equipamento", 0, 40), cue: str(e.cue, "dica", 0, 200) };
  });
  const customIds = new Set(exercises.map((e) => e.id));
  if (customIds.size !== exercises.length) bad("Arquivo inválido: exercícios repetidos.");
  const known = new Set([...seedIds, ...customIds]);

  const workouts = arr(raw.workouts, "lista de treinos", 50).map((w): Workout => {
    if (!isObj(w)) return bad("Arquivo inválido: treino.");
    const items = arr(w.items, "exercícios do treino", 20).map((i) => {
      if (!isObj(i)) return bad("Arquivo inválido: item do treino.");
      const item = {
        exerciseId: str(i.exerciseId, "exercício do treino", 1, 64), sets: num(i.sets, "séries", 0, 10), repMin: num(i.repMin, "repetições mínimas", 0, 50),
        repMax: num(i.repMax, "repetições máximas", 0, 50), restSec: num(i.restSec, "descanso", 0, 600),
        ...(i.durationMin !== undefined ? { durationMin: num(i.durationMin, "duração", 1, 180) } : {}),
      };
      return item;
    });
    const out: Workout = { id: str(w.id, "id do treino", 1, 40), name: str(w.name, "nome do treino", 1, 40), order: int(w.order, "ordem do treino", 0, 1000), items };
    const errs = validateWorkout(out, known);
    if (errs.length) bad(`Arquivo inválido no treino “${out.name}”: ${errs[0]}`);
    return out;
  });
  if (workouts.length < 1) bad("O backup não tem nenhum treino.");
  if (new Set(workouts.map((w) => w.id)).size !== workouts.length) bad("Arquivo inválido: treinos repetidos.");

  const workoutIds = new Set(workouts.map((w) => w.id));
  const usedIds = new Set<number>();
  const sessions = arr(raw.sessions, "lista de sessões", 50_000).map((s): Session => {
    if (!isObj(s)) return bad("Arquivo inválido: sessão.");
    const id = int(s.id, "id da sessão", 1, 2_000_000_000);
    if (usedIds.has(id)) bad("Arquivo inválido: sessões repetidas.");
    usedIds.add(id);
    const workoutId = str(s.workoutId, "treino da sessão", 1, 40);
    if (!workoutIds.has(workoutId)) bad("Arquivo inválido: sessão de um treino que não existe no backup.");
    const startedAt = int(s.startedAt, "início da sessão", 1, 8.64e15);
    const sets = arr(s.sets, "séries da sessão", 500).map((x): LoggedSet => {
      if (!isObj(x)) return bad("Arquivo inválido: série.");
      const exerciseId = str(x.exerciseId, "exercício da série", 1, 64);
      if (!known.has(exerciseId)) bad("Arquivo inválido: série de um exercício que não existe no backup.");
      return {
        exerciseId, setIndex: int(x.setIndex, "número da série", 0, 99),
        weightKg: num(x.weightKg, "carga", 0, 1000), reps: int(x.reps, "repetições", 0, 1000), doneAt: int(x.doneAt, "hora da série", 1, 8.64e15),
      };
    });
    return { id, workoutId, startedAt, ...(s.finishedAt !== undefined ? { finishedAt: int(s.finishedAt, "fim da sessão", 1, 8.64e15) } : {}), sets };
  });

  return { app: BACKUP_APP, schema: BACKUP_SCHEMA, exportedAt, exercises, workouts, sessions };
}

export function parseBackupText(text: string): Backup {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return bad("O arquivo não é um backup válido (não é JSON)."); }
  return parseBackup(raw);
}

export const isBackupError = (e: unknown): e is Error => e instanceof BackupError;

/** Substitui tudo de uma vez: se algo falhar, nada muda. */
export async function importBackup(db: TreinoDB, b: Backup): Promise<void> {
  await db.transaction("rw", db.exercises, db.workouts, db.sessions, async () => {
    await db.exercises.clear();
    await db.workouts.clear();
    await db.sessions.clear();
    await db.exercises.bulkAdd([...seedExercises, ...b.exercises]);
    await db.workouts.bulkAdd(b.workouts);
    await db.sessions.bulkAdd(b.sessions);
  });
}

export const backupFileName = (d = new Date()) => `treino-backup-${d.toISOString().slice(0, 10)}.json`;
