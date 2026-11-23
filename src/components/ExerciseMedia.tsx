import { useState } from "react";
import { animSrc, isCatalogId, mediaFrames, mediaSrc, prefersReducedMotion } from "../lib/media";

/** Ilustração com duas posições (início e fim do movimento) alternando em loop. Sem imagem: não mostra nada. */
export function ExerciseMedia({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const frames = mediaFrames(id) || undefined;
  if (isCatalogId(id) && !failed && !prefersReducedMotion())
    return <div className="media"><img src={animSrc(id)} alt={`${name}: demonstração do movimento`} loading="lazy" onError={() => setFailed(true)} /></div>;
  if (!frames || (failed && !isCatalogId(id))) return null;
  return (
    <div className="media">
      <img src={mediaSrc(id, 0)} alt={frames === 2 ? `${name}: posição inicial` : name} loading="lazy" onError={() => setFailed(true)} />
      {frames === 2 && <img src={mediaSrc(id, 1)} alt="" aria-hidden="true" loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}
