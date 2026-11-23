import { Catalog } from "./Catalog";
import { Icon } from "../components/Icon";
import { useEffect, useMemo, useState } from "react";
import type { TreinoDB } from "../db/db";
import { addExercise, deleteExercise } from "../db/plan";
import type { Exercise, Muscle } from "../db/types";
import { mediaFrames, mediaSrc } from "../lib/media";
import { MUSCLE_LABEL, MUSCLES } from "../lib/muscles";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");

export function Library({ db }: { db: TreinoDB }) {
  const [list, setList] = useState<Exercise[]>([]);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "">("");
  const [adding, setAdding] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [error, setError] = useState<string>();
  const [toDelete, setToDelete] = useState<Exercise>();
  const [form, setForm] = useState({ name: "", muscle: "" as Muscle | "", equipment: "", cue: "" });

  const reload = () => db.exercises.toArray().then((e) => setList(e.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))));
  useEffect(() => { void reload(); }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(
    () => list.filter((e) => (!muscle || e.muscle === muscle) && (!q.trim() || norm(e.name).includes(norm(q.trim())))),
    [list, q, muscle],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!form.muscle) throw new Error("Escolha o grupo muscular.");
      await addExercise(db, { ...form, muscle: form.muscle });
      setForm({ name: "", muscle: "", equipment: "", cue: "" });
      setAdding(false); setError(undefined);
      await reload();
    } catch (err) { setError((err as Error).message); }
  }
  async function confirmDelete() {
    if (!toDelete) return;
    try { await deleteExercise(db, toDelete.id); setError(undefined); await reload(); }
    catch (err) { setError((err as Error).message); }
    setToDelete(undefined);
  }

  if (browsing) return <Catalog db={db} onClose={() => { setBrowsing(false); void reload(); }} />;
  return (
    <main className="app">
      <h1>Biblioteca</h1>
      <label className="field">Buscar exercício
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="chips" role="group" aria-label="Filtrar por grupo muscular">
        <button className="chip" aria-pressed={muscle === ""} onClick={() => setMuscle("")}>{muscle === "" && <Icon name="check" size={18} />}Todos</button>
        {MUSCLES.map((m) => (
          <button key={m} className="chip" aria-pressed={muscle === m} onClick={() => setMuscle(muscle === m ? "" : m)}>{muscle === m && <Icon name="check" size={18} />}{MUSCLE_LABEL[m]}</button>
        ))}
      </div>
      {error && <p className="error block" role="alert">{error}</p>}
      {!adding && <button className="btn wide" onClick={() => setAdding(true)}><Icon name="add" size={20} />Novo exercício</button>}
      {!adding && <button className="btn ghost wide" onClick={() => setBrowsing(true)}><Icon name="download" size={20} />Explorar catálogo (1.324)</button>}
      {adding && (
        <form className="exercise" onSubmit={save} aria-label="Novo exercício">
          <h2>Novo exercício</h2>
          <label className="field">Nome<input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field">Grupo muscular
            <select value={form.muscle} onChange={(e) => setForm({ ...form, muscle: e.target.value as Muscle })}>
              <option value="">Escolha…</option>
              {MUSCLES.map((m) => <option key={m} value={m}>{MUSCLE_LABEL[m]}</option>)}
            </select>
          </label>
          <label className="field">Equipamento (opcional)<input value={form.equipment} maxLength={40} onChange={(e) => setForm({ ...form, equipment: e.target.value })} /></label>
          <label className="field">Dica de execução (opcional)<input value={form.cue} maxLength={200} onChange={(e) => setForm({ ...form, cue: e.target.value })} /></label>
          <div className="row-actions">
            <button type="submit" className="btn"><Icon name="save" size={20} />Salvar exercício</button>
            <button type="button" className="btn ghost" onClick={() => { setAdding(false); setError(undefined); }}>Cancelar</button>
          </div>
        </form>
      )}
      <p className="muted" aria-live="polite">{shown.length === 1 ? "1 exercício" : `${shown.length} exercícios`}</p>
      {shown.length === 0 && <p className="muted empty-inline">Nenhum exercício encontrado. Mude a busca, limpe o filtro ou crie um novo.</p>}
      <ul className="lib-list">
        {shown.map((e) => {
          const own = /^(custom|ds)-/.test(e.id);
          return (
            <li key={e.id} className="lib-item">
              {mediaFrames(e.id) ? <img src={mediaSrc(e.id, 0)} alt="" width="56" height="56" loading="lazy" /> : <span className="lib-ph" aria-hidden="true" />}
              <div className="lib-text">
                <strong>{e.name}</strong>
                <span className="muted">{MUSCLE_LABEL[e.muscle]} · {e.equipment}{own && <span className="badge inline">{e.id.startsWith("ds-") ? "Catálogo" : "Próprio"}</span>}</span>
              </div>
              {own && <button className="btn text danger small" aria-label={`Apagar ${e.name}`} onClick={() => setToDelete(e)}><Icon name="delete" size={18} />Apagar</button>}
            </li>
          );
        })}
      </ul>
      {toDelete && (
        <div className="overlay">
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="apg-t">
            <h2 id="apg-t">Apagar “{toDelete.name}”?</h2>
            <p className="muted">Ele sai da Biblioteca. Não dá para desfazer.</p>
            <button className="btn danger" onClick={() => void confirmDelete()}><Icon name="delete" size={20} />Apagar exercício</button>
            <button className="btn ghost" autoFocus onClick={() => setToDelete(undefined)}>Cancelar</button>
          </div>
        </div>
      )}
    </main>
  );
}
