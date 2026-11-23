import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { finishSession, findResumable } from "../db/repo";
import type { Session, Workout } from "../db/types";
import { plural } from "../lib/format";
import { useUpdate } from "../lib/updater";
import { Icon } from "./Icon";

/** Avisos do topo das telas principais: nova versão do app e treino em andamento. */
export function TopBanners({ db, workouts, onStart }: { db: TreinoDB; workouts: Workout[]; onStart: (workoutId: string, resumeSessionId?: number) => void }) {
  const update = useUpdate();
  const [open, setOpen] = useState<Session>();
  useEffect(() => { findResumable(db).then(setOpen); }, [db]);
  return (
    <>
      {update.available && (
        <div className="banner" role="status">
          <span>Nova versão disponível. Atualize para usar as novidades.</span>
          <button className="btn icon update" aria-label="Atualizar" title="Atualizar" onClick={update.apply}><Icon name="refresh" size={22} /></button>
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
    </>
  );
}
