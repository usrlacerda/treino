import { useEffect, useState } from "react";
import type { TreinoDB } from "../db/db";
import { listFinishedSessions, nextWorkoutId } from "../db/repo";
import type { Session, Workout } from "../db/types";
import { BrandHeader } from "../components/Logo";
import { Icon } from "../components/Icon";
import { TopBanners } from "../components/TopBanners";
import { fmtNum, plural } from "../lib/format";
import { greeting, relativeDay, summarizeWeek, volumeOf } from "../lib/week";

const DAYS = [["S", "segunda"], ["T", "terça"], ["Q", "quarta"], ["Q", "quinta"], ["S", "sexta"], ["S", "sábado"], ["D", "domingo"]] as const;

interface Props { db: TreinoDB; notice?: string; onStart: (workoutId: string, resumeSessionId?: number) => void; onGoTreinos: () => void }

/** Tela inicial: o que treinar hoje, como está a semana e o último treino. */
export function Inicio({ db, notice, onStart, onGoTreinos }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>();
  const [names, setNames] = useState<Record<string, string>>({});
  const [next, setNext] = useState<string>();
  const [sessions, setSessions] = useState<Session[]>();
  useEffect(() => {
    db.workouts.orderBy("order").toArray().then(setWorkouts);
    db.exercises.toArray().then((all) => setNames(Object.fromEntries(all.map((e) => [e.id, e.name]))));
    nextWorkoutId(db).then(setNext).catch(() => undefined);
    listFinishedSessions(db).then(setSessions);
  }, [db]);

  if (!workouts || !sessions) return <main className="app"><BrandHeader title="Início" /><p className="muted">Carregando…</p></main>;

  const today = workouts.find((w) => w.id === next);
  const week = summarizeWeek(sessions);
  const last = [...sessions].sort((a, b) => b.startedAt - a.startedAt)[0];
  const lastName = last && (workouts.find((w) => w.id === last.workoutId)?.name ?? "Treino");
  const list = today?.items.map((i) => names[i.exerciseId]).filter(Boolean) ?? [];
  const diff = week.prevVolume > 0 && week.count > 0 ? Math.round(((week.volume - week.prevVolume) / week.prevVolume) * 100) : undefined;

  return (
    <main className="app">
      <BrandHeader title="Início" />
      <TopBanners db={db} workouts={workouts} onStart={onStart} />
      {notice && <p className="notice" role="status">{notice}</p>}
      <p className="greet">{greeting()}!</p>

      {today ? (
        <section className="hero" aria-labelledby="hero-t">
          <span className="hero-eyebrow">{sessions.length ? "Treino de hoje" : "Para começar"}</span>
          <h2 id="hero-t" className="hero-title">{today.name}</h2>
          <p className="hero-meta">{plural(today.items.length, "exercício", "exercícios")}{list.length > 0 && <> · {list.slice(0, 3).join(" · ")}{list.length > 3 ? ` · +${list.length - 3}` : ""}</>}</p>
          <button className="btn hero-go" onClick={() => onStart(today.id)}><Icon name="play" size={22} />Começar treino</button>
        </section>
      ) : (
        <section className="empty" aria-label="Sem treinos">
          <h2>Nenhum treino criado</h2>
          <button className="btn" onClick={onGoTreinos}><Icon name="add" size={20} />Criar treino</button>
        </section>
      )}

      <section className="week" aria-labelledby="wk-t">
        <h2 id="wk-t" className="section-title">Esta semana</h2>
        <ol className="week-days">
          {DAYS.map(([l, full], i) => (
            <li key={i} className={(week.days[i] ? "done " : "") + (i === week.today ? "today" : "")} aria-label={`${full}${week.days[i] ? ", treinou" : ""}${i === week.today ? ", hoje" : ""}`}>
              <span className="dot">{week.days[i] && <Icon name="check" size={16} />}</span>
              <span className="lbl" aria-hidden="true">{l}</span>
            </li>
          ))}
        </ol>
        <div className="stats">
          <div className="stat"><strong>{week.count}</strong><span>{week.count === 1 ? "treino" : "treinos"}</span></div>
          <div className="stat"><strong>{fmtNum(week.volume)}</strong><span>kg de volume{diff !== undefined && <em className={diff >= 0 ? "up" : "down"}> {diff >= 0 ? "+" : ""}{diff}% vs. semana passada</em>}</span></div>
          {week.streakWeeks >= 2 && <div className="stat"><strong>{week.streakWeeks}</strong><span>semanas seguidas</span></div>}
        </div>
      </section>

      {last && (
        <section className="last" aria-labelledby="ls-t">
          <h2 id="ls-t" className="section-title">Último treino</h2>
          <p><strong>{lastName}</strong> · {relativeDay(last.startedAt)}</p>
          <p className="muted">{plural(last.sets.length, "série", "séries")} · {fmtNum(volumeOf(last))} kg de volume</p>
        </section>
      )}
      {!last && <p className="muted tip">Conclua seu primeiro treino para ver aqui o resumo da semana e o seu progresso.</p>}
    </main>
  );
}
