import { useEffect } from "react";

/** Mantém a tela acesa enquanto `active`; pede de novo ao voltar para o app. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let stopped = false;
    const ask = async () => {
      try { const l = await navigator.wakeLock.request("screen"); if (stopped) void l.release(); else lock = l; } catch { /* sem permissão ou bateria baixa */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void ask(); };
    void ask();
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; document.removeEventListener("visibilitychange", onVisible); void lock?.release().catch(() => undefined); };
  }, [active]);
}
