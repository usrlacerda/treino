import Dexie from "dexie";

/** Fonte escolhida pela pessoa: fica só neste aparelho (IndexedDB) e nunca vai para o site publicado nem para o backup. */
const store = new Dexie("treino-fonte");
store.version(1).stores({ files: "weight" });
interface FontRow { weight: number; name: string; data: Blob }

/** Peso pelo nome do arquivo (SamsungSans-Bold.ttf → 700). Sem pista no nome, vale como Regular. */
export function weightFromName(name: string): number {
  const n = name.toLowerCase();
  if (/thin|hairline/.test(n)) return 100;
  if (/extralight|ultralight/.test(n)) return 200;
  if (/light/.test(n)) return 300;
  if (/medium/.test(n)) return 500;
  if (/semibold|demibold/.test(n)) return 600;
  if (/extrabold|ultrabold/.test(n)) return 800;
  if (/black|heavy/.test(n)) return 900;
  if (/bold/.test(n)) return 700;
  return 400;
}

const loaded: FontFace[] = [];
function clearFaces() { for (const f of loaded.splice(0)) document.fonts.delete(f); document.documentElement.style.removeProperty("--font-user"); }

/** Aplica as fontes guardadas, se houver. */
export async function applyUserFont(): Promise<number> {
  clearFaces();
  if (typeof FontFace === "undefined") return 0;
  const rows = (await store.table<FontRow>("files").toArray());
  for (const r of rows) {
    const face = new FontFace("Fonte do usuário", await r.data.arrayBuffer(), { weight: String(r.weight) });
    await face.load(); document.fonts.add(face); loaded.push(face);
  }
  if (rows.length) document.documentElement.style.setProperty("--font-user", '"Fonte do usuário"');
  return rows.length;
}

export async function saveUserFont(files: File[]): Promise<number> {
  const rows: FontRow[] = files.filter((f) => /\.(ttf|otf|woff2?)$/i.test(f.name)).map((f) => ({ weight: weightFromName(f.name), name: f.name, data: f }));
  if (!rows.length) return 0;
  await store.table("files").clear();
  await store.table("files").bulkPut(rows);
  return applyUserFont();
}

export async function clearUserFont(): Promise<void> { await store.table("files").clear(); clearFaces(); }
export const hasUserFont = async () => (await store.table("files").count()) > 0;
