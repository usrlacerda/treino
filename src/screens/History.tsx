import { BrandHeader } from "../components/Logo";
import { Icon } from "../components/Icon";
import { useEffect, useMemo, useState } from "react";
import type { TreinoDB } from "../db/db";
import { listFinishedSessions } from "../db/repo";
import type { Exercise, Session } from "../db/types";
import { LoadChart } from "../components/LoadChart";
import { formatDateFull } from "../lib/time";
import { e1rm, personalRecords, pointsFor, sessionVolume } from "../lib/stats";
import { fmtNum as fmt, plural } from "../lib/format";


export function History({ db, onGoTreinos }: { db: TreinoDB; onGoTreinos?: () => void }) {
  const [sessions, setSessions] = useState<Session[]>();
  const [lib, setLib] = useState<Record<string, Exercise>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [exId, setExId] = useState("");

  useEffect(() => {
    (async () => {
      const [s, ex, w] = await Promise.all([listFinishedSessions(db), db.exercises.toArray(), db.workouts.toArray()]);
      setSessions(s);
      setLib(Object.fromEntries(ex.map((e) => [e.id, e])));
      setNames(Object.fromEntries(w.map((x) => [x.id, x.name])));
    })();
  }, [db]);

  const withData = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessions ?? []) for (const x of s.sets) if (x.weightKg > 0 && Object.hasOwn(lib, x.exerciseId)) ids.add(x.exerciseId);
    return [...ids].sort((a, b) => lib[a].name.localeCompare(lib[b].name, "pt-BR"));
  }, [sessions, lib]);

  const current = exId && withData.includes(exId) ? exId : withData[0] ?? "";
  if (!sessions) return <main className="app"><p className="muted">Carregando…</p></main>;
  if (!sessions.length) return (
    <main className="app">
      <BrandHeader title="Histórico" />
      <section className="empty" aria-label="Histórico vazio">
        <span className="empty-icon" aria-hidden="true"><Icon name="history" size={40} /></span>
        <h2>Nenhum treino finalizado</h2>
        <p className="muted">Conclua um treino para ver seu progresso aqui.</p>
        {onGoTreinos && <button className="btn" onClick={onGoTreinos}><Icon name="play" size={20} />Ir para Treinos</button>}
      </section>
    </main>
  );

  const rec = current ? personalRecords(sessions, current) : null;
  return (
    <main className="app">
      <BrandHeader title="Histórico" />
      {current && (
        <section className="exercise">
          <h2>Progresso por exercício</h2>
          <select aria-label="Exercício" value={current} onChange={(e) => setExId(e.target.value)}>
            {withData.map((id) => <option key={id} value={id}>{lib[id].name}</option>)}
          </select>
          {rec && (
            <div className="records">
              <div className="record"><span className="muted">Maior carga</span><strong>{fmt(rec.maxWeight.weightKg)} kg × {rec.maxWeight.reps}</strong><span className="muted">{formatDateFull(rec.maxWeight.date)}</span></div>
              <div className="record"><span className="muted">Carga máxima estimada</span><strong>{fmt(Math.round(e1rm(rec.bestE1rm.weightKg, rec.bestE1rm.reps) * 10) / 10)} kg</strong><span className="muted">para 1 repetição · {formatDateFull(rec.bestE1rm.date)}</span></div>
            </div>
          )}
          <LoadChart points={pointsFor(sessions, current)} title={lib[current].name} />
        </section>
      )}
      <p className="muted storage-note">Seus treinos ficam só neste aparelho. Limpar os dados do navegador apaga o histórico. Faça backup em Ajustes.</p>
      <h2>Treinos feitos</h2>
      {sessions.map((s) => (
        <div key={s.id} className="exercise">
          <strong>{names[s.workoutId] ?? s.workoutId}</strong> <span className="muted">· {formatDateFull(s.startedAt)}</span>
          <p className="muted">{plural(s.sets.length, "série", "séries")} · volume {fmt(sessionVolume(s))} kg</p>
        </div>
      ))}
    </main>
  );
}
