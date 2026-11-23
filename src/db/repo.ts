import type { TreinoDB } from "./db";
import type { LoggedSet, Session } from "./types";

export async function startSession(db: TreinoDB, workoutId: string): Promise<number> {
  return db.sessions.add({ workoutId, startedAt: Date.now(), sets: [] });
}

export async function logSet(db: TreinoDB, sessionId: number, set: LoggedSet): Promise<void> {
  const updated = await db.sessions.where(":id").equals(sessionId).modify((s) => {
    const i = s.sets.findIndex((x) => x.exerciseId === set.exerciseId && x.setIndex === set.setIndex);
    if (i >= 0) s.sets[i] = set;
    else s.sets.push(set);
  });
  if (updated === 0) throw new Error(`Sessão ${sessionId} não existe`);
}

export async function finishSession(db: TreinoDB, sessionId: number): Promise<void> {
  await db.sessions.update(sessionId, { finishedAt: Date.now() });
}

/** Última sessão concluída que contém o exercício, para mostrar "última vez". */
export async function lastSetsFor(db: TreinoDB, exerciseId: string): Promise<LoggedSet[]> {
  const done = await db.sessions.orderBy("startedAt").reverse().filter((s: Session) => !!s.finishedAt).toArray();
  for (const s of done) {
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId).sort((a, b) => a.setIndex - b.setIndex);
    if (sets.length) return sets;
  }
  return [];
}

/** Última sessão concluída de cada exercício, em uma só leitura. */
export async function lastSetsForMany(db: TreinoDB, ids: string[]): Promise<Record<string, LoggedSet[]>> {
  const out: Record<string, LoggedSet[]> = Object.fromEntries(ids.map((id) => [id, []]));
  const pending = new Set(ids);
  await db.sessions.orderBy("startedAt").reverse().until(() => pending.size === 0).each((s: Session) => {
    if (!s.finishedAt) return;
    for (const id of [...pending]) {
      const sets = s.sets.filter((x) => x.exerciseId === id).sort((a, b) => a.setIndex - b.setIndex);
      if (sets.length) { out[id] = sets; pending.delete(id); }
    }
  });
  return out;
}

/** Sugere o próximo treino: o seguinte ao último concluído (A→B→C→A). */
export async function nextWorkoutId(db: TreinoDB): Promise<string> {
  const all = await db.workouts.orderBy("order").toArray();
  if (!all.length) throw new Error("Nenhum treino cadastrado");
  const last = (await db.sessions.orderBy("startedAt").reverse().filter((s) => !!s.finishedAt).first());
  if (!last) return all[0].id;
  const i = all.findIndex((w) => w.id === last.workoutId);
  return all[(i + 1) % all.length].id;
}

export async function unlogSet(db: TreinoDB, sessionId: number, exerciseId: string, setIndex: number): Promise<void> {
  await db.sessions.where(":id").equals(sessionId).modify((s) => {
    s.sets = s.sets.filter((x) => !(x.exerciseId === exerciseId && x.setIndex === setIndex));
  });
}

/** Ao abrir o app: apaga sessões vazias e conclui as abandonadas com séries (preserva o que foi registrado). */
/** Treino aberto há menos que isto ainda pode ser retomado (ex.: o Android descartou o app entre séries). */
export const RESUME_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Ao abrir o app: apaga sessões vazias, fecha as antigas e deixa abertas as recentes com séries. */
export async function closeStaleSessions(db: TreinoDB, now = Date.now()): Promise<void> {
  const open = await db.sessions.filter((s) => s.finishedAt === undefined).toArray();
  for (const s of open) {
    if (!s.sets.length) { await db.sessions.delete(s.id!); continue; }
    const last = Math.max(...s.sets.map((x) => x.doneAt));
    if (now - last > RESUME_WINDOW_MS) await db.sessions.update(s.id!, { finishedAt: last });
  }
}

/** Treino em andamento (aberto, com séries e de um treino que ainda existe), o mais recente. */
export async function findResumable(db: TreinoDB): Promise<Session | undefined> {
  const open = (await db.sessions.filter((s) => s.finishedAt === undefined && s.sets.length > 0).toArray()).sort((a, b) => b.startedAt - a.startedAt);
  for (const s of open) {
    if (await db.workouts.get(s.workoutId)) return s;
    await db.sessions.update(s.id!, { finishedAt: Math.max(...s.sets.map((x) => x.doneAt)) });
  }
  return undefined;
}

export async function discardSession(db: TreinoDB, sessionId: number): Promise<void> {
  await db.sessions.delete(sessionId);
}

export async function listFinishedSessions(db: TreinoDB): Promise<Session[]> {
  return db.sessions.orderBy("startedAt").reverse().filter((s) => s.finishedAt !== undefined).toArray();
}
