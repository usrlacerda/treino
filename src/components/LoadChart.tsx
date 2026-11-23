import { formatDate } from "../lib/time";
import { fmtNum, plural } from "../lib/format";
import type { SessionPoint } from "../lib/stats";

export function LoadChart({ points, title }: { points: SessionPoint[]; title: string }) {
  if (points.length === 0) return <p className="muted">Sem registros deste exercício ainda.</p>;
  const W = 320, H = 160, P = { l: 36, r: 12, t: 12, b: 24 };
  const ws = points.map((p) => p.topWeight);
  const min = Math.min(...ws), max = Math.max(...ws);
  const lo = min === max ? min - 1 : min, hi = min === max ? max + 1 : max;
  const x = (i: number) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (points.length - 1));
  const y = (v: number) => H - P.b - ((v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.topWeight).toFixed(1)}`).join(" ");
  const summary = `${title}: de ${fmtNum(ws[0])} kg para ${fmtNum(ws[ws.length - 1])} kg em ${plural(points.length, "treino", "treinos")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="chart">
      <line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} stroke="var(--line)" />
      <text x={P.l - 6} y={y(hi) + 4} textAnchor="end" className="axis">{fmtNum(hi)} kg</text>
      <text x={P.l - 6} y={y(lo) + 4} textAnchor="end" className="axis">{fmtNum(lo)} kg</text>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={p.sessionId} cx={x(i)} cy={y(p.topWeight)} r="4" fill="var(--accent)" />)}
      <text x={x(0)} y={H - 6} textAnchor="start" className="axis">{formatDate(points[0].date)}</text>
      {points.length > 1 && <text x={x(points.length - 1)} y={H - 6} textAnchor="end" className="axis">{formatDate(points[points.length - 1].date)}</text>}
    </svg>
  );
}
