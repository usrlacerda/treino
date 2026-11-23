import { useBackClose } from "../lib/useBackClose";
import { BrandHeader } from "../components/Logo";
import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { backupFileName, exportData, importBackup, isBackupError, MAX_BACKUP_BYTES, parseBackupText, type Backup } from "../db/backup";
import { formatDateFull } from "../lib/time";
import { Icon } from "../components/Icon";
import { plural } from "../lib/format";
import { readText } from "../lib/download";
import { getGoal, setGoal } from "../lib/goal";
import pkg from "../../package.json";

const KEY = "treino:lastBackup";
const readLast = (): number | undefined => { try { const v = Number(localStorage.getItem(KEY)); return v > 0 ? v : undefined; } catch { return undefined; } };
const saveLast = (t: number) => { try { localStorage.setItem(KEY, String(t)); } catch { /* sem armazenamento */ } };



interface Props { db: TreinoDB; onImported: (summary: string) => void; onImportWorkouts: () => void }

export function Settings({ db, onImported, onImportWorkouts }: Props) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [pending, setPending] = useState<Backup>();
  useBackClose(!!pending, () => setPending(undefined));
  const [current, setCurrent] = useState<string>();
  const [last, setLast] = useState(readLast);
  const [goal, setGoalState] = useState(getGoal);
  async function doExport() {
    try {
      const data = await exportData(db);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = backupFileName();
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      const now = Date.now(); saveLast(now); setLast(now);
      setMsg({ ok: true, text: `Backup gerado: ${a.download}. Guarde o arquivo em um lugar seguro.` });
    } catch { setMsg({ ok: false, text: "Não conseguimos gerar o backup. Seus dados continuam no app. Tente de novo." }); }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(undefined);
    if (file.size > MAX_BACKUP_BYTES) { setMsg({ ok: false, text: "O arquivo é grande demais (máximo de 5 MB)." }); return; }
    try {
      const b = parseBackupText(await readText(file));
      const [n, last] = await Promise.all([db.sessions.count(), db.sessions.orderBy("startedAt").last()]);
      setCurrent(n ? `Hoje você tem ${plural(n, "sessão", "sessões")}, a última em ${formatDateFull(last?.startedAt ?? Date.now())}.` : "Hoje você não tem sessões registradas.");
      setPending(b);
    }
    catch (err) { setMsg({ ok: false, text: isBackupError(err) || err instanceof Error ? err.message : "Não conseguimos ler o arquivo." }); }
  }

  async function confirmImport() {
    if (!pending) return;
    const b = pending; setPending(undefined);
    try {
      await importBackup(db, b);
      onImported(`Backup importado: ${plural(b.workouts.length, "treino", "treinos")}, ${plural(b.sessions.length, "sessão", "sessões")}.`);
    } catch { setMsg({ ok: false, text: "Não conseguimos importar. Seus dados atuais não foram alterados." }); }
  }

  return (
    <main className="app">
      <BrandHeader title="Ajustes" />
      <section className="exercise" aria-labelledby="gl-h">
        <h2 id="gl-h">Meta da semana</h2>
        <p className="muted">Quantos treinos você quer fazer por semana. O progresso aparece no Início.</p>
        <label className="field">Treinos por semana
          <select aria-label="Meta de treinos por semana" value={goal} onChange={(e) => { const n = Number(e.target.value); setGoal(n); setGoalState(n); }}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </section>
      <section className="exercise" aria-labelledby="tr-h">
        <h2 id="tr-h">Treinos</h2>
        <p className="muted">Adicione treinos de um arquivo, sem apagar os que você já tem.</p>
        <button className="btn ghost wide" onClick={onImportWorkouts}><Icon name="download" size={20} />Importar treinos de um arquivo</button>
      </section>
      <section className="exercise" aria-labelledby="bk-h">
        <h2 id="bk-h">Backup</h2>
        <p className="muted">Seus dados ficam só neste aparelho. Exporte um backup de vez em quando para não perder o histórico se limpar o navegador ou trocar de celular.</p>
        <p className="muted">{last ? `Último backup: ${formatDateFull(last)}.` : "Você ainda não exportou nenhum backup."}</p>
        <button className="btn wide" onClick={() => void doExport()}><Icon name="upload" size={20} />Exportar backup</button>
        <label className="btn ghost wide filebtn"><Icon name="download" size={20} />Importar backup
          <input type="file" accept="application/json,.json" onChange={(e) => void onFile(e)} />
        </label>
        {msg && <p className={msg.ok ? "notice" : "error block"} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      </section>
      <section className="exercise" aria-labelledby="sb-h">
        <h2 id="sb-h">Sobre</h2>
        <p className="muted">CG Fit {pkg.version}. O app funciona sem internet e não envia seus dados a nenhum servidor. Só o catálogo de exercícios precisa de conexão na primeira vez que você o abre.</p>
        <p className="muted">Estas orientações são gerais. Se tiver dor ou alguma condição de saúde, consulte um profissional antes de treinar.</p>
        <p className="muted">Imagens dos exercícios: © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a> (abre em nova aba). Dados: hasaneyldrm/exercises-dataset.</p>
      </section>
      {pending && (
        <div className="overlay">
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="imp-t" aria-describedby="imp-d">
            <h2 id="imp-t">Substituir seus dados?</h2>
            <p id="imp-d" className="muted">
              O backup de {formatDateFull(Date.parse(pending.exportedAt) || Date.now())} tem {plural(pending.workouts.length, "treino", "treinos")}, {plural(pending.sessions.length, "sessão", "sessões")} e {plural(pending.exercises.length, "exercício próprio", "exercícios próprios")}. {current} Ele substitui tudo o que está no app agora, e isso não dá para desfazer. Se tiver dúvida, cancele e exporte um backup antes.
            </p>
            <button className="btn" onClick={() => void confirmImport()}>Substituir meus dados</button>
            <button className="btn ghost" autoFocus onClick={() => setPending(undefined)}>Cancelar</button>
          </div>
        </div>
      )}
    </main>
  );
}
