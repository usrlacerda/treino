export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateResult { perSide: number[]; achieved: number; missing: number }

/** Anilhas de cada lado da barra para chegar à carga total. `missing` é o que não dá para montar com as anilhas comuns. */
export function platesFor(totalKg: number, barKg = 20, available = PLATES): PlateResult {
  const per = (totalKg - barKg) / 2;
  if (!Number.isFinite(per) || per <= 0) return { perSide: [], achieved: Math.max(barKg, 0), missing: Math.max(0, per > 0 ? per * 2 : 0) };
  let left = Math.round(per * 1000) / 1000;
  const perSide: number[] = [];
  for (const p of [...available].sort((a, b) => b - a)) while (left + 1e-9 >= p) { perSide.push(p); left = Math.round((left - p) * 1000) / 1000; }
  return { perSide, achieved: barKg + 2 * perSide.reduce((a, b) => a + b, 0), missing: Math.round(left * 2 * 1000) / 1000 };
}
