import { BrandHeader } from "../components/Logo";
import { Icon } from "../components/Icon";
import { plural } from "../lib/format";
import { finishSession, findResumable } from "../db/repo";
import type { Session } from "../db/types";
import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { nextWorkoutId } from "../db/repo";
import type { Workout } from "../db/types";
import { useUpdate } from "../lib/updater";

interface Props { db: TreinoDB; onStart: (workoutId: string, resumeSessionId?: number) => void; onEdit: (workoutId: string) => void; notice?: string }

export function Home({ db, onStart, onEdit, notice }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [next, setNext] = useState<string>();
  const [open, setOpen] = useState<Session>();
  const update = useUpdate();
  useEffect(() => {
    db.workouts.orderBy("order").toArray().then(setWorkouts);
    db.exercises.toArray().then((all) => setNames(Object.fromEntries(all.map((e) => [e.id, e.name]))));
    nextWorkoutId(db).then(setNext).catch(() => undefined);
    findResumable(db).then(setOpen);
  }, [db]);

  return (
    <main className="app">
      <BrandHeader title="Treinos" />
      {update.available && (
        <div className="banner" role="status">
          <span>Nova versão disponível. Atualize para usar as novidades.</span>
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
      <h2 className="section-title">Escolha o treino de hoje</h2>
      {workouts.map((w) => {
        const list = w.items.map((i) => names[i.exerciseId]).filter(Boolean);
        const preview = list.slice(0, 3).join(" · ") + (list.length > 3 ? ` · +${list.length - 3}` : "");
        const isNext = w.id === next;
        return (
          <div key={w.id} className="card-row">
            <button className={"card" + (isNext ? " suggested" : "")} onClick={() => onStart(w.id)}>
              <span className="card-head">
                <span className="card-title">{w.name}</span>
                {isNext && <span className="badge inline">Próximo</span>}
              </span>
              <span className="card-meta">{plural(w.items.length, "exercício", "exercícios")}</span>
              {preview && <span className="card-preview">{preview}</span>}
            </button>
            <button className="btn icon edit" aria-label={`Editar ${w.name}`} onClick={() => onEdit(w.id)}><Icon name="edit" size={18} /></button>
          </div>
        );
      })}
      <footer className="credits muted">
        CG - Corre Gordo · Imagens dos exercícios: © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a>
      </footer>
    </main>
  );
}
