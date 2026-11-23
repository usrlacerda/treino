import type { LoggedSet, PlanItem } from "../db/types";

export type Hint =
  | { kind: "increase"; fromKg: number; toKg: number; sets: number; reps: number }
  | { kind: "below"; weightKg: number; repMin: number };

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** Aumento de carga: 5% da carga, em múltiplos de 0,5 kg, no mínimo 1 kg. */
export function nextLoad(weightKg: number): number {
  return weightKg + Math.max(1, roundHalf(weightKg * 0.05));
}

/**
 * Progressão dupla com base na última vez:
 * - todas as séries do plano feitas e todas no topo da faixa → subir a carga;
 * - alguma série abaixo do mínimo da faixa → manter/reduzir;
 * - senão, nada a dizer (continue buscando repetições).
 * Sem dica para cardio, séries incompletas ou exercícios sem carga.
 */
export function progressionHint(item: PlanItem, last: LoggedSet[]): Hint | null {
  if (item.durationMin || item.repMax <= 0) return null;
  const sets = last.filter((s) => s.weightKg > 0);
  if (sets.length < item.sets) return null;
  const used = sets.slice(0, item.sets);
  const weight = Math.min(...used.map((s) => s.weightKg));
  if (used.every((s) => s.reps >= item.repMax)) {
    return { kind: "increase", fromKg: weight, toKg: nextLoad(weight), sets: item.sets, reps: item.repMax };
  }
  if (used.some((s) => s.reps < item.repMin)) return { kind: "below", weightKg: weight, repMin: item.repMin };
  return null;
}
