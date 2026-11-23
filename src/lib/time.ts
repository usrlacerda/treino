export function remainingSec(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
export function formatDateFull(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR");
}
