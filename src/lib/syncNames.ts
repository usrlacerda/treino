import type { TreinoDB } from "../db/db";
import { loadCatalog } from "./catalog";

/** Mantém os nomes dos exercícios salvos iguais aos do catálogo (que pode ter nomes melhores). Só mexe em nome, grupo e equipamento. */
export async function syncCatalogNames(db: TreinoDB): Promise<number> {
  const catalog = await loadCatalog();
  const byId = new Map(catalog.map((c) => [`ds-${c.id}`, c]));
  const changed = (await db.exercises.toArray()).flatMap((e) => {
    const c = byId.get(e.id);
    return c && (c.name !== e.name || c.muscle !== e.muscle) ? [{ ...e, name: c.name, muscle: c.muscle }] : [];
  });
  if (changed.length) await db.exercises.bulkPut(changed);
  return changed.length;
}
