import type { Exercise, Workout } from "./types";

/** Exercícios do protocolo inicial: todos vêm do catálogo (ids "ds-…"), com as dicas de execução do protocolo. */
export const exercises: Exercise[] = [
  { id: "ds-1452", name: "Abdominal crunch sentado na máquina", muscle: "abdomen", equipment: "Máquina", cue: "Controle o movimento" },
  { id: "ds-0770", name: "Agachamento no Smith", muscle: "quadriceps", equipment: "Smith", cue: "Amplo e controlado" },
  { id: "ds-2330", name: "Puxada na polia com amplitude total", muscle: "costas", equipment: "Polia", cue: "Peitoral aberto, tronco estável" },
  { id: "ds-0289", name: "Supino reto com halteres", muscle: "peito", equipment: "Halteres", cue: "Ombros pra trás" },
  { id: "ds-0031", name: "Rosca direta com barra", muscle: "biceps", equipment: "Barra", cue: "Cotovelos fixos" },
  { id: "ds-0200", name: "Tríceps corda no pulley", muscle: "triceps", equipment: "Polia", cue: "Extensão completa" },
  { id: "ds-3666", name: "Caminhada na esteira inclinada", muscle: "cardio", equipment: "Esteira", cue: "Mantenha ritmo constante" },
  { id: "ds-2135", name: "Prancha frontal", muscle: "abdomen", equipment: "Peso do corpo", cue: "Tronco reto e estável", timed: true },
  { id: "ds-1463", name: "Leg press 45°", muscle: "quadriceps", equipment: "Máquina", cue: "Joelhos alinhados" },
  { id: "ds-1391", name: "Panturrilha no leg press", muscle: "panturrilha", equipment: "Máquina", cue: "Amplitude completa" },
  { id: "ds-0180", name: "Remada baixa sentada na polia", muscle: "costas", equipment: "Polia", cue: "Cotovelos próximos" },
  { id: "ds-1299", name: "Supino inclinado na máquina", muscle: "peito", equipment: "Máquina", cue: "Foco no peitoral superior" },
  { id: "ds-0334", name: "Elevação lateral com halteres", muscle: "ombros", equipment: "Halteres", cue: "Movimentos lentos e controlados" },
  { id: "ds-0274", name: "Abdominal crunch no chão", muscle: "abdomen", equipment: "Peso do corpo", cue: "Mexa o tronco, e não a cabeça" },
  { id: "ds-1760", name: "Agachamento goblet com halteres", muscle: "quadriceps", equipment: "Halteres", cue: "Pés afastados, pontas pra fora" },
  { id: "ds-2616", name: "Puxada com barra V na polia", muscle: "costas", equipment: "Polia", cue: "Costas retas, alongamento completo" },
  { id: "ds-0596", name: "Crucifixo sentado na máquina", muscle: "peito", equipment: "Máquina", cue: "Movimento em arco, alongue o peitoral" },
  { id: "ds-0603", name: "Desenvolvimento na máquina", muscle: "ombros", equipment: "Máquina", cue: "Ombros alinhados" },
  { id: "ds-0351", name: "Extensão de tríceps deitada com halteres", muscle: "triceps", equipment: "Halteres", cue: "Cotovelos fixos alinhados aos ombros" },
  { id: "ds-0432", name: "Stiff com halteres", muscle: "posterior", equipment: "Halteres", cue: "Joelhos levemente flexionados, leve o quadril para trás com a coluna neutra." },
  { id: "ds-0586", name: "Mesa flexora", muscle: "posterior", equipment: "Máquina", cue: "Quadril colado no banco, suba sem balançar e desça devagar." },
  { id: "ds-0313", name: "Rosca martelo com halteres", muscle: "biceps", equipment: "Halteres", cue: "Pegada neutra, cotovelos fixos, sem balançar." },
  { id: "ds-1409", name: "Ponte de glúteos com barra", muscle: "gluteos", equipment: "Barra", cue: "Queixo no peito, suba o quadril e contraia o glúteo no topo." },
  { id: "ds-0405", name: "Desenvolvimento sentado com halteres", muscle: "ombros", equipment: "Halteres", cue: "Ombros alinhados, suba sem arquear a lombar." },
];

const s = (exerciseId: string, sets: number, repMin: number, repMax: number, restSec: number) =>
  ({ exerciseId, sets, repMin, repMax, restSec });
const cardio = { exerciseId: "ds-3666", sets: 1, repMin: 0, repMax: 0, restSec: 0, durationMin: 15 };
/** Protocolo do Treino Trinca: 3 séries de 12 repetições com 50 s de descanso (exceto onde indicado). */
const t12 = (id: string) => s(id, 3, 12, 12, 50);

export const workouts: Workout[] = [
  { id: "A", name: "Treino A", order: 1, items: [
    t12("ds-1452"), t12("ds-0770"), t12("ds-2330"), t12("ds-0289"), t12("ds-0031"), t12("ds-0200"), cardio] },
  { id: "B", name: "Treino B", order: 2, items: [
    s("ds-2135", 3, 30, 30, 50), t12("ds-1463"), s("ds-1391", 3, 15, 15, 50), t12("ds-0180"),
    t12("ds-1299"), t12("ds-0334"), cardio] },
  { id: "C", name: "Treino C", order: 3, items: [
    t12("ds-0274"), t12("ds-1760"), t12("ds-2616"), t12("ds-0596"), t12("ds-0603"), t12("ds-0351"), cardio] },
];
