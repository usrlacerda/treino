import { useBackClose } from "../lib/useBackClose";

interface Props {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  /** ação que não dá para desfazer: o foco começa em "cancelar" */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Pergunta antes de uma ação difícil de desfazer. O botão voltar do aparelho equivale a cancelar. */
export function ConfirmDialog({ title, text, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: Props) {
  useBackClose(true, onCancel);
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-d">
        <h2 id="cf-t">{title}</h2>
        <p id="cf-d" className="muted">{text}</p>
        <button className={"btn" + (danger ? " danger" : "")} autoFocus={!danger} onClick={onConfirm}>{confirmLabel}</button>
        <button className="btn ghost" autoFocus={danger} onClick={onCancel}>{cancelLabel}</button>
      </div>
    </div>
  );
}
