import { useEffect } from "react";
import { Icon } from "./Icon";
import { animSrc, hasAnim, mediaSrc, prefersReducedMotion } from "../lib/media";

/** Janela com a demonstração do exercício em tamanho grande. Fecha com o botão, tocando fora ou com Esc. */
export function MediaLightbox({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const animated = hasAnim(id) && !prefersReducedMotion();
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog lightbox" role="dialog" aria-modal="true" aria-labelledby="lb-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="lb-t">{name}</h2>
        <div className="lightbox-img">
          <img src={animated ? animSrc(id) : mediaSrc(id)} alt={animated ? `${name}: demonstração do movimento` : name} />
        </div>
        <button className="btn tonal" autoFocus onClick={onClose}><Icon name="close" size={20} />Fechar</button>
      </div>
    </div>
  );
}
