import { BrandBar, BrandHeader } from "../components/Logo";
import { BodyFigure } from "../components/BodyFigure";
import { Icon } from "../components/Icon";
import { MediaLightbox } from "../components/MediaLightbox";
import { useEffect, useMemo, useState } from "react";
import type { TreinoDB } from "../db/db";
import type { Exercise } from "../db/types";
import { loadCatalog, norm, type CatalogItem } from "../lib/catalog";
import { EQUIP_FILTERS, GROUPS, buildItems, featuredFor, type EquipKey, type GroupId, type LibItem } from "../lib/library";
import { hasAnim, mediaSrc } from "../lib/media";

const PAGE = 30;
interface Props {
  db: TreinoDB;
  /** Modo de escolha (ao montar um treino): mostra "Adicionar" em cada exercício. */
  onPick?: (ex: Exercise) => void;
  onClose?: () => void;
  /** ids de exercícios que já estão no treino (não aparecem para escolher). */
  hide?: Set<string>;
}

/** Biblioteca única: todos os exercícios (catálogo de ~1.300 + próprios), organizados por grupo muscular. Dados: hasaneyldrm/exercises-dataset; mídia © Gym visual. */
export function Library({ db, onPick, onClose, hide }: Props) {
  const [catalog, setCatalog] = useState<CatalogItem[]>();
  const [saved, setSaved] = useState<Exercise[]>([]);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<GroupId>();
  const [equip, setEquip] = useState<EquipKey | "">("");
  const [limit, setLimit] = useState(PAGE);
  const [zoom, setZoom] = useState<{ id: string; name: string }>();

  useEffect(() => {
    let alive = true;
    loadCatalog().then((c) => alive && setCatalog(c)).catch(() => alive && setFailed(true));
    void db.exercises.toArray().then((e) => alive && setSaved(e));
    return () => { alive = false; };
  }, [db]);

  const all = useMemo(() => (catalog || failed ? buildItems(catalog, saved) : []), [catalog, saved, failed]);
  const items = useMemo(() => (hide ? all.filter((i) => !hide.has(i.id)) : all), [all, hide]);
  const loading = !catalog && !failed;
  const searching = q.trim() !== "";

  const inGroup = useMemo(() => (group ? items.filter((i) => i.group === group) : items), [items, group]);
  const shown = useMemo(() => {
    const t = norm(q.trim());
    return inGroup.filter((i) => (!equip || i.equip === equip) && (!t || norm(i.name).includes(t) || (i.en && norm(i.en).includes(t)) || norm(i.equipLabel).includes(t)));
  }, [inGroup, q, equip]);
  const equipCounts = useMemo(() => {
    const m = new Map<EquipKey, number>();
    for (const i of inGroup) m.set(i.equip, (m.get(i.equip) ?? 0) + 1);
    return m;
  }, [inGroup]);

  const current = GROUPS.find((g) => g.id === group);
  const listMode = !!group || searching;
  const goBack = () => { if (group) { setGroup(undefined); setEquip(""); setLimit(PAGE); } else onClose?.(); };
  const title = current?.label ?? (onPick ? "Escolher exercício" : "Biblioteca");

  return (
    <main className="app">
      {group || onPick
        ? (<>
            <BrandBar compact />
            <header className="bar">
              <button className="btn text back" onClick={goBack}><Icon name="back" />{group ? "Voltar" : "Cancelar"}</button>
              <h1>{title}</h1>
            </header>
          </>)
        : <BrandHeader title="Biblioteca" />}
      <label className="field">Buscar exercício
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} />
      </label>
      {failed && !catalog && <p className="error block" role="alert">Não conseguimos carregar todos os exercícios. Conecte-se à internet para ver a biblioteca completa.</p>}
      {loading && <p className="muted" role="status">Carregando exercícios…</p>}

      {!loading && !listMode && (
        <ul className="group-list">
          {GROUPS.map((g) => {
            const n = items.filter((i) => i.group === g.id).length;
            const ex = featuredFor(g, items);
            return (
              <li key={g.id}>
                <button className="group-card" onClick={() => { setGroup(g.id); setLimit(PAGE); }}>
                  <BodyFigure group={g.id} view={g.view} />
                  <span className="group-main">
                    <span className="group-head"><span className="group-name">{g.label}</span><Icon name="back" size={20} /></span>
                    <span className="muted">{n.toLocaleString("pt-BR")} {n === 1 ? "exercício" : "exercícios"}</span>
                    {ex.length > 0 && <span className="group-ex" aria-hidden="true">{ex.map((e) => <span key={e.id}>{e.name}</span>)}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && listMode && (
        <>
          <div className="chips" role="group" aria-label="Filtrar por equipamento">
            <button className="chip" aria-pressed={equip === ""} onClick={() => { setEquip(""); setLimit(PAGE); }}>{equip === "" && <Icon name="check" size={18} />}Todos</button>
            {EQUIP_FILTERS.filter((f) => equipCounts.has(f.key)).map((f) => (
              <button key={f.key} className="chip" aria-pressed={equip === f.key} onClick={() => { setEquip(equip === f.key ? "" : f.key); setLimit(PAGE); }}>
                {equip === f.key && <Icon name="check" size={18} />}{f.label}
              </button>
            ))}
          </div>
          <p className="muted" aria-live="polite">{shown.length === 1 ? "1 exercício" : `${shown.length.toLocaleString("pt-BR")} exercícios`}</p>
          {shown.length === 0 && <p className="muted empty-inline">Nenhum exercício encontrado. Mude a busca ou o filtro de equipamento.</p>}
          <ul className="lib-list">
            {shown.slice(0, limit).map((i) => (
              <li key={i.id} className="lib-item">
                {hasAnim(i.id)
                  ? <button className="thumb" aria-label={`Ampliar demonstração de ${i.name}`} onClick={() => setZoom({ id: i.id, name: i.name })}><img src={mediaSrc(i.id, 0)} alt="" width="56" height="56" loading="lazy" /></button>
                  : <span className="lib-ph" aria-hidden="true" />}
                <div className="lib-text">
                  <strong>{i.name}</strong>
                  <span className="muted">{i.equipLabel}{i.target ? ` · ${i.target}` : ""}{i.custom && <span className="badge inline">Próprio</span>}</span>
                </div>
                {onPick && <button className="btn tonal small" aria-label={`Adicionar ${i.name}`} onClick={() => onPick(i.ex)}><Icon name="add" size={18} />Adicionar</button>}
              </li>
            ))}
          </ul>
          {shown.length > limit && <button className="btn ghost wide" onClick={() => setLimit((n) => n + PAGE)}>Mostrar mais ({(shown.length - limit).toLocaleString("pt-BR")})</button>}
        </>
      )}
      {zoom && <MediaLightbox id={zoom.id} name={zoom.name} onClose={() => setZoom(undefined)} />}
      <p className="muted credits">Dados: hasaneyldrm/exercises-dataset. Imagens © <a href="https://gymvisual.com/" target="_blank" rel="noreferrer nofollow">Gym visual</a> (abre em nova aba).</p>
    </main>
  );
}
