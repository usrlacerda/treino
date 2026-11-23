import type { Session } from "../db/types";

/** Carga máxima estimada para 1 repetição (fórmula de Epley). */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

export interface SessionPoint { sessionId: number; date: number; topWeight: number; topReps: number; volume: number }
export interface Record1 { weightKg: number; reps: number; date: number }
export interface Records { maxWeight: Record1; bestE1rm: Record1 & { e1rm: number } }

const finished = (sessions: Session[]) =>
  sessions.filter((s) => s.finishedAt !== undefined && s.id !== undefined).sort((a, b) => a.startedAt - b.startedAt);

/** Um ponto por treino concluído: a série mais pesada do exercício (empate: mais repetições). */
export function pointsFor(sessions: Session[], exerciseId: string): SessionPoint[] {
  const out: SessionPoint[] = [];
  for (const s of finished(sessions)) {
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId && x.weightKg > 0 && x.reps > 0);
    if (!sets.length) continue;
    const top = sets.reduce((a, b) => (b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a));
    out.push({ sessionId: s.id!, date: s.startedAt, topWeight: top.weightKg, topReps: top.reps,
      volume: sets.reduce((v, x) => v + x.weightKg * x.reps, 0) });
  }
  return out;
}

export function personalRecords(sessions: Session[], exerciseId: string): Records | null {
  let maxW: Record1 | null = null;
  let best: (Record1 & { e1rm: number }) | null = null;
  for (const s of finished(sessions)) {
    for (const x of s.sets) {
      if (x.exerciseId !== exerciseId || x.weightKg <= 0 || x.reps <= 0) continue;
      const cand = { weightKg: x.weightKg, reps: x.reps, date: s.startedAt };
      if (!maxW || x.weightKg > maxW.weightKg || (x.weightKg === maxW.weightKg && x.reps > maxW.reps)) maxW = cand;
      const e = e1rm(x.weightKg, x.reps);
      if (!best || e > best.e1rm) best = { ...cand, e1rm: e };
    }
  }
  return maxW && best ? { maxWeight: maxW, bestE1rm: best } : null;
}

export function sessionVolume(s: Session): number {
  return s.sets.reduce((v, x) => v + x.weightKg * x.reps, 0);
}
