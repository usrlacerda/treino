import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import type { TreinoDB } from "../db/db";
import type { Muscle } from "../db/types";
import { catalogExerciseId, equipmentPt, loadCatalog, norm, targetPt, toExercise, type CatalogItem } from "../lib/catalog";
import { mediaSrc } from "../lib/media";
import { MUSCLE_LABEL, MUSCLES } from "../lib/muscles";

const PAGE = 30;

/** Catálogo com ~1.300 exercícios (dataset hasaneyldrm/exercises-dataset, mídia © Gym visual). Adicionar copia o exercício para a biblioteca. */
export function Catalog({ db, onClose }: { db: TreinoDB; onClose: () => void }) {
  const [items, setItems] = useState<CatalogItem[]>();
  const [failed, setFailed] = useState<string>();
  const [have, setHave] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "">("");
  const [limit, setLimit] = useState(PAGE);
  const [msg, setMsg] = useState<string>();

  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => alive && setItems(c)).catch((e: Error) => alive && setFailed(e.message));
    db.exercises.toCollection().primaryKeys().then((k) => alive && setHave(new Set(k as string[])));
    return () => { alive = false; };
  }, [db]);

  const shown = useMemo(() => {
    const t = norm(q.trim());
    return (items ?? []).filter((c) => (!muscle || c.muscle === muscle) && (!t || norm(c.name).includes(t) || norm(equipmentPt(c.equipment)).includes(t) || norm(c.equipment).includes(t)));
  }, [items, q, muscle]);

  async function add(c: CatalogItem) {
    const ex = toExercise(c);
    await db.exercises.put(ex);
    setHave((h) => new Set(h).add(ex.id));
    setMsg(`“${c.name}” foi adicionado à sua biblioteca.`);
  }

  return (
    <main className="app">
      <button className="btn text back" onClick={onClose}><Icon name="back" />Voltar</button>
      <h1>Catálogo de exercícios</h1>
      <p className="muted">Escolha exercícios para adicionar à sua biblioteca e depois monte seus treinos. Os nomes estão em inglês.</p>
      <label className="field">Buscar no catálogo
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} />
      </label>
      <div className="chips" role="group" aria-label="Filtrar por grupo muscular">
        <button className="chip" aria-pressed={muscle === ""} onClick={() => { setMuscle(""); setLimit(PAGE); }}>{muscle === "" && <Icon name="check" size={18} />}Todos</button>
        {MUSCLES.map((m) => (
          <button key={m} className="chip" aria-pressed={muscle === m} onClick={() => { setMuscle(muscle === m ? "" : m); setLimit(PAGE); }}>{muscle === m && <Icon name="check" size={18} />}{MUSCLE_LABEL[m]}</button>
        ))}
      </div>
      {failed && <p className="error block" role="alert">{failed} Conecte-se à internet uma vez para baixar o catálogo.</p>}
      {!items && !failed && <p className="muted" role="status">Carregando catálogo…</p>}
      {msg && <p className="notice" role="status">{msg}</p>}
      {items && <p className="muted" aria-live="polite">{shown.length === 1 ? "1 exercício" : `${shown.length} exercícios`}</p>}
      {items && shown.length === 0 && <p className="muted">Nenhum exercício encontrado. Mude a busca ou o filtro.</p>}
      <ul className="lib-list">
        {shown.slice(0, limit).map((c) => {
          const id = catalogExerciseId(c.id), added = have.has(id);
          return (
            <li key={c.id} className="lib-item">
              <img src={mediaSrc(id, 0)} alt="" width="56" height="56" loading="lazy" />
              <div className="lib-text">
                <strong>{c.name}</strong>
                <span className="muted">{MUSCLE_LABEL[c.muscle]} · {equipmentPt(c.equipment)} · {targetPt(c.target)}</span>
              </div>
              {added
                ? <span className="badge inline"><Icon name="check" size={16} />Na biblioteca</span>
                : <button className="btn tonal small" aria-label={`Adicionar ${c.name}`} onClick={() => void add(c)}><Icon name="add" size={18} />Adicionar</button>}
            </li>
          );
        })}
      </ul>
      {shown.length > limit && <button className="btn ghost wide" onClick={() => setLimit((n) => n + PAGE)}>Mostrar mais ({shown.length - limit})</button>}
      <p className="muted credits">Dados: hasaneyldrm/exercises-dataset. Imagens © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a> (abre em nova aba).</p>
    </main>
  );
}
