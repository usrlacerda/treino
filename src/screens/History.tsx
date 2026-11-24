import { BrandHeader } from "../components/Logo";
import { Icon } from "../components/Icon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TreinoDB } from "../db/db";
import { discardSession, listFinishedSessions } from "../db/repo";
import { sessionText, shareText } from "../lib/share";
import { ConfirmDialog } from "../components/ConfirmDialog";
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

  const [asking, setAsking] = useState<Session>();
  const [shareMsg, setShareMsg] = useState<string>();
  const [removed, setRemoved] = useState<Session>(); // último treino excluído, ainda dá para desfazer
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    const [s, ex, w] = await Promise.all([listFinishedSessions(db), db.exercises.toArray(), db.workouts.toArray()]);
    setSessions(s);
    setLib(Object.fromEntries(ex.map((e) => [e.id, e])));
    setNames(Object.fromEntries(w.map((x) => [x.id, x.name])));
  }, [db]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function remove(s: Session) {
    setAsking(undefined);
    await discardSession(db, s.id!);
    setRemoved(s);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setRemoved(undefined), 8000);
    await load();
  }
  async function undo() {
    if (!removed) return;
    await db.sessions.put(removed);
    setRemoved(undefined);
    clearTimeout(timer.current);
    await load();
  }
  async function share(s: Session) {
    const r = await shareText(sessionText(s, names[s.workoutId] ?? "Treino", (id) => lib[id]?.name ?? id));
    setShareMsg(r === "copied" ? "Resumo copiado. Cole onde quiser." : r === "failed" ? "Não conseguimos compartilhar agora. Tente de novo." : undefined);
  }
  const extras = (
    <>
      {shareMsg && <p className="notice" role="status">{shareMsg}</p>}
      {removed && (
        <div className="snackbar" role="status">
          <span>Treino excluído.</span>
          <button className="btn small ghost" onClick={() => void undo()}>Desfazer</button>
        </div>
      )}
      {asking && (
        <ConfirmDialog title="Excluir este treino?" text={`${names[asking.workoutId] ?? "Treino"} de ${formatDateFull(asking.startedAt)}, com ${plural(asking.sets.length, "série", "séries")}, sai do histórico. Você poderá desfazer logo depois.`}
          confirmLabel="Excluir treino" cancelLabel="Cancelar" danger onConfirm={() => void remove(asking)} onCancel={() => setAsking(undefined)} />
      )}
    </>
  );

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
      {extras}
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
        <div key={s.id} className="exercise session-row">
          <div>
            <strong>{names[s.workoutId] ?? s.workoutId}</strong> <span className="muted">· {formatDateFull(s.startedAt)}</span>
            <p className="muted">{plural(s.sets.length, "série", "séries")} · volume {fmt(sessionVolume(s))} kg</p>
            {s.note && <p className="session-note">“{s.note}”</p>}
          </div>
          <button className="btn icon" aria-label={`Compartilhar treino ${names[s.workoutId] ?? s.workoutId} de ${formatDateFull(s.startedAt)}`} title="Compartilhar" onClick={() => void share(s)}><Icon name="share" /></button>
          <button className="btn icon danger" aria-label={`Excluir treino ${names[s.workoutId] ?? s.workoutId} de ${formatDateFull(s.startedAt)}`} title="Excluir treino" onClick={() => setAsking(s)}><Icon name="delete" /></button>
        </div>
      ))}
      {extras}
    </main>
  );
}
