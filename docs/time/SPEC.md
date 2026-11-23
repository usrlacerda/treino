# SPEC — Treino (PWA de registro de treino)

Status: aprovada pelo usuário (Lucas) em 2026-11-22.

## Objetivo
App instalável (PWA), offline e local-first, para registrar treinos de musculação no padrão dos apps consolidados (Strong, Hevy, Fitbod). Uso próprio, da família e de amigos, no celular Android.

## Critérios de aceite ("pronto quando")
1. Instala na tela inicial e abre offline.
2. Lista os treinos A/B/C e sugere o próximo.
3. Treino ativo: por exercício, séries, faixa de repetições, carga e repetições da última vez; marcar série como feita.
4. Timer de descanso automático ao concluir a série (vibração e som).
5. Progressão dupla: avisa para subir a carga ao bater o topo da faixa em todas as séries.
6. Histórico por treino e por exercício, gráfico de carga e recordes pessoais.
7. Biblioteca de exercícios e edição do plano (trocar, adicionar, reordenar).
8. Exportar e importar dados (JSON).

## Fora de escopo (agora)
Contas/login, sincronização em nuvem, social, nutrição, IA.

## Restrições
- Sem servidor; dados em IndexedDB no aparelho.
- Sem dados pessoais de terceiros; nenhum segredo no código.
- Textos e instruções de exercícios escritos por nós (sem copiar de outro app).
- Interface: Material Design 3, tema escuro, alvos de toque grandes, pt-BR.
- Publicação em produção só com aprovação humana explícita.

## Plano inicial dos treinos (editável)
Treino A: Agachamento no Smith 3x8-10; Supino reto com halteres 3x8-10; Puxada frontal aberta 3x10-12; Stiff com halteres 3x10-12; Rosca direta com barra 3x10-12; Tríceps corda 3x12; Abdominal na máquina 3x12-15; Cardio 15 min.
Treino B: Leg press 3x10-12; Supino inclinado na máquina 3x10-12; Remada baixa com triângulo 3x10-12; Mesa flexora 3x12; Elevação lateral 3x12-15; Rosca martelo 3x12; Panturrilha no leg press 3x15; Cardio 15 min.
Treino C: Agachamento com halter 3x10-12; Elevação pélvica 3x10-12; Puxada frontal pegada fechada 3x10-12; Crucifixo na máquina 3x12-15; Desenvolvimento com halteres 3x10-12; Tríceps testa com halter 3x12; Abdominal deitado 3x12-15; Cardio 15 min.
Descanso: 90s nos compostos pesados, 60-75s nos demais, 45s na panturrilha.
