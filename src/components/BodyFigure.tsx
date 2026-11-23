import type { GroupId } from "../lib/library";

/** Boneco simplificado (desenho próprio) com o grupo muscular destacado. */
export function BodyFigure({ group, view }: { group: GroupId; view: "front" | "back" }) {
  const on = (g: GroupId[]) => (g.includes(group) ? "hl on" : "hl");
  return (
    <svg className="figure" viewBox="0 0 100 160" aria-hidden="true" focusable="false">
      <g className="body">
        <circle cx="50" cy="14" r="10" />
        <rect x="45" y="22" width="10" height="8" rx="3" />
        <path d="M30 30 Q50 26 70 30 L66 82 Q50 88 34 82 Z" />
        <rect x="17" y="32" width="11" height="32" rx="5.5" /><rect x="72" y="32" width="11" height="32" rx="5.5" />
        <rect x="15" y="62" width="10" height="32" rx="5" /><rect x="75" y="62" width="10" height="32" rx="5" />
        <rect x="32" y="82" width="17" height="44" rx="8" /><rect x="51" y="82" width="17" height="44" rx="8" />
        <rect x="34" y="124" width="13" height="34" rx="6" /><rect x="53" y="124" width="13" height="34" rx="6" />
      </g>
      <g>
        {view === "front" && <>
          <g className={on(["peito"])}><ellipse cx="41" cy="43" rx="10.5" ry="9" /><ellipse cx="59" cy="43" rx="10.5" ry="9" /></g>
          <g className={on(["ombros"])}><circle cx="27" cy="36" r="7" /><circle cx="73" cy="36" r="7" /></g>
          <g className={on(["biceps"])}><rect x="18" y="42" width="9" height="20" rx="4.5" /><rect x="73" y="42" width="9" height="20" rx="4.5" /></g>
          <g className={on(["antebraco"])}><rect x="16" y="64" width="8" height="28" rx="4" /><rect x="76" y="64" width="8" height="28" rx="4" /></g>
          <g className={on(["abdomen"])}><rect x="41" y="54" width="18" height="26" rx="7" /></g>
          <g className={on(["pernas"])}><rect x="33" y="86" width="15" height="68" rx="7" /><rect x="52" y="86" width="15" height="68" rx="7" /></g>
          <g className={on(["cardio"])}><path d="M50 78 L33 56 Q27 46 36 42 Q45 40 50 49 Q55 40 64 42 Q73 46 67 56 Z" transform="translate(0 -4)" /></g>
        </>}
        {view === "back" && <>
          <g className={on(["costas"])}><path d="M34 34 L66 34 L62 72 Q50 78 38 72 Z" /></g>
          <g className={on(["ombros"])}><circle cx="27" cy="36" r="7" /><circle cx="73" cy="36" r="7" /></g>
          <g className={on(["triceps"])}><rect x="18" y="42" width="9" height="20" rx="4.5" /><rect x="73" y="42" width="9" height="20" rx="4.5" /></g>
          <g className={on(["gluteos"])}><ellipse cx="41" cy="88" rx="9" ry="8" /><ellipse cx="59" cy="88" rx="9" ry="8" /></g>
          <g className={on(["pernas"])}><rect x="33" y="98" width="15" height="56" rx="7" /><rect x="52" y="98" width="15" height="56" rx="7" /></g>
        </>}
      </g>
    </svg>
  );
}
