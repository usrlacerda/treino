import { BrandHeader } from "../components/Logo";
import { Icon } from "../components/Icon";
import { plural } from "../lib/format";
import { TopBanners } from "../components/TopBanners";
import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { nextWorkoutId } from "../db/repo";
import type { Workout } from "../db/types";

interface Props { db: TreinoDB; onStart: (workoutId: string, resumeSessionId?: number) => void; onEdit: (workoutId: string) => void; onNew: () => void; notice?: string }

export function Home({ db, onStart, onEdit, onNew, notice }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [next, setNext] = useState<string>();
  useEffect(() => {
    db.workouts.orderBy("order").toArray().then(setWorkouts);
    db.exercises.toArray().then((all) => setNames(Object.fromEntries(all.map((e) => [e.id, e.name]))));
    nextWorkoutId(db).then(setNext).catch(() => undefined);
  }, [db]);

  return (
    <main className="app">
      <BrandHeader title="Treinos" />
      <TopBanners db={db} workouts={workouts} onStart={onStart} />
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
      <button className="btn ghost wide" onClick={onNew}><Icon name="add" size={20} />Novo treino</button>
      <footer className="credits muted">
        CG Fit · Imagens dos exercícios: © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a>
      </footer>
    </main>
  );
}
