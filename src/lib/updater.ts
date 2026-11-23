import { useSyncExternalStore } from "react";

let available = false;
let apply: (() => void) | undefined;
const subs = new Set<() => void>();

/** Chamado pelo service worker quando há versão nova; a troca só acontece quando a pessoa pedir. */
export function setUpdateAvailable(fn: () => void) {
  available = true;
  apply = fn;
  subs.forEach((s) => s());
}

export function useUpdate() {
  const a = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => available);
  return { available: a, apply: () => apply?.() };
}
