import { useState } from "react";
import { animSrc, hasAnim, mediaSrc, prefersReducedMotion } from "../lib/media";

/** Demonstração animada do movimento (mesmo estilo para todos os exercícios). Com "reduzir movimento" ou se a animação falhar, mostra a imagem estática. */
export function ExerciseMedia({ id, name }: { id: string; name: string }) {
  const [animFailed, setAnimFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!hasAnim(id) || failed) return null;
  const animated = !animFailed && !prefersReducedMotion();
  return (
    <div className="media">
      <img src={animated ? animSrc(id) : mediaSrc(id)} alt={!name ? "" : animated ? `${name}: demonstração do movimento` : name} width={300} height={300} loading="lazy"
        onError={() => (animated ? setAnimFailed(true) : setFailed(true))} />
    </div>
  );
}
