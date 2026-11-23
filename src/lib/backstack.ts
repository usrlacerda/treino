/**
 * Botão voltar do Android para janelas e subtelas.
 * Cada janela aberta ganha uma entrada no histórico do navegador; "voltar" fecha só a de cima,
 * e fechar pela tela remove a entrada (sem exigir dois "voltar").
 */
interface Entry { close: () => void; tok: number }
const stack: Entry[] = [];
const pending: number[] = []; // entradas de janelas já fechadas, ainda não removidas do histórico (permite trocar uma janela por outra sem mexer nele)
let counter = 0;
let ignore = 0; // popstates causados por nós mesmos
const dlgOf = () => (history.state as { dlg?: number } | null)?.dlg;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    if (ignore > 0) { ignore--; return; }
    stack.pop()?.close();
    // Caiu numa entrada de janela que já não existe (a tela mudou enquanto ela estava aberta): pula.
    if (!stack.length && !pending.length && dlgOf()) { ignore++; history.back(); }
  });
}

function flush() {
  if (!pending.length) return;
  const toks = pending.splice(0);
  // Só remove se a entrada de cima ainda é nossa; se a tela já navegou, a entrada fica e é pulada depois.
  if (!toks.includes(dlgOf() ?? -1)) return;
  ignore++;
  history.go(-(stack.length ? 1 : toks.length));
}

/** Registra uma janela aberta. Devolve a função que deve rodar quando a tela a fecha por conta própria. */
export function pushBack(close: () => void): () => void {
  const entry: Entry = { close, tok: 0 };
  stack.push(entry);
  if (pending.length) entry.tok = pending.pop()!;
  else { entry.tok = ++counter; history.pushState({ ...(history.state ?? {}), dlg: entry.tok }, ""); }
  return () => {
    const i = stack.indexOf(entry);
    if (i < 0) return; // já foi fechada pelo botão voltar
    stack.splice(i, 1);
    pending.push(entry.tok);
    setTimeout(flush, 0);
  };
}

/** Quantas entradas de janela estão no histórico acima da tela atual; zera as pendentes. */
export function unwindDialogs(): number {
  const n = stack.length + pending.length;
  pending.length = 0;
  return n;
}
