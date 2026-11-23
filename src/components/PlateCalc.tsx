import { useState } from "react";
import { useBackClose } from "../lib/useBackClose";
import { Icon } from "./Icon";
import { fmtNum } from "../lib/format";
import { platesFor } from "../lib/plates";

/** Calculadora de anilhas: quais discos pôr de cada lado da barra para chegar à carga. */
export function PlateCalc({ initialKg, onClose }: { initialKg?: number; onClose: () => void }) {
  useBackClose(true, onClose);
  const [total, setTotal] = useState(initialKg ? fmtNum(initialKg) : "");
  const [bar, setBar] = useState("20");
  const t = Number(total.replace(",", "."));
  const barKg = Number(bar.replace(",", "."));
  const valid = total.trim() !== "" && Number.isFinite(t) && Number.isFinite(barKg) && barKg >= 0 && t >= barKg && t <= 1000;
  const r = valid ? platesFor(t, barKg) : undefined;
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog platecalc" role="dialog" aria-modal="true" aria-labelledby="pc-t">
        <h2 id="pc-t">Calculadora de anilhas</h2>
        <label className="field">Carga total (kg)
          <input autoComplete="off" spellCheck={false} inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Ex.: 60…" autoFocus />
        </label>
        <label className="field">Peso da barra (kg)
          <input autoComplete="off" spellCheck={false} inputMode="decimal" value={bar} onChange={(e) => setBar(e.target.value)} />
        </label>
        <div role="status" className="plate-out">
          {total.trim() === "" && <p className="muted">Digite a carga total para ver as anilhas de cada lado.</p>}
          {total.trim() !== "" && !valid && <p className="error">A carga precisa ser igual ou maior que o peso da barra (até 1.000 kg).</p>}
          {r && (r.perSide.length === 0
            ? <p>Só a barra: {fmtNum(barKg)} kg.</p>
            : <>
                <p>De cada lado: <strong>{r.perSide.map(fmtNum).join(" + ")} kg</strong></p>
                <p className="muted">Total: {fmtNum(r.achieved)} kg{r.missing > 0 ? `. Faltam ${fmtNum(r.missing)} kg que as anilhas comuns (de 1,25 a 25 kg) não alcançam.` : "."}</p>
              </>)}
        </div>
        <button className="btn ghost" onClick={onClose}><Icon name="close" size={20} />Fechar</button>
      </div>
    </div>
  );
}
