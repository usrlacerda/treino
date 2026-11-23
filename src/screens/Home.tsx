import { Icon } from "../components/Icon";
import { plural } from "../lib/format";
import { finishSession, findResumable } from "../db/repo";
import type { Session } from "../db/types";
import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { nextWorkoutId } from "../db/repo";
import type { Workout } from "../db/types";
import { useUpdate } from "../lib/updater";

interface Props { db: TreinoDB; onStart: (workoutId: string, resumeSessionId?: number) => void; onEdit: (workoutId: string) => void; onImport: () => void; notice?: string }

export function Home({ db, onStart, onEdit, onImport, notice }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [next, setNext] = useState<string>();
  const [open, setOpen] = useState<Session>();
  const update = useUpdate();
  useEffect(() => {
    db.workouts.orderBy("order").toArray().then(setWorkouts);
    nextWorkoutId(db).then(setNext).catch(() => undefined);
    findResumable(db).then(setOpen);
  }, [db]);

  return (
    <main className="app">
      <h1>Treino</h1>
      {update.available && (
        <div className="banner" role="status">
          <span>Nova versão disponível.</span>
          <button className="btn small" onClick={update.apply}><Icon name="refresh" size={18} />Atualizar</button>
        </div>
      )}
      {open && (
        <section className="banner resume" aria-label="Treino em andamento">
          <span>Treino em andamento: <strong>{workouts.find((w) => w.id === open.workoutId)?.name ?? "Treino"}</strong>, {plural(open.sets.length, "série salva", "séries salvas")}.</span>
          <span className="row-actions">
            <button className="btn small" onClick={() => onStart(open.workoutId, open.id)}><Icon name="play" size={18} />Continuar treino</button>
            <button className="btn small ghost" onClick={() => void finishSession(db, open.id!).then(() => setOpen(undefined))}>Encerrar e salvar</button>
          </span>
        </section>
      )}
      {notice && <p className="notice" role="status">{notice}</p>}
      <p className="muted">Escolha o treino de hoje.</p>
      {workouts.map((w) => (
        <div key={w.id} className="card-row">
          <button className={"card" + (w.id === next ? " suggested" : "")} onClick={() => onStart(w.id)}>
            <span className="card-title">{w.name}</span>
            <span className="muted">{plural(w.items.length, "exercício", "exercícios")}</span>
            {w.id === next && <span className="badge">Próximo</span>}
          </button>
          <button className="btn tonal edit" aria-label={`Editar ${w.name}`} onClick={() => onEdit(w.id)}><Icon name="edit" size={20} />Editar</button>
        </div>
      ))}
      <button className="btn ghost wide" onClick={onImport}><Icon name="download" size={20} />Importar treinos de um arquivo</button>
      <footer className="credits muted">
        Demonstrações: dados hasaneyldrm/exercises-dataset, imagens © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a>
      </footer>
    </main>
  );
}
