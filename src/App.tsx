import { useEffect, useState } from "react";
import { db as defaultDb, seedIfEmpty, type TreinoDB } from "./db/db";
import { closeStaleSessions } from "./db/repo";
import { Home } from "./screens/Home";
import { History } from "./screens/History";
import { Library } from "./screens/Library";
import { EditWorkout, NEW_WORKOUT } from "./screens/EditWorkout";
import { Settings } from "./screens/Settings";
import { ImportWorkouts } from "./screens/ImportWorkouts";
import { ActiveWorkout } from "./screens/ActiveWorkout";
import { applyUserFont } from "./lib/userFont";
import { fmtNum, plural } from "./lib/format";

const TABS = [
  { id: "treinos", label: "Treinos", d: "M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" },
  { id: "biblioteca", label: "Biblioteca", d: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" },
  { id: "historico", label: "Histórico", d: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" },
  { id: "ajustes", label: "Ajustes", d: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" },
] as const;

export function App({ db = defaultDb }: { db?: TreinoDB }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<string>();
  const [resumeId, setResumeId] = useState<number>();
  const [tab, setTab] = useState<"treinos" | "biblioteca" | "historico" | "ajustes">("treinos");
  const [dataVersion, setDataVersion] = useState(0);
  const [editing, setEditing] = useState<string>();
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string>();

  useEffect(() => { void applyUserFont().catch(() => undefined); }, []);

  useEffect(() => {
    setFailed(false);
    seedIfEmpty(db).then(() => closeStaleSessions(db)).then(() => setReady(true)).catch(() => setFailed(true));
    // Pede ao navegador para não apagar os dados do app quando faltar espaço.
    void navigator.storage?.persist?.()?.catch?.(() => undefined);
  }, [db, attempt]);

  if (failed) {
    return (
      <main className="app" role="alert">
        <h1>CG - Corre Gordo</h1>
        <p>Não conseguimos abrir seus dados neste navegador. Feche outras abas do Treino e tente de novo.</p>
        <button className="btn" onClick={() => setAttempt((n) => n + 1)}>Tentar de novo</button>
      </main>
    );
  }
  if (!ready) return <main className="app"><p className="muted">Carregando…</p></main>;
  if (importing) {
    return <ImportWorkouts db={db} onClose={(msg) => { setNotice(msg); setDataVersion((n) => n + 1); setImporting(false); if (msg) setTab("treinos"); }} />;
  }
  if (editing) {
    return <EditWorkout key={editing} db={db} workoutId={editing} onClose={(msg) => { setNotice(msg); setEditing(undefined); }} />;
  }
  if (active) {
    return (
      <ActiveWorkout
        key={`${active}-${resumeId ?? 0}`}
        db={db}
        workoutId={active}
        resumeSessionId={resumeId}
        onExit={(saved) => {
          setNotice(saved ? `Treino salvo: ${plural(saved.sets, "série", "séries")}, ${fmtNum(saved.volumeKg)} kg de volume.` : undefined);
          setActive(undefined); setResumeId(undefined);
        }}
      />
    );
  }
  return (
    <>
      {tab === "treinos" && <Home key={dataVersion} db={db} notice={notice} onStart={(id, sid) => { setNotice(undefined); setResumeId(sid); setActive(id); }} onEdit={(id) => { setNotice(undefined); setEditing(id); }} onNew={() => { setNotice(undefined); setEditing(NEW_WORKOUT); }} />}
      {tab === "biblioteca" && <Library key={dataVersion} db={db} />}
      {tab === "historico" && <History key={dataVersion} db={db} onGoTreinos={() => setTab("treinos")} />}
      {tab === "ajustes" && <Settings db={db} onImportWorkouts={() => { setNotice(undefined); setImporting(true); }} onImported={(m) => { setDataVersion((n) => n + 1); setNotice(m); setTab("treinos"); }} />}
      <nav className="tabs" aria-label="Navegação">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            <span className="pill"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d={t.d} /></svg></span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
