import { useEffect, useRef } from "react";
import { pushBack } from "./backstack";

/** Enquanto `open` for verdadeiro, o botão voltar do aparelho chama `onClose` em vez de sair da tela. */
export function useBackClose(open: boolean, onClose: () => void) {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open) return;
    return pushBack(() => cb.current());
  }, [open]);
}
