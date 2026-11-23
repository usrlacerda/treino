import { BrandBar } from "../components/Logo";
import { Icon } from "../components/Icon";
import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { saveWorkout } from "../db/plan";
import type { Exercise, Workout } from "../db/types";
import { Library } from "./Library";

interface Row { exerciseId: string; sets: string; repMin: string; repMax: string; restSec: string; durationMin?: string }
interface Props { db: TreinoDB; workoutId: string; onClose: (saved?: string) => void }

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export function EditWorkout({ db, workoutId, onClose }: Props) {
  const [base, setBase] = useState<Workout>();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [lib, setLib] = useState<Exercise[]>([]);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    (async () => {
      const [w, ex] = await Promise.all([db.workouts.get(workoutId), db.exercises.toArray()]);
      if (!w) return;
      setBase(w); setName(w.name); setLib(ex.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setRows(w.items.map((i) => ({ exerciseId: i.exerciseId, sets: String(i.sets), repMin: String(i.repMin), repMax: String(i.repMax), restSec: String(i.restSec), durationMin: i.durationMin !== undefined ? String(i.durationMin) : undefined })));
    })();
  }, [db, workoutId]);

  if (!base) return <main className="app"><p className="muted">Carregando…</p></main>;

  const byId = Object.fromEntries(lib.map((e) => [e.id, e]));
  const patch = (i: number, p: Partial<Row>) => { setRows((rs) => rs.map((r, n) => (n === i ? { ...r, ...p } : r))); setError(undefined); };
  const move = (i: number, d: -1 | 1) => setRows((rs) => { const n = [...rs]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const remove = (i: number) => setRows((rs) => rs.filter((_, n) => n !== i));
  const add = async (ex: Exercise) => {
    if (!byId[ex.id]) { await db.exercises.put(ex); setLib((l) => [...l, ex].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))); }
    setRows((rs) => [...rs, ex.muscle === "cardio"
      ? { exerciseId: ex.id, sets: "1", repMin: "0", repMax: "0", restSec: "0", durationMin: "15" }
      : { exerciseId: ex.id, sets: "3", repMin: "8", repMax: "12", restSec: "60" }]);
    setPicking(false); setError(undefined);
  };
  const inWorkout = new Set(rows.map((r) => r.exerciseId)); // já no treino: não aparece de novo na escolha

  if (picking) return <Library db={db} hide={inWorkout} onPick={(ex) => void add(ex)} onClose={() => setPicking(false)} />;

  async function save() {
    const w: Workout = {
      ...base!, name,
      items: rows.map((r) => ({ exerciseId: r.exerciseId, sets: num(r.sets), repMin: num(r.repMin), repMax: num(r.repMax), restSec: num(r.restSec), ...(r.durationMin !== undefined ? { durationMin: num(r.durationMin) } : {}) })),
    };
    try { await saveWorkout(db, w); onClose(`${w.name.trim()} salvo.`); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <main className="app">
      <BrandBar compact />
      <header className="bar">
        <button className="btn text back" onClick={() => onClose()}><Icon name="back" />Cancelar</button>
        <h1>Editar treino</h1>
      </header>
      <label className="field">Nome do treino<input value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setError(undefined); }} /></label>
      {rows.map((r, i) => {
        const ex = byId[r.exerciseId];
        const nm = ex?.name ?? r.exerciseId;
        return (
          <section key={r.exerciseId} className="exercise" aria-label={nm}>
            <h2>{i + 1}. {nm}</h2>
            {r.durationMin !== undefined ? (
              <label className="field small">Duração (min)<input inputMode="numeric" aria-label={`Duração em minutos, ${nm}`} value={r.durationMin} onChange={(e) => patch(i, { durationMin: e.target.value })} /></label>
            ) : (
              <div className="grid4">
                <label className="field small">Séries<input inputMode="numeric" aria-label={`Séries, ${nm}`} value={r.sets} onChange={(e) => patch(i, { sets: e.target.value })} /></label>
                <label className="field small">{ex?.timed ? "Mín. segundos" : "Mín. reps"}<input inputMode="numeric" aria-label={`${ex?.timed ? "Mínimo de segundos" : "Mínimo de repetições"}, ${nm}`} value={r.repMin} onChange={(e) => patch(i, { repMin: e.target.value })} /></label>
                <label className="field small">{ex?.timed ? "Máx. segundos" : "Máx. reps"}<input inputMode="numeric" aria-label={`${ex?.timed ? "Máximo de segundos" : "Máximo de repetições"}, ${nm}`} value={r.repMax} onChange={(e) => patch(i, { repMax: e.target.value })} /></label>
                <label className="field small">Descanso (s)<input inputMode="numeric" aria-label={`Descanso em segundos, ${nm}`} value={r.restSec} onChange={(e) => patch(i, { restSec: e.target.value })} /></label>
              </div>
            )}
            <div className="row-actions">
              <button className="btn icon" disabled={i === 0} aria-label={`Subir ${nm}`} title="Subir" onClick={() => move(i, -1)}><Icon name="up" /></button>
              <button className="btn icon" disabled={i === rows.length - 1} aria-label={`Descer ${nm}`} title="Descer" onClick={() => move(i, 1)}><Icon name="down" /></button>
              <button className="btn icon danger" aria-label={`Remover ${nm}`} title="Remover" onClick={() => remove(i)}><Icon name="delete" /></button>
            </div>
          </section>
        );
      })}
      <button className="btn tonal wide" onClick={() => setPicking(true)}><Icon name="add" size={20} />Adicionar exercício</button>
      {error && <p className="error block" role="alert">{error}</p>}
      <button className="primary" onClick={() => void save()}><Icon name="save" />Salvar alterações</button>
    </main>
  );
}
