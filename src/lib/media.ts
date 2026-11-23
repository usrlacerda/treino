/** Exercícios do protocolo: miniatura em /public/exercises/<id>/0.webp e animação em anim.webp (mesma mídia do catálogo, © Gym visual). */
export const MEDIA_FRAMES: Record<string, 1> = Object.fromEntries(
  ["agach-smith", "supino-halteres", "puxada-aberta", "stiff-halteres", "rosca-barra", "triceps-corda", "abd-maquina", "leg-press",
    "supino-inclinado-maq", "remada-baixa", "mesa-flexora", "elevacao-lateral", "rosca-martelo", "panturrilha-leg", "agach-halter",
    "elev-pelvica", "puxada-fechada", "crucifixo-maq", "desenv-halteres", "triceps-testa", "abd-deitado", "prancha", "desenv-maquina", "cardio"]
    .map((id) => [id, 1 as const]),
);
/** Caminho relativo à base do app, para funcionar na raiz ou em subpasta (ex.: GitHub Pages). */
/** Exercícios vindos do catálogo têm id "ds-<número>" e uma única miniatura em /public/catalog/img. */
export const isCatalogId = (id: string) => id.startsWith("ds-");
/** Animação (WebP) dos exercícios do catálogo. */
export const animSrc = (id: string) => isCatalogId(id) ? `${import.meta.env.BASE_URL}catalog/anim/${id.slice(3)}.webp` : `${import.meta.env.BASE_URL}exercises/${id}/anim.webp`;
export const hasAnim = (id: string) => isCatalogId(id) || id in MEDIA_FRAMES;
export const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const mediaFrames = (id: string): 0 | 1 => (isCatalogId(id) ? 1 : (MEDIA_FRAMES[id] ?? 0));
export const mediaSrc = (id: string, frame: number) =>
  isCatalogId(id) ? `${import.meta.env.BASE_URL}catalog/img/${id.slice(3)}.webp` : `${import.meta.env.BASE_URL}exercises/${id}/${frame}.webp`;
