import { formatClock } from "../lib/time";

interface Props { remaining: number; total: number; label: string; onAdjust: (d: number) => void; onSkip: () => void }

export function RestTimer({ remaining, total, label, onAdjust, onSkip }: Props) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;
  return (
    <div className="rest" role="timer" aria-live="off" aria-label="Descanso">
      <div className="rest-main">
        <div className="rest-label muted">Descanso · {label}</div>
        <div className="rest-clock">{formatClock(remaining)}</div>
        <div className="rest-bar" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="rest-actions">
        <button onClick={() => onAdjust(-15)} aria-label="Menos 15 segundos">−15s</button>
        <button onClick={() => onAdjust(15)} aria-label="Mais 15 segundos">+15s</button>
        <button onClick={onSkip}>Pular</button>
      </div>
    </div>
  );
}
