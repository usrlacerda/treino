/** "1 série", "2 séries". */
export const plural = (n: number, one: string, many: string) => `${fmtNum(n)} ${n === 1 ? one : many}`;
/** Número no formato do Brasil (vírgula decimal, até 2 casas). */
export const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
