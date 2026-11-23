const KEY = "treino:weeklyGoal";
export const DEFAULT_GOAL = 3;

/** Meta de treinos por semana (1 a 7), guardada só neste aparelho. */
export function getGoal(): number {
  try { const n = Number(localStorage.getItem(KEY)); return Number.isInteger(n) && n >= 1 && n <= 7 ? n : DEFAULT_GOAL; } catch { return DEFAULT_GOAL; }
}
export function setGoal(n: number): void {
  try { localStorage.setItem(KEY, String(Math.min(7, Math.max(1, Math.round(n))))); } catch { /* sem armazenamento */ }
}
