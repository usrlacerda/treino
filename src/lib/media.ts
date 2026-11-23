/** Todos os exercícios vêm do catálogo (id "ds-<número>"): miniatura em /catalog/img e animação em /catalog/anim (© Gym visual). */
export const isCatalogId = (id: string) => id.startsWith("ds-");
const base = () => import.meta.env.BASE_URL;
export const animSrc = (id: string) => `${base()}catalog/anim/${id.slice(3)}.webp`;
export const mediaSrc = (id: string) => `${base()}catalog/img/${id.slice(3)}.webp`;
export const hasAnim = isCatalogId;
export const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
