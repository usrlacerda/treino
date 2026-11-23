/** Quantas imagens (posições do movimento) cada exercício tem em /public/exercises/<id>/<n>.webp. */
export const MEDIA_FRAMES: Record<string, 1 | 2> = {
  "agach-smith": 2, "supino-halteres": 2, "puxada-aberta": 2, "stiff-halteres": 2, "rosca-barra": 2, "triceps-corda": 2,
  "abd-maquina": 2, "leg-press": 2, "supino-inclinado-maq": 2, "remada-baixa": 2, "mesa-flexora": 2, "elevacao-lateral": 2,
  "rosca-martelo": 2, "panturrilha-leg": 2, "agach-halter": 2, "elev-pelvica": 2, "puxada-fechada": 2, "crucifixo-maq": 2,
  "desenv-halteres": 2, "triceps-testa": 2, "abd-deitado": 2, "prancha": 1, "desenv-maquina": 2, "cardio": 1,
};
/** Caminho relativo à base do app, para funcionar na raiz ou em subpasta (ex.: GitHub Pages). */
export const mediaSrc = (id: string, frame: number) => `${import.meta.env.BASE_URL}exercises/${id}/${frame}.webp`;
