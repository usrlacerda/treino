import type { Session } from "../db/types";
import { fmtNum, plural } from "./format";
import { formatDateFull } from "./time";

/** Resumo em texto de um treino, para enviar a quem acompanha ou guardar. */
export function sessionText(s: Session, workoutName: string, exName: (id: string) => string): string {
  const order: string[] = [];
  for (const x of [...s.sets].sort((a, b) => a.doneAt - b.doneAt)) if (!order.includes(x.exerciseId)) order.push(x.exerciseId);
  const lines = order.map((id) => {
    const sets = s.sets.filter((x) => x.exerciseId === id).sort((a, b) => a.setIndex - b.setIndex);
    return `• ${exName(id)}: ${sets.map((x) => (x.weightKg > 0 ? `${fmtNum(x.weightKg)}×${x.reps}` : `${x.reps}`)).join(", ")}`;
  });
  const volume = s.sets.reduce((v, x) => v + x.weightKg * x.reps, 0);
  return [`CG Fit · ${workoutName} · ${formatDateFull(s.startedAt)}`, ...lines, `${plural(s.sets.length, "série", "séries")} · volume ${fmtNum(volume)} kg`, ...(s.note ? [`Anotação: ${s.note}`] : [])].join("\n");
}

/** Abre o compartilhamento do aparelho; sem ele, copia o texto. Devolve o que aconteceu. */
export async function shareText(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator.share === "function") { await navigator.share({ text }); return "shared"; }
    await navigator.clipboard.writeText(text); return "copied";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "shared"; // a pessoa fechou a janela
    return "failed";
  }
}
