import type { Exercise, Workout } from "./types";

export const exercises: Exercise[] = [
  { id: "agach-smith", name: "Agachamento no Smith", muscle: "quadriceps", equipment: "Smith", cue: "Amplo e controlado" },
  { id: "supino-halteres", name: "Supino reto com halteres", muscle: "peito", equipment: "Halteres", cue: "Ombros pra trás" },
  { id: "puxada-aberta", name: "Puxada frontal aberta", muscle: "costas", equipment: "Polia", cue: "Peitoral aberto, tronco estável" },
  { id: "stiff-halteres", name: "Stiff com halteres", muscle: "posterior", equipment: "Halteres", cue: "Joelhos levemente flexionados, leve o quadril para trás com a coluna neutra." },
  { id: "rosca-barra", name: "Rosca direta com barra", muscle: "biceps", equipment: "Barra", cue: "Cotovelos fixos" },
  { id: "triceps-corda", name: "Tríceps corda no pulley", muscle: "triceps", equipment: "Polia", cue: "Extensão completa" },
  { id: "abd-maquina", name: "Abdominal crunch na máquina", muscle: "abdomen", equipment: "Máquina", cue: "Controle o movimento" },
  { id: "leg-press", name: "Leg press", muscle: "quadriceps", equipment: "Máquina", cue: "Joelhos alinhados" },
  { id: "supino-inclinado-maq", name: "Supino inclinado na máquina", muscle: "peito", equipment: "Máquina", cue: "Foco no peitoral superior" },
  { id: "remada-baixa", name: "Remada baixa com triângulo", muscle: "costas", equipment: "Polia", cue: "Cotovelos próximos" },
  { id: "mesa-flexora", name: "Mesa flexora", muscle: "posterior", equipment: "Máquina", cue: "Quadril colado no banco, suba sem balançar e desça devagar." },
  { id: "elevacao-lateral", name: "Elevação lateral com halteres", muscle: "ombros", equipment: "Halteres", cue: "Movimentos lentos e controlados" },
  { id: "rosca-martelo", name: "Rosca martelo", muscle: "biceps", equipment: "Halteres", cue: "Pegada neutra, cotovelos fixos, sem balançar." },
  { id: "panturrilha-leg", name: "Panturrilha no leg press", muscle: "panturrilha", equipment: "Máquina", cue: "Amplitude completa" },
  { id: "agach-halter", name: "Agachamento com halter", muscle: "quadriceps", equipment: "Halter", cue: "Pés afastados, pontas pra fora" },
  { id: "elev-pelvica", name: "Elevação pélvica", muscle: "gluteos", equipment: "Barra ou máquina", cue: "Queixo no peito, suba o quadril e contraia o glúteo no topo." },
  { id: "puxada-fechada", name: "Puxada frontal pegada fechada", muscle: "costas", equipment: "Polia", cue: "Costas retas, alongamento completo" },
  { id: "crucifixo-maq", name: "Crucifixo na máquina", muscle: "peito", equipment: "Máquina", cue: "Movimento em arco, alongue o peitoral" },
  { id: "desenv-halteres", name: "Desenvolvimento com halteres", muscle: "ombros", equipment: "Halteres", cue: "Ombros alinhados, suba sem arquear a lombar." },
  { id: "triceps-testa", name: "Tríceps testa com halter", muscle: "triceps", equipment: "Halteres", cue: "Cotovelos fixos alinhados aos ombros" },
  { id: "abd-deitado", name: "Abdominal deitado", muscle: "abdomen", equipment: "Peso do corpo", cue: "Mexa o tronco, e não a cabeça" },
  { id: "prancha", name: "Prancha abdominal", muscle: "abdomen", equipment: "Peso do corpo", cue: "Tronco reto e estável", timed: true },
  { id: "desenv-maquina", name: "Desenvolvimento na máquina", muscle: "ombros", equipment: "Máquina", cue: "Ombros alinhados" },
  { id: "cardio", name: "Cardio (esteira, bike ou elíptico)", muscle: "cardio", equipment: "Esteira, bike ou elíptico", cue: "Mantenha ritmo constante" },
];

const s = (exerciseId: string, sets: number, repMin: number, repMax: number, restSec: number) =>
  ({ exerciseId, sets, repMin, repMax, restSec });
const cardio = { exerciseId: "cardio", sets: 1, repMin: 0, repMax: 0, restSec: 0, durationMin: 15 };
/** Protocolo do Treino Trinca: 3 séries de 12 repetições com 50 s de descanso (exceto onde indicado). */
const t12 = (id: string) => s(id, 3, 12, 12, 50);

export const workouts: Workout[] = [
  { id: "A", name: "Treino A", order: 1, items: [
    t12("abd-maquina"), t12("agach-smith"), t12("puxada-aberta"), t12("supino-halteres"), t12("rosca-barra"), t12("triceps-corda"), cardio] },
  { id: "B", name: "Treino B", order: 2, items: [
    s("prancha", 3, 30, 30, 50), t12("leg-press"), s("panturrilha-leg", 3, 15, 15, 50), t12("remada-baixa"),
    t12("supino-inclinado-maq"), t12("elevacao-lateral"), cardio] },
  { id: "C", name: "Treino C", order: 3, items: [
    t12("abd-deitado"), t12("agach-halter"), t12("puxada-fechada"), t12("crucifixo-maq"), t12("desenv-maquina"), t12("triceps-testa"), cardio] },
];

/** Treinos A/B/C da primeira versão do app (antes de igualar ao protocolo); usados só na migração. */
export const LEGACY_WORKOUTS_V1: Workout[] = [
  { id: "A", name: "Treino A", order: 1, items: [
    s("agach-smith", 3, 8, 10, 90), s("supino-halteres", 3, 8, 10, 90),
    s("puxada-aberta", 3, 10, 12, 75), s("stiff-halteres", 3, 10, 12, 90),
    s("rosca-barra", 3, 10, 12, 60), s("triceps-corda", 3, 12, 12, 60),
    s("abd-maquina", 3, 12, 15, 45), cardio] },
  { id: "B", name: "Treino B", order: 2, items: [
    s("leg-press", 3, 10, 12, 90), s("supino-inclinado-maq", 3, 10, 12, 75),
    s("remada-baixa", 3, 10, 12, 75), s("mesa-flexora", 3, 12, 12, 60),
    s("elevacao-lateral", 3, 12, 15, 60), s("rosca-martelo", 3, 12, 12, 60),
    s("panturrilha-leg", 3, 15, 15, 45), cardio] },
  { id: "C", name: "Treino C", order: 3, items: [
    s("agach-halter", 3, 10, 12, 90), s("elev-pelvica", 3, 10, 12, 90),
    s("puxada-fechada", 3, 10, 12, 75), s("crucifixo-maq", 3, 12, 15, 60),
    s("desenv-halteres", 3, 10, 12, 75), s("triceps-testa", 3, 12, 12, 60),
    s("abd-deitado", 3, 12, 15, 45), cardio] },
];
