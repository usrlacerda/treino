import type { Exercise, Workout } from "./types";

export const exercises: Exercise[] = [
  { id: "agach-smith", name: "Agachamento no Smith", muscle: "quadriceps", equipment: "Smith", cue: "Pés um pouco à frente da barra, desça controlando até a coxa ficar paralela." },
  { id: "supino-halteres", name: "Supino reto com halteres", muscle: "peito", equipment: "Halteres", cue: "Escápulas travadas no banco, desça até a linha do peito." },
  { id: "puxada-aberta", name: "Puxada frontal aberta", muscle: "costas", equipment: "Polia", cue: "Peito aberto, puxe a barra até o alto do peito com o tronco estável." },
  { id: "stiff-halteres", name: "Stiff com halteres", muscle: "posterior", equipment: "Halteres", cue: "Joelhos levemente flexionados, leve o quadril para trás com a coluna neutra." },
  { id: "rosca-barra", name: "Rosca direta com barra", muscle: "biceps", equipment: "Barra", cue: "Cotovelos fixos ao lado do corpo, sem balançar o tronco." },
  { id: "triceps-corda", name: "Tríceps corda no pulley", muscle: "triceps", equipment: "Polia", cue: "Cotovelos colados, estenda por completo e abra a corda no final." },
  { id: "abd-maquina", name: "Abdominal na máquina", muscle: "abdomen", equipment: "Máquina", cue: "Flexione o tronco, não puxe com os braços; movimento controlado." },
  { id: "leg-press", name: "Leg press", muscle: "quadriceps", equipment: "Máquina", cue: "Joelhos alinhados com os pés, sem travar o joelho na subida." },
  { id: "supino-inclinado-maq", name: "Supino inclinado na máquina", muscle: "peito", equipment: "Máquina", cue: "Foco no peitoral superior, ombros para trás e para baixo." },
  { id: "remada-baixa", name: "Remada baixa com triângulo", muscle: "costas", equipment: "Polia", cue: "Cotovelos próximos ao corpo, aproxime as escápulas no final." },
  { id: "mesa-flexora", name: "Mesa flexora", muscle: "posterior", equipment: "Máquina", cue: "Quadril colado no banco, suba sem balançar e desça devagar." },
  { id: "elevacao-lateral", name: "Elevação lateral com halteres", muscle: "ombros", equipment: "Halteres", cue: "Movimento lento até a altura dos ombros, sem impulso." },
  { id: "rosca-martelo", name: "Rosca martelo", muscle: "biceps", equipment: "Halteres", cue: "Pegada neutra, cotovelos fixos, sem balançar." },
  { id: "panturrilha-leg", name: "Panturrilha no leg press", muscle: "panturrilha", equipment: "Máquina", cue: "Amplitude completa: alongue embaixo e suba na ponta dos pés." },
  { id: "agach-halter", name: "Agachamento com halter", muscle: "quadriceps", equipment: "Halter", cue: "Pés afastados, pontas levemente para fora, coluna reta." },
  { id: "elev-pelvica", name: "Elevação pélvica", muscle: "gluteos", equipment: "Barra ou máquina", cue: "Queixo no peito, suba o quadril e contraia o glúteo no topo." },
  { id: "puxada-fechada", name: "Puxada frontal pegada fechada", muscle: "costas", equipment: "Polia", cue: "Costas retas, alongamento completo e puxada até o peito." },
  { id: "crucifixo-maq", name: "Crucifixo na máquina", muscle: "peito", equipment: "Máquina", cue: "Movimento em arco, alongue o peitoral sem forçar o ombro." },
  { id: "desenv-halteres", name: "Desenvolvimento com halteres", muscle: "ombros", equipment: "Halteres", cue: "Ombros alinhados, suba sem arquear a lombar." },
  { id: "triceps-testa", name: "Tríceps testa com halter", muscle: "triceps", equipment: "Halteres", cue: "Cotovelos fixos e alinhados com os ombros." },
  { id: "abd-deitado", name: "Abdominal deitado", muscle: "abdomen", equipment: "Peso do corpo", cue: "Mexa o tronco, não a cabeça." },
  { id: "cardio", name: "Cardio (esteira, bike ou elíptico)", muscle: "cardio", equipment: "Esteira, bike ou elíptico", cue: "Mantenha ritmo constante, no seu melhor ritmo." },
];

const s = (exerciseId: string, sets: number, repMin: number, repMax: number, restSec: number) =>
  ({ exerciseId, sets, repMin, repMax, restSec });
const cardio = { exerciseId: "cardio", sets: 1, repMin: 0, repMax: 0, restSec: 0, durationMin: 15 };

export const workouts: Workout[] = [
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
