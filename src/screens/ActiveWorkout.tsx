import { BrandBar } from "../components/Logo";
import { useBackClose } from "../lib/useBackClose";

import { useEffect, useRef, useState } from "react";
import type { TreinoDB } from "../db/db";
import { discardSession, finishSession, lastSetsForMany, logSet, startSession, unlogSet } from "../db/repo";
import type { Exercise, LoggedSet, Workout } from "../db/types";
import { useRestTimer } from "../hooks/useRestTimer";
import { notifyRestOver, primeAudio } from "../lib/alert";
import { fmtNum, plural } from "../lib/format";
import { progressionHint } from "../lib/progression";
import { Icon } from "../components/Icon";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { RestTimer } from "../components/RestTimer";
import { ExerciseMedia } from "../components/ExerciseMedia";
import { MediaLightbox } from "../components/MediaLightbox";
import { hasAnim } from "../lib/media";

export interface SavedSummary { sets: number; volumeKg: number }
interface Props { db: TreinoDB; workoutId: string; resumeSessionId?: number; onExit: (saved?: SavedSummary) => void }

export const MAX_WEIGHT_KG = 500, MAX_REPS = 100;
const OUT_OF_RANGE = `Confira os valores: a carga vai até ${MAX_WEIGHT_KG} kg e as repetições até ${MAX_REPS}.`;
const SAVE_FAILED = "Não conseguimos salvar agora. Seus dados continuam no aparelho; tente de novo.";
const MISSING = "Informe a carga e as repetições para concluir a série. Sem peso? Digite 0.";

