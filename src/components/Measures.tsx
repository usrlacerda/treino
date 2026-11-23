import { useCallback, useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import type { Measure } from "../db/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Icon } from "./Icon";
import { fmtNum } from "../lib/format";
import { formatDateFull } from "../lib/time";

const FIELDS = [
  ["weightKg", "Peso (kg)", 500], ["waistCm", "Cintura (cm)", 300], ["chestCm", "Peito (cm)", 300], ["armCm", "Braço (cm)", 200], ["thighCm", "Coxa (cm)", 200],
] as const;
type Key = (typeof FIELDS)[number][0];
const LABEL = Object.fromEntries(FIELDS.map(([k, l]) => [k, l.replace(/ \(.*\)/, "")])) as Record<Key, string>;
const UNIT = (k: Key) => (k === "weightKg" ? "kg" : "cm");

/** Medidas corporais: registra peso e medidas e mostra a evolução em relação ao registro anterior. */
export function Measures({ db }: { db: TreinoDB }) {
  const [list, setList] = useState<Measure[]>([]);
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Partial<Record<Key, string>>>({});
  const [error, setError] = useState<string>();
  const [asking, setAsking] = useState<Measure>();
  const load = useCallback(async () => setList((await db.measures.orderBy("date").reverse().toArray())), [db]);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    const m: Measure = { date: Date.now() };
    for (const [k, label, max] of FIELDS) {
      const raw = (vals[k] ?? "").trim().replace(",", ".");
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0 || n > max) { setError(`Confira o campo ${label.toLowerCase()}: use um número maior que 0 e até ${max}.`); return; }
      m[k] = n;
    }
    if (!FIELDS.some(([k]) => m[k] !== undefined)) { setError("Preencha pelo menos um campo."); return; }
    await db.measures.add(m);
    setVals({}); setError(undefined); setOpen(false);
    await load();
  }

  const prevOf = (i: number, k: Key) => list.slice(i + 1).find((x) => x[k] !== undefined)?.[k];
  return (
    <section className="exercise" aria-labelledby="ms-h">
      <h2 id="ms-h">Medidas corporais</h2>
      {list.length === 0 && !open && <p className="muted">Registre seu peso e suas medidas de vez em quando para ver a evolução.</p>}
      {open ? (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="measure-form">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="field">{label}
              <input autoComplete="off" spellCheck={false} inputMode="decimal" value={vals[k] ?? ""} onChange={(e) => { setVals((v) => ({ ...v, [k]: e.target.value })); setError(undefined); }} />
            </label>
          ))}
          <p className="muted">Todos os campos são opcionais, mas preencha pelo menos um.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" type="submit"><Icon name="save" size={20} />Salvar medidas</button>
          <button className="btn ghost" type="button" onClick={() => { setOpen(false); setError(undefined); }}>Cancelar</button>
        </form>
      ) : <button className="btn ghost wide" onClick={() => setOpen(true)}><Icon name="add" size={20} />Registrar medidas</button>}
      <ul className="measure-list">
        {list.slice(0, 5).map((m, i) => (
          <li key={m.id}>
            <div>
              <strong>{formatDateFull(m.date)}</strong>
              <p className="muted">
                {FIELDS.filter(([k]) => m[k] !== undefined).map(([k]) => {
                  const p = prevOf(i, k); const d = p !== undefined ? Math.round((m[k]! - p) * 10) / 10 : undefined;
                  return <span key={k} className="m-item">{LABEL[k]} {fmtNum(m[k]!)} {UNIT(k)}{d ? ` (${d > 0 ? "+" : ""}${fmtNum(d)})` : ""}</span>;
                })}
              </p>
            </div>
            <button className="btn icon danger" aria-label={`Excluir medidas de ${formatDateFull(m.date)}`} title="Excluir medidas" onClick={() => setAsking(m)}><Icon name="delete" /></button>
          </li>
        ))}
      </ul>
      {asking && <ConfirmDialog title="Excluir estas medidas?" text={`O registro de ${formatDateFull(asking.date)} sai da lista. Não dá para desfazer.`} confirmLabel="Excluir medidas" cancelLabel="Cancelar" danger
        onConfirm={() => { const a = asking; setAsking(undefined); void db.measures.delete(a.id!).then(load); }} onCancel={() => setAsking(undefined)} />}
    </section>
  );
}
