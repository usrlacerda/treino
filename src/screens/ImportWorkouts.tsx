import { BrandBar } from "../components/Logo";
import { useEffect, useMemo, useState } from "react";
import type { TreinoDB } from "../db/db";
import { applyImport, buildPreview, exportPlan, parsePlanText, planTemplate, PlanImportError, suggestName, type ImportPreview } from "../db/planImport";
import { Icon } from "../components/Icon";
import { downloadJson, readText } from "../lib/download";
import { plural } from "../lib/format";
import { MUSCLE_LABEL } from "../lib/muscles";

const MAX_BYTES = 1024 * 1024;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").trim();

interface Row { include: boolean; name: string }
interface Props { db: TreinoDB; onClose: (notice?: string) => void }

const EXAMPLE = `{
  "app": "treino", "kind": "plano", "schema": 1,
  "workouts": [{
    "name": "Treino D",
    "items": [
      { "exerciseName": "Leg press", "sets": 3, "reps": "10-12", "restSec": 90 },
      { "exerciseName": "Remada curvada", "muscle": "costas" },
      { "exerciseName": "Cardio (esteira, bike ou elíptico)", "durationMin": 15 }
    ]
  }]
}`;

export function ImportWorkouts({ db, onClose }: Props) {
  const [preview, setPreview] = useState<ImportPreview>();
  const [rows, setRows] = useState<Row[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState<Record<string, string>>({});

  useEffect(() => {
    void Promise.all([db.workouts.toArray(), db.exercises.toArray()]).then(([w, e]) => {
      setExisting(w.map((x) => x.name));
      setLib(Object.fromEntries(e.map((x) => [x.id, x.name])));
    });
  }, [db]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(undefined);
    if (f.size > MAX_BYTES) { setError("O arquivo é grande demais (máximo de 1 MB)."); return; }
    try {
      const p = await buildPreview(db, parsePlanText(await readText(f)));
      const taken = [...existing];
      const rs = p.workouts.map((w): Row => { const name = suggestName(w.name, taken); taken.push(name); return { include: true, name }; });
      setPreview(p); setRows(rs); setFileName(f.name);
    } catch (err) {
      setError(err instanceof PlanImportError || err instanceof Error ? err.message : "Não conseguimos ler o arquivo.");
    }
  }

  const problems = useMemo(() => rows.map((r, i) => {
    if (!r.include) return undefined;
    const n = r.name.trim();
    if (n.length < 1 || n.length > 40) return "O nome deve ter de 1 a 40 caracteres.";
    if (existing.some((x) => norm(x) === norm(n))) return "Já existe um treino com esse nome.";
    if (rows.some((o, j) => j < i && o.include && norm(o.name) === norm(n))) return "Outro treino da lista tem o mesmo nome.";
    return undefined;
  }), [rows, existing]);

  const chosen = rows.filter((r) => r.include).length;
  const blocked = chosen === 0 || problems.some(Boolean);
  const usedNew = preview ? preview.newExercises.filter((e) => preview.workouts.some((w, i) => rows[i]?.include && w.items.some((it) => it.exerciseId === e.id))) : [];

  async function confirm() {
    if (!preview || blocked || busy) return;
    setBusy(true);
    try {
      const sel = rows.map((r, index) => ({ index, name: r.name, include: r.include })).filter((r) => r.include).map(({ index, name }) => ({ index, name }));
      const n = await applyImport(db, preview, sel);
      onClose(`${plural(n, "treino adicionado", "treinos adicionados")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não conseguimos importar. Seus treinos não foram alterados.");
      setBusy(false);
    }
  }

  const patch = (i: number, p: Partial<Row>) => { setRows((rs) => rs.map((r, n) => (n === i ? { ...r, ...p } : r))); setError(undefined); };

  return (
    <main className="app">
      <BrandBar compact />
      <header className="bar">
        <h1>Importar treinos</h1>
      </header>

      {!preview ? (
        <>
          <p className="muted">Adicione treinos de um arquivo. Seus treinos e seu histórico não são alterados.</p>
          <section className="exercise" aria-labelledby="imp1">
            <h2 id="imp1"><span className="step">1</span> Escolha o arquivo</h2>
            <label className="drop">
              <span className="drop-title">Escolher arquivo de treinos</span>
              <span className="muted">Formato .json (até 1 MB)</span>
              <input type="file" accept="application/json,.json" onChange={(e) => void onFile(e)} />
            </label>
            {error && <p className="error block" role="alert">{error}</p>}
          </section>
          <section className="exercise" aria-labelledby="imp2">
            <h2 id="imp2"><span className="step">2</span> Ainda não tem o arquivo?</h2>
            <p className="muted">Baixe o modelo, edite os treinos e importe de volta. Você também pode exportar os seus treinos para passar a outra pessoa.</p>
            <div className="row-actions">
              <button className="btn ghost" onClick={() => downloadJson("treino-modelo.json", planTemplate())}><Icon name="download" size={20} />Baixar modelo</button>
              <button className="btn ghost" onClick={() => void exportPlan(db).then((p) => downloadJson("treino-meus-treinos.json", p))}><Icon name="upload" size={20} />Exportar meus treinos</button>
            </div>
            <details className="how">
              <summary>Como montar o arquivo</summary>
              <ul className="muted">
                <li>Cada treino tem um nome e uma lista de exercícios.</li>
                <li>Use o nome do exercício igual ao da Biblioteca (acentos e maiúsculas não importam).</li>
                <li>Exercício que não existe? Informe o grupo muscular em "muscle" e ele será criado.</li>
                <li>Repetições podem ser "8-12" ou "12". Sem informar, o app usa 3 séries de 8-12, com 60 s de descanso.</li>
                <li>Cardio: use "durationMin" (minutos).</li>
              </ul>
              <pre tabIndex={0} aria-label="Exemplo de arquivo">{EXAMPLE}</pre>
            </details>
          </section>
        </>
      ) : (
        <>
          <p className="notice" role="status">
            {fileName}: {plural(preview.workouts.length, "treino encontrado", "treinos encontrados")}.
            {usedNew.length > 0 && ` ${plural(usedNew.length, "exercício novo será criado", "exercícios novos serão criados")}.`}
          </p>
          {rows.map((r, i) => {
            const w = preview.workouts[i];
            const err = problems[i];
            return (
              <section key={i} className={"exercise" + (r.include ? "" : " off")} aria-label={`Treino ${i + 1} do arquivo`}>
                <label className="check-row">
                  <input type="checkbox" checked={r.include} onChange={(e) => patch(i, { include: e.target.checked })} />
                  <span>Importar “{w.name}”</span>
                </label>
                <label className="field">Nome do treino
                  <input value={r.name} maxLength={40} disabled={!r.include} aria-invalid={err ? true : undefined} onChange={(e) => patch(i, { name: e.target.value })} />
                </label>
                {err && <p className="error block" role="alert">{err}</p>}
                <details className="how">
                  <summary>{plural(w.items.length, "exercício", "exercícios")}</summary>
                  <ol className="plan-list">
                    {w.items.map((it, n) => (
                      <li key={n}>
                        <strong>{lib[it.exerciseId] ?? preview.newExercises.find((e) => e.id === it.exerciseId)?.name ?? it.exerciseId}</strong>
                        {preview.newExercises.some((e) => e.id === it.exerciseId) && <span className="badge inline">Novo</span>}
                        <span className="muted"> · {it.durationMin ? `${it.durationMin} min` : `${it.sets}×${it.repMin === it.repMax ? it.repMin : `${it.repMin}-${it.repMax}`} · ${it.restSec}s`}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              </section>
            );
          })}
          {usedNew.length > 0 && (
            <section className="exercise" aria-label="Exercícios novos">
              <h2>Exercícios novos</h2>
              <ul className="plan-list">{usedNew.map((e) => <li key={e.id}><strong>{e.name}</strong> <span className="muted">· {MUSCLE_LABEL[e.muscle]}</span></li>)}</ul>
              <p className="muted">Ficam na Biblioteca, sem ilustração.</p>
            </section>
          )}
          {error && <p className="error block" role="alert">{error}</p>}
          <div className="sticky-actions">
            <button className="btn ghost" onClick={() => { setPreview(undefined); setRows([]); setError(undefined); }}><Icon name="refresh" size={20} />Escolher outro arquivo</button>
            <button className="btn" disabled={blocked || busy} onClick={() => void confirm()}>
              <Icon name="add" size={20} />
              {chosen === 0 ? "Escolha um treino" : `Adicionar ${plural(chosen, "treino", "treinos")}`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
