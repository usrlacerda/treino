import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { addToWorkout } from "../db/plan";
import type { Exercise, Workout } from "../db/types";
import { plural } from "../lib/format";
import { Icon } from "./Icon";
import { useBackClose } from "../lib/useBackClose";


interface Props {
  db: TreinoDB;
  ex: Exercise;
  onClose: () => void;
  /** adicionou a um treino que já existia */
  onAdded: (message: string) => void;
  /** quer um treino novo começando por este exercício */
  onCreate: (ex: Exercise) => void;
}

/** Escolha do treino que vai receber o exercício: os que já existem ou um novo. */
export function AddToWorkout({ db, ex, onClose, onAdded, onCreate }: Props) {
  useBackClose(true, onClose);
  const [workouts, setWorkouts] = useState<Workout[]>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let on = true;
    void db.workouts.orderBy("order").toArray().then((w) => on && setWorkouts(w));
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => { on = false; window.removeEventListener("keydown", h); };
  }, [db, onClose]);

  async function add(w: Workout) {
    try {
      await addToWorkout(db, w.id, ex);
      onAdded(`${ex.name} foi adicionado ao ${w.name}.`);
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog addto" role="dialog" aria-modal="true" aria-labelledby="at-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="at-t">Adicionar a um treino</h2>
        <p className="muted">{ex.name}</p>
        {error && <p className="error block" role="alert">{error}</p>}
        <ul className="addto-list">
          {(workouts ?? []).map((w) => {
            const has = w.items.some((i) => i.exerciseId === ex.id);
            return (
              <li key={w.id}>
                <button className="btn ghost wide addto-item" disabled={has} onClick={() => void add(w)} aria-label={has ? `${w.name}, já tem este exercício` : `Adicionar ao ${w.name}`}>
                  <span><strong>{w.name}</strong><span className="muted"> · {has ? "já tem este exercício" : plural(w.items.length, "exercício", "exercícios")}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
        <button className="btn wide" onClick={() => onCreate(ex)}><Icon name="add" size={20} />Criar treino novo com este exercício</button>
        <button className="btn tonal" onClick={onClose}><Icon name="close" size={20} />Cancelar</button>
      </div>
    </div>
  );
}
