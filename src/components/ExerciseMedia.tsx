import { useState } from "react";
import { MEDIA_FRAMES, mediaSrc } from "../lib/media";

/** Ilustração com duas posições (início e fim do movimento) alternando em loop. Sem imagem: não mostra nada. */
export function ExerciseMedia({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const frames = MEDIA_FRAMES[id];
  if (!frames || failed) return null;
  return (
    <div className="media">
      <img src={mediaSrc(id, 0)} alt={frames === 2 ? `${name}: posição inicial` : name} loading="lazy" onError={() => setFailed(true)} />
      {frames === 2 && <img src={mediaSrc(id, 1)} alt="" aria-hidden="true" loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}
