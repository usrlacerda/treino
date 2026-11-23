import type { GroupId } from "../lib/library";
import { BODY } from "../lib/bodyData";

/** Quais partes do desenho anatômico acendem para cada grupo da Biblioteca. */
const PARTS: Record<GroupId, string[]> = {
  peito: ["chest"],
  costas: ["upper-back", "trapezius", "lower-back"],
  ombros: ["deltoids"],
  pernas: ["quadriceps", "hamstring", "adductors", "calves", "tibialis"],
  gluteos: ["gluteal"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebraco: ["forearm"],
  abdomen: ["abs", "obliques"],
  cardio: ["chest", "abs", "obliques", "quadriceps", "hamstring", "calves", "gluteal", "deltoids", "trapezius", "upper-back", "lower-back"],
};
const NOT_MUSCLE = new Set(["hair", "head", "hands", "feet", "neck", "ankles"]);

/** Corpo anatômico (caminhos de react-native-body-parts-anatomy, MIT) com o grupo muscular destacado. */
export function BodyFigure({ group, view }: { group: GroupId; view: "front" | "back" }) {
  const v = BODY[view];
  const lit = PARTS[group];
  return (
    <svg className="figure" viewBox={v.viewBox} aria-hidden="true" focusable="false">
      <path className="body" d={v.outline} />
      {Object.entries(v.groups).filter(([k]) => !NOT_MUSCLE.has(k)).map(([k, d]) => (
        <path key={k} className={lit.includes(k) ? "hl on" : "hl"} d={d} />
      ))}
    </svg>
  );
}
