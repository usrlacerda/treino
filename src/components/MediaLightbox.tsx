import { useEffect, useState } from "react";
import { loadDetails, type Details } from "../lib/details";
import { Icon } from "./Icon";
import { animSrc, hasAnim, mediaSrc, prefersReducedMotion } from "../lib/media";

/** Janela com a demonstração do exercício em tamanho grande. Fecha com o botão, tocando fora ou com Esc. */
export function MediaLightbox({ id, name, onClose, children }: { id: string; name: string; onClose: () => void; /** botões de ação (ex.: adicionar a um treino) acima do "Fechar" */ children?: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const [info, setInfo] = useState<Details>();
  useEffect(() => { let on = true; void loadDetails(id).then((d) => { if (on) setInfo(d); }); return () => { on = false; }; }, [id]);
  const animated = hasAnim(id) && !prefersReducedMotion();
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog lightbox" role="dialog" aria-modal="true" aria-labelledby="lb-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="lb-t">{name}</h2>
        <div className="lightbox-img">
          <img src={animated ? animSrc(id) : mediaSrc(id)} alt={animated ? `${name}: demonstração do movimento` : name} />
        </div>
        {info && info.p.length > 0 && (
          <section className="how" aria-labelledby="lb-how">
            <h3 id="lb-how">Como fazer</h3>
            <ol>{info.p.map((s, n) => <li key={n}>{s}</li>)}</ol>
            {info.s.length > 0 && <p className="also"><strong>Também trabalha:</strong> {info.s.join(", ")}.</p>}
          </section>
        )}
        {children}
        <button className="btn tonal" autoFocus onClick={onClose}><Icon name="close" size={20} />Fechar</button>
      </div>
    </div>
  );
}