export function ActiveWorkout({ db, workoutId, resumeSessionId, onExit }: Props) {
  const [workout, setWorkout] = useState<Workout>();
  const [lib, setLib] = useState<Record<string, Exercise>>({});
  const sessionRef = useRef<Promise<number> | undefined>(undefined);
  const [done, setDone] = useState<LoggedSet[]>([]);
  const [last, setLast] = useState<Record<string, LoggedSet[]>>({});
  const [announce, setAnnounce] = useState("");
  const rest = useRestTimer(() => { notifyRestOver(); setAnnounce("Descanso terminou"); });
  const [inputs, setInputs] = useState<Record<string, { w: string; r: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useBackClose(confirmExit, () => setConfirmExit(false));
  // Com séries marcadas, o voltar do aparelho pergunta antes de sair do treino.
  useBackClose(done.length > 0 && !confirmExit && !confirmDiscard, () => setConfirmExit(true));
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState<{ id: string; name: string }>();
  const [leaveError, setLeaveError] = useState<string>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const w = await db.workouts.get(workoutId);
      if (!w || !alive) return;
      const ex = await db.exercises.bulkGet(w.items.map((i) => i.exerciseId));
      const prev: Record<string, LoggedSet[]> = await lastSetsForMany(db, w.items.map((i) => i.exerciseId));
      const resumed = resumeSessionId !== undefined ? await db.sessions.get(resumeSessionId) : undefined;
      if (!alive) return;
      if (resumed && resumed.finishedAt === undefined && resumed.workoutId === workoutId) {
        sessionRef.current = Promise.resolve(resumed.id!);
        setDone(resumed.sets);
        setInputs(Object.fromEntries(resumed.sets.map((s) => [`${s.exerciseId}:${s.setIndex}`, { w: fmtNum(s.weightKg), r: String(s.reps) }])));
      }
      setLib(Object.fromEntries(ex.filter((e): e is Exercise => !!e).map((e) => [e.id, e])));
      setLast(prev);
      setWorkout(w);
    })();
    return () => { alive = false; };
  }, [db, workoutId, resumeSessionId]);

  if (!workout) return <main className="app"><p className="muted">Carregando…</p></main>;

  const key = (ex: string, i: number) => `${ex}:${i}`;
  const isDone = (ex: string, i: number) => done.some((d) => d.exerciseId === ex && d.setIndex === i);
  const hintFor = (ex: string) => {
    if (lib[ex]?.timed) return null;
    const item = workout!.items.find((it) => it.exerciseId === ex);
    return item ? progressionHint(item, last[ex] ?? []) : null;
  };
  const valueOf = (ex: string, i: number) => {
    const typed = inputs[key(ex, i)];
    const prev = last[ex]?.[i] ?? last[ex]?.[last[ex].length - 1];
    const hint = hintFor(ex);
    // Com dica de subir a carga, já sugere a carga nova e o início da faixa.
    if (hint?.kind === "increase") {
      const item = workout!.items.find((it) => it.exerciseId === ex)!;
      return { w: typed?.w ?? fmtNum(hint.toKg), r: typed?.r ?? String(item.repMin) };
    }
    return { w: typed?.w ?? (prev ? fmtNum(prev.weightKg) : ""), r: typed?.r ?? (prev ? String(prev.reps) : "") };
  };
  const setInput = (ex: string, i: number, patch: Partial<{ w: string; r: string }>) => {
    setInputs((p) => ({ ...p, [key(ex, i)]: { ...valueOf(ex, i), ...patch } }));
    setErrors((e) => { const { [key(ex, i)]: _gone, ...rest2 } = e; return rest2; });
  };

  /** A sessão só é criada na primeira série concluída (sair sem treinar não deixa rastro). */
  function ensureSession(): Promise<number> {
    sessionRef.current ??= startSession(db, workoutId).catch((e) => { sessionRef.current = undefined; throw e; });
    return sessionRef.current;
  }

  async function toggle(ex: string, i: number, cardio: boolean, fixedReps = 0) {
    try { await toggleInner(ex, i, cardio, fixedReps); } catch { setErrors((e) => ({ ...e, [key(ex, i)]: SAVE_FAILED })); }
  }

  async function toggleInner(ex: string, i: number, cardio: boolean, fixedReps: number) {
    if (isDone(ex, i)) {
      await unlogSet(db, await ensureSession(), ex, i);
      setDone((d) => d.filter((x) => !(x.exerciseId === ex && x.setIndex === i)));
      return;
    }
    const v = valueOf(ex, i);
    const w = v.w.trim().replace(",", ".");
    const weightKg = cardio ? 0 : w === "" ? NaN : Number(w);
    const reps = cardio ? fixedReps : Number(v.r);
    if (!cardio && (!Number.isFinite(weightKg) || weightKg < 0 || !Number.isInteger(reps) || reps <= 0)) {
      setErrors((e) => ({ ...e, [key(ex, i)]: MISSING }));
      return;
    }
    if (!cardio && (weightKg > MAX_WEIGHT_KG || reps > MAX_REPS)) {
      setErrors((e) => ({ ...e, [key(ex, i)]: OUT_OF_RANGE }));
      return;
    }
    const set: LoggedSet = { exerciseId: ex, setIndex: i, weightKg, reps, doneAt: Date.now() };
    await logSet(db, await ensureSession(), set);
    setDone((d) => [...d.filter((x) => !(x.exerciseId === ex && x.setIndex === i)), set]);
    const item = workout!.items.find((it) => it.exerciseId === ex);
    primeAudio();
    if (item && item.restSec > 0) { setAnnounce(""); rest.start(item.restSec, lib[ex]?.name ?? ""); }
  }

  /** Séries do exercício: as do plano, as adicionadas agora e as já registradas (treino retomado). */
  const setsOf = (ex: string, planned: number) =>
    Math.max(planned + (extra[ex] ?? 0), ...done.filter((d) => d.exerciseId === ex).map((d) => d.setIndex + 1));

  async function discard() {
    try {
      const id = await sessionRef.current;
      if (id !== undefined) await discardSession(db, id);
      onExit();
    } catch { setLeaveError(SAVE_FAILED); setConfirmDiscard(false); }
  }

  /** Salva o que foi feito e sai. Sem nenhuma série marcada, descarta a sessão. */
  async function leave() {
    try { await leaveInner(); } catch { setLeaveError(SAVE_FAILED); setConfirmExit(false); }
  }

  async function leaveInner() {
    const id = await sessionRef.current;
    let saved: SavedSummary | undefined;
    if (id !== undefined) {
      if (done.length === 0) await discardSession(db, id);
      else {
        await finishSession(db, id);
        saved = { sets: done.length, volumeKg: done.reduce((v, x) => v + x.weightKg * x.reps, 0) };
      }
    }
    onExit(saved);
  }

  return (
    <main className="app">
      <BrandBar compact />
      <header className="bar">
        <h1>{workout.name}</h1>
      </header>
      <p role="status" className="sr-only">{announce}</p>
      <p className="muted">Comece com 3 a 5 minutos de aquecimento leve.</p>
      {leaveError && <p className="error block" role="alert">{leaveError}</p>}
      {workout.items.map((item, n) => {
        const ex = lib[item.exerciseId];
        if (!ex) return null;
        const timed = !!ex.timed;
        const cardio = !!item.durationMin;
        const noInputs = cardio || timed;
        const total = setsOf(item.exerciseId, item.sets);
        const doneCount = Array.from({ length: total }, (_, i) => isDone(item.exerciseId, i)).filter(Boolean).length;
        return (
          <section key={n} className={"exercise ex-card" + (doneCount === total ? " all-done" : "")} aria-label={ex.name}>
            <div className="ex-head">
              <span className="ex-num" aria-hidden="true">{doneCount === total ? <Icon name="check" size={18} /> : n + 1}</span>
              <div className="ex-title">
                <h2>{ex.name}</h2>
                <div className="ex-chips">
                  {cardio ? <span className="chip-info">{item.durationMin} min</span> : <>
                    <span className="chip-info">{total} séries</span>
                    <span className="chip-info">{timed ? `${item.repMax} s` : item.repMin === item.repMax ? `${item.repMin} reps` : `${item.repMin}-${item.repMax} reps`}</span>
                    <span className="chip-info">descanso {item.restSec}s</span>
                  </>}
                </div>
              </div>
              {hasAnim(ex.id) && <button className="ex-thumb" aria-label={`Ampliar demonstração de ${ex.name}`} onClick={() => setZoom({ id: ex.id, name: ex.name })}><ExerciseMedia id={ex.id} name="" /></button>}
            </div>
            <p className="cue">{ex.cue}</p>
            {(() => {
              const h = hintFor(item.exerciseId);
              if (!h) return null;
              return h.kind === "increase"
                ? <p className="hint up" role="note">Hora de subir a carga: {fmtNum(h.fromKg)} → {fmtNum(h.toKg)} kg. Na última vez você fez {plural(h.sets, "série", "séries")} de {h.reps} repetições com {fmtNum(h.fromKg)} kg.</p>
                : <p className="hint" role="note">Na última vez alguma série ficou abaixo de {h.repMin} repetições com {fmtNum(h.weightKg)} kg. Mantenha ou reduza a carga hoje.</p>;
            })()}
            <div className="sets">
            {Array.from({ length: total }, (_, i) => {
              const v = valueOf(item.exerciseId, i);
              const prev = last[item.exerciseId]?.[i];
              const d = isDone(item.exerciseId, i);
              const err = errors[key(item.exerciseId, i)];
              return (
                <div key={i} className={"set" + (d ? " done" : "")}>
                  <span className="set-n">{cardio ? "Cardio" : `Série ${i + 1}`}</span>
                  {!noInputs && (
                    <>
                      <input aria-label={`Carga em kg, série ${i + 1}, ${ex.name}`} inputMode="decimal" value={v.w} disabled={d}
                        aria-invalid={err ? true : undefined} onChange={(e) => setInput(item.exerciseId, i, { w: e.target.value })} placeholder={prev ? fmtNum(prev.weightKg) : "kg"} />
                      <input aria-label={`Repetições (reps), série ${i + 1}, ${ex.name}`} inputMode="numeric" value={v.r} disabled={d}
                        aria-invalid={err ? true : undefined} onChange={(e) => setInput(item.exerciseId, i, { r: e.target.value })} placeholder={prev ? String(prev.reps) : "reps"} />
                    </>
                  )}
                  <button className="check" aria-pressed={d} aria-label={cardio ? "Cardio concluído" : `Série ${i + 1} concluída, ${ex.name}`}
                    onClick={() => toggle(item.exerciseId, i, noInputs, timed ? item.repMax : 0)}>
                    <Icon name="check" size={30} />
                  </button>
                  {err && <p className="error" role="alert">{err}</p>}
                  {prev && !noInputs && <span className="muted prev">Última vez: {fmtNum(prev.weightKg)} kg × {prev.reps}</span>}
                </div>
              );
            })}
            </div>
            {!cardio && <button className="btn ghost small add-set" onClick={() => setExtra((e) => ({ ...e, [item.exerciseId]: total - item.sets + 1 }))}><Icon name="add" size={18} />Adicionar série</button>}
          </section>
        );
      })}
      {rest.active && <RestTimer remaining={rest.remaining} total={rest.total} label={rest.label} onAdjust={rest.adjust} onSkip={rest.skip} />}
      {zoom && <MediaLightbox id={zoom.id} name={zoom.name} onClose={() => setZoom(undefined)} />}
      {done.length > 0 && (
        <>
          <button className="primary" onClick={() => void leave()}><Icon name="check" />Finalizar treino</button>
          <button className="btn discard" onClick={() => setConfirmDiscard(true)}><Icon name="delete" size={20} />Descartar treino</button>
        </>
      )}
      {confirmDiscard && (
        <ConfirmDialog title="Descartar este treino?" text={`As ${plural(done.length, "série", "séries")} deste treino não serão salvas. Não dá para desfazer.`}
          confirmLabel="Descartar treino" cancelLabel="Continuar treino" danger onConfirm={() => void discard()} onCancel={() => setConfirmDiscard(false)} />
      )}
      {confirmExit && (
        <div className="overlay">
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="sair-t" aria-describedby="sair-d">
            <h2 id="sair-t">Sair do treino?</h2>
            <p id="sair-d" className="muted">Suas séries ficam salvas no histórico.</p>
            <button className="btn" onClick={() => void leave()}><Icon name="save" size={20} />Salvar e sair</button>
            <button className="btn ghost" autoFocus onClick={() => setConfirmExit(false)}><Icon name="play" size={20} />Continuar treino</button>
          </div>
        </div>
      )}
    </main>
  );
}
