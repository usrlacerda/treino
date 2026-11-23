import type { Session } from "../db/types";

export const volumeOf = (s: Session) => s.sets.reduce((v, x) => v + x.weightKg * x.reps, 0);

/** Segunda-feira 00:00 (hora local) da semana de `ms`. */
export function weekStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
const addDays = (ms: number, n: number) => { const d = new Date(ms); d.setDate(d.getDate() + n); return d.getTime(); };

export interface WeekSummary {
  /** segunda a domingo: houve treino concluído naquele dia? */
  days: boolean[];
  /** posição de hoje na semana (0 = segunda) */
  today: number;
  count: number;
  volume: number;
  prevVolume: number;
  prevCount: number;
  /** semanas seguidas (contando a atual, se já treinou) com pelo menos um treino */
  streakWeeks: number;
}

export function summarizeWeek(sessions: Session[], now = Date.now()): WeekSummary {
  const done = sessions.filter((s) => s.finishedAt !== undefined);
  const start = weekStart(now);
  const prevStart = addDays(start, -7);
  const days = Array<boolean>(7).fill(false);
  let count = 0, volume = 0, prevVolume = 0, prevCount = 0;
  for (const s of done) {
    if (s.startedAt >= start) {
      count++; volume += volumeOf(s);
      days[Math.min(6, Math.floor((new Date(s.startedAt).setHours(0, 0, 0, 0) - start) / 86_400_000 + 0.5))] = true;
    } else if (s.startedAt >= prevStart) { prevCount++; prevVolume += volumeOf(s); }
  }
  const weeks = new Set(done.map((s) => weekStart(s.startedAt)));
  let streakWeeks = 0;
  let w = weeks.has(start) ? start : prevStart; // semana atual ainda em aberto não quebra a sequência
  while (weeks.has(w)) { streakWeeks++; w = addDays(w, -7); }
  return { days, today: (new Date(now).getDay() + 6) % 7, count, volume, prevVolume, prevCount, streakWeeks };
}

/** "hoje", "ontem", "há 3 dias"… */
export function relativeDay(ms: number, now = Date.now()): string {
  const a = new Date(ms).setHours(0, 0, 0, 0), b = new Date(now).setHours(0, 0, 0, 0);
  const n = Math.round((b - a) / 86_400_000);
  if (n <= 0) return "hoje";
  if (n === 1) return "ontem";
  if (n < 14) return `há ${n} dias`;
  return `há ${Math.floor(n / 7)} semanas`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
