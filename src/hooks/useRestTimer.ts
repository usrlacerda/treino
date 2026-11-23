import { useCallback, useEffect, useRef, useState } from "react";
import { remainingSec } from "../lib/time";

interface Timer { endAt: number; label: string; total: number }

/** Contagem baseada no relógio (não em ticks), para continuar correta com a tela apagada. */
export function useRestTimer(onFinish: () => void) {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const finish = useRef(onFinish);
  finish.current = onFinish;

  useEffect(() => {
    if (!timer) return;
    let fired = false; // garante um único aviso por contagem
    const tick = () => {
      if (fired) return;
      const t = Date.now();
      setNow(t);
      if (remainingSec(timer.endAt, t) === 0) {
        fired = true;
        clearInterval(id);
        setTimer(null);
        finish.current();
      }
    };
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    tick();
    return () => { fired = true; clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [timer]);

  const start = useCallback((sec: number, label: string) => {
    if (sec <= 0) return;
    setNow(Date.now());
    setTimer({ endAt: Date.now() + sec * 1000, label, total: sec });
  }, []);
  const adjust = useCallback((deltaSec: number) => {
    setTimer((t) => (t ? { ...t, endAt: t.endAt + deltaSec * 1000, total: Math.max(1, t.total + deltaSec) } : t));
  }, []);
  const skip = useCallback(() => setTimer(null), []);

  return { active: !!timer, label: timer?.label ?? "", remaining: timer ? remainingSec(timer.endAt, now) : 0, total: timer?.total ?? 0, start, adjust, skip };
}
