import { useEffect, useState } from "react";
import { loadDetails, type Details } from "../lib/details";
import { Icon } from "./Icon";
import { useBackClose } from "../lib/useBackClose";

import { animSrc, hasAnim, mediaSrc, prefersReducedMotion } from "../lib/media";

/** Janela com a demonstração do exercício em tamanho grande. Fecha com o botão, tocando fora ou com Esc. */
export function MediaLightbox({ id, name, onClose, children }: { id: string; name: string; onClose: () => void; /** botões de ação (ex.: adicionar a um treino) flutuam no rodapé do card */ children?: React.ReactNode }) {
  useBackClose(true, onClose);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const [info, setInfo] = useState<Details>();
  const [ready, setReady] = useState(false);
  useEffect(() => { let on = true; setReady(false); void loadDetails(id).then((d) => { if (on) { setInfo(d); setReady(true); } }); return () => { on = false; }; }, [id]);
  const animated = hasAnim(id) && !prefersReducedMotion();
  return (
    <div className="overlay" onClick={onClose}>
      <div className={"dialog lightbox" + (ready ? "" : " loading")} role="dialog" aria-busy={!ready} aria-modal="true" aria-labelledby="lb-t" onClick={(e) => e.stopPropagation()}>
        <div className="lb-top"><button className="lb-close" aria-label="Fechar" title="Fechar" autoFocus onClick={onClose}><Icon name="close" size={22} /></button></div>
        {!ready && <p className="lb-wait" role="status">Carregando…</p>}
        <h2 id="lb-t">{name}</h2>
        <div className="lightbox-img">
          <img width={360} height={360} decoding="async" src={animated ? animSrc(id) : mediaSrc(id)} alt={animated ? `${name}: demonstração do movimento` : name} />
        </div>
        {info && info.p.length > 0 && (
          <section className="how" aria-labelledby="lb-how">
            <h3 id="lb-how">Como fazer</h3>
            <ol>{info.p.map((s, n) => <li key={n}>{s}</li>)}</ol>
            {info.s.length > 0 && <p className="also"><strong>Também trabalha:</strong> {info.s.join(", ")}.</p>}
          </section>
        )}
        {children && <div className="lb-actions">{children}</div>}
      </div>
    </div>
  );
}
