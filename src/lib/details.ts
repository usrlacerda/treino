import { isCatalogId } from "./media";

/** Como fazer o exercício (passo a passo em português) e músculos que ajudam. Vem de catalog/info/<número>.json, baixado só ao abrir o exercício. */
export interface Details { p: string[]; s: string[] }

const cache = new Map<string, Promise<Details | undefined>>();
export function loadDetails(id: string): Promise<Details | undefined> {
  if (!isCatalogId(id)) return Promise.resolve(undefined);
  let hit = cache.get(id);
  if (!hit) {
    hit = fetch(`${import.meta.env.BASE_URL}catalog/info/${id.slice(3)}.json`)
      .then((r) => (r.ok ? r.json() : undefined))
      .then((d: unknown): Details | undefined => { const o = d as Partial<Details> | undefined; return o && Array.isArray(o.p) ? { p: o.p.filter((x) => typeof x === "string"), s: Array.isArray(o.s) ? o.s.filter((x) => typeof x === "string") : [] } : undefined; })
      .catch(() => undefined);
    cache.set(id, hit);
    void hit.then((d) => { if (!d) cache.delete(id); }); // não guarda falha: tenta de novo na próxima abertura
  }
  return hit;
}
export const resetDetailsCache = () => cache.clear();
