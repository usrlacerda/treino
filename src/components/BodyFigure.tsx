import type { GroupId } from "../lib/library";

/** Desenha o contorno e o espelho dele, para só precisar descrever o lado esquerdo do corpo. */
function Pair({ d }: { d: string }) {
  return <><path d={d} /><path d={d} transform="translate(100 0) scale(-1 1)" /></>;
}

const DELTOID = "M34 31 C28 30 23 34 22 41 C22 45 26 47 29 45 C32 42 34 38 37 33 Z";
const UPPER_ARM = "M22 45 C21 51 22 57 24 62 C26 63 28 62 29 59 C30 54 30 49 29 45 C27 43 24 43 22 45 Z";
const FOREARM = "M21 67 C20 75 19 82 18.5 90 C20 92 22 91 23 89 C25 82 26 75 27 67 Z";
const THIGH_FRONT = "M33 98 C31 108 31 118 33 127 L47 127 C49 118 50 107 49 98 Z";
const THIGH_BACK = "M34 105 C32 114 33 122 34 127 L47 127 C49 120 49 112 48 105 Z";
const CALF = "M34 130 C33 140 34 150 36 159 L44 159 C46 150 47 140 46 130 Z";

/** Boneco simplificado (desenho próprio) com o grupo muscular destacado. */
export function BodyFigure({ group, view }: { group: GroupId; view: "front" | "back" }) {
  const on = (g: GroupId[]) => (g.includes(group) ? "hl on" : "hl");
  return (
    <svg className="figure" viewBox="0 0 100 170" aria-hidden="true" focusable="false">
      <g className="body">
        <ellipse cx="50" cy="13" rx="9" ry="11" />
        <path d="M45 22 L45 30 L55 30 L55 22 Z" />
        <path d="M33 31 C40 28 44 28 50 28 C56 28 60 28 67 31 C70 33 70 38 69 46 C68 58 66 68 64 78 C63 84 66 90 68 98 L32 98 C34 90 37 84 36 78 C34 68 32 58 31 46 C30 38 30 33 33 31 Z" />
        <Pair d="M30 33 C24 33 20 40 20 50 L21 64 C21 66 28 66 28 64 L31 48 Z" />
        <Pair d="M21 62 L21 66 C19 74 18 82 17 92 C17 95 22 96 23 93 C25 85 27 77 28 66 Z" />
        <Pair d="M17 91 C15 98 17 102 20 102 C23 102 24 98 23 94 Z" />
        <Pair d="M33 92 L33 96 C31 108 31 118 33 128 L47 128 C49 118 50 106 49 96 Z" />
        <Pair d="M34 124 L34 130 C33 140 34 150 36 160 L44 160 C46 150 47 140 46 130 L46 124 Z" />
        <Pair d="M35 158 C33 164 34 167 39 167 C44 167 45 163 44 160 Z" />
      </g>
      <g>
        {view === "front" && <>
          <g className={on(["peito"])}><Pair d="M49 34 C44 33 38 34 34 38 C33 44 36 51 42 52 C46 52 49 50 49 46 Z" /></g>
          <g className={on(["ombros"])}><Pair d={DELTOID} /></g>
          <g className={on(["biceps"])}><Pair d={UPPER_ARM} /></g>
          <g className={on(["antebraco"])}><Pair d={FOREARM} /></g>
          <g className={on(["abdomen"])}>
            {[55, 64, 73].map((y) => <Pair key={y} d={`M49 ${y} L44.5 ${y} Q42.5 ${y} 42.5 ${y + 2} L42.5 ${y + 5} Q42.5 ${y + 7} 44.5 ${y + 7} L49 ${y + 7} Z`} />)}
          </g>
          <g className={on(["pernas"])}><Pair d={THIGH_FRONT} /><Pair d={CALF} /></g>
          <g className={on(["cardio"])}><path d="M50 68 C39 60 37 51 42 47 C46 44 49 47 50 50 C51 47 54 44 58 47 C63 51 61 60 50 68 Z" /></g>
        </>}
        {view === "back" && <>
          <g className={on(["costas"])}><Pair d="M49 31 C43 32 37 34 34 38 C34 50 37 64 44 74 C47 76 49 76 50 76 Z" /></g>
          <g className={on(["ombros"])}><Pair d={DELTOID} /></g>
          <g className={on(["triceps"])}><Pair d={UPPER_ARM} /></g>
          <g className={on(["gluteos"])}><Pair d="M49 86 C42 84 35 87 34 94 C34 100 40 102 46 101 C49 100 50 97 49 93 Z" /></g>
          <g className={on(["pernas"])}><Pair d={THIGH_BACK} /><Pair d={CALF} /></g>
        </>}
      </g>
    </svg>
  );
}
