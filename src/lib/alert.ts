let shared: AudioContext | undefined;

function ctxFor(): AudioContext | undefined {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return undefined;
  shared ??= new Ctx();
  return shared;
}

/** Chamar num toque do usuário: navegadores (iOS) só liberam o som depois de um gesto. */
export function primeAudio(): void {
  try { void ctxFor()?.resume(); } catch { /* sem suporte */ }
}

/** Aviso de fim do descanso: vibração e bipe. Tolera aparelhos/navegadores sem suporte. */
export function notifyRestOver(): void {
  try { navigator.vibrate?.([250, 120, 250]); } catch { /* sem suporte */ }
  try {
    const ctx = ctxFor();
    if (!ctx) return;
    void ctx.resume();
    const beep = (at: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.3);
    };
    beep(0); beep(0.35);
  } catch { /* sem suporte */ }
}
