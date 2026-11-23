// Gera src/lib/bodyData.ts a partir do pacote react-native-body-parts-anatomy (MIT; caminhos derivados de react-native-body-highlighter, MIT).
// Uso: node tools/build-body.mjs <bodyRegions.generated.ts>
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2], "utf8");
const start = src.indexOf("} = {", src.indexOf("export const BODY_REGIONS")) + 4;
const end = src.indexOf("\n};", start) + 2;
const BODY_REGIONS = new Function("return " + src.slice(start, end))();
const R = BODY_REGIONS.male;
// Sem arredondar: os caminhos têm arcos com flags e números colados, que o arredondamento por regex corromperia.
const round = (d) => d;
const out = {};
for (const v of ["front", "back"]) {
  const set = R[v]; const groups = {};
  for (const f of set.fragments) (groups[f.parentSlug] ||= []).push(round(f.pathData));
  out[v] = { viewBox: set.viewBox, outline: round(set.outlineD), groups: Object.fromEntries(Object.entries(groups).map(([k, a]) => [k, a.join(" ")])) };
}
const body = `// GERADO por tools/build-body.mjs — não editar à mão.
// Caminhos do corpo masculino de react-native-body-parts-anatomy (MIT), derivados de react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham). Ver THIRD_PARTY_NOTICES.md.
export interface BodyView { viewBox: string; outline: string; groups: Record<string, string> }
export const BODY: { front: BodyView; back: BodyView } = ${JSON.stringify(out)};
`;
fs.writeFileSync("src/lib/bodyData.ts", body);
console.log(body.length, Object.keys(out.front.groups), Object.keys(out.back.groups), out.front.viewBox, out.back.viewBox);
