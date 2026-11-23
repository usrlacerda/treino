# LOG

## 2026-11-22 — Ciclo 1 (T1)
- Criados SPEC, PLANO, CONTEXTO, DECISOES.
- Esqueleto Vite + React + TS + PWA. `npm test`: 1 teste passou. `npm run build`: ok, service worker e manifest gerados, ícones PNG no manifest.
- Pendente: revisão independente e teste em aparelho real (instalar no Android) depois de publicar em ambiente de teste.

## 2026-11-22 — Ciclo 2 (T2)
- Dexie: tabelas exercises, workouts, sessions; seed idempotente de A/B/C (21 exercícios); repo com startSession, logSet (atualiza a mesma série), finishSession, lastSetsFor, nextWorkoutId.
- `npm run typecheck` ok; `npm test`: 8 testes passaram (2 arquivos).
- Pendente: revisão independente das T1 e T2; teste em aparelho real.

## 2026-11-22 — Ciclo 3 (T3)
- Telas Home (A/B/C com "Sugerido") e Treino ativo (série com carga e repetições, concluir/desmarcar, "última vez", finalizar).
- `typecheck` ok; 10 testes passaram; build ok.
- Limitação conhecida: abrir um treino cria a sessão; sair sem finalizar deixa sessão aberta (ignorada na "última vez" e no rodízio). Tratar na T5 (histórico).
- Timer de descanso fica para a T4.

## 2026-11-22 — Ciclo 4 (T4)
- Timer de descanso: contagem pelo relógio (correta com tela apagada), +15s/−15s/Pular, vibração e bipe no fim; inicia ao concluir série de força (não no cardio), com o descanso de cada exercício.
- Bug achado pelos testes: aviso de fim podia disparar várias vezes. Corrigido com trava por contagem.
- `typecheck` ok; 17 testes passaram; build ok.
- Pendente: som e vibração só podem ser confirmados em aparelho real (navegadores pedem interação do usuário para áudio; o toque na série já conta).

## 2026-11-22 — Ciclo 5 (T5)
- Histórico: abas Treinos/Histórico; progresso por exercício (gráfico SVG da carga mais pesada por treino), recordes (maior carga e 1RM estimado por Epley), lista de treinos feitos com volume.
- Sessão passa a ser criada só na 1ª série concluída; ao abrir o app, sessões vazias são apagadas e as abandonadas com séries são concluídas (nada se perde).
- `typecheck` ok; 26 testes passaram; build ok.
- Pendente: revisão independente T1–T5; teste no aparelho; app não restaura o treino em andamento se o Android encerrar o app (dados já registrados são preservados).

## 2026-11-22 — Demonstração dos exercícios
- 22 exercícios com 2 imagens (400px, ~820 KB no total), embutidas e pré-carregadas para uso offline. `typecheck` ok; 28 testes passaram; build ok (55 arquivos pré-carregados, ~1,1 MB).
- Reduced-motion: mostra só a posição inicial.
- Pendente: aprovar o estilo (fotos, não ilustrações); correções visuais apontadas nos prints (plural "1 séries", timer cobrindo campos).

## 2026-11-22 — Ilustrações
- 22 exercícios com ilustração (start/peak em loop; cardio com 1 imagem), webp 400px, ~360 KB; pré-carregadas offline. 28 testes passaram; build ok (54 arquivos, ~700 KB).
- Aproximações: supino inclinado na máquina (usa supino na máquina reto) e panturrilha no leg press (usa panturrilha na máquina).

## 2026-11-22 — Correções da auditoria (itens 1–12)
- Validação visível ao concluir série; saída do treino com confirmação e resumo ("Treino salvo: …"); erro ao abrir o banco com "Tentar de novo"; atualização do app só por aviso (registerType "prompt"); pedido de armazenamento persistente e aviso de dados locais no Histórico.
- Plural, vírgula decimal em todo o app, nomes acessíveis dos campos com o texto visível, anúncio do fim do descanso para leitor de tela, "Próximo" no lugar de "Sugerido", "Carga máxima estimada" no lugar de 1RM.
- 39 testes passaram (11 novos); build ok; axe: 0 violações em 4 estados novos.
- Pendente: itens 13–20 da auditoria; teste no aparelho (TalkBack, som/vibração); revisão independente; backup (T8); T6.
- 2026-11-22: Importar treinos (lógica, tela, 24+4 testes), axe 0 violações, hospedagem em subpasta verificada (22/22 imagens, sem 4xx), README, CI, zip de dist (não publicado). Autorrevisão apenas (sem agente independente, não autorizado). Teste de App flutuou 1x sob carga; 3 execuções seguintes 128/128.
- 2026-11-22: backlog 13–20 e M3 (tema, contraste, ícones, rail, timer) feitos; 131 testes; axe 0 em escuro/claro/tablet.
- 2026-11-22: revisão independente (agente separado, sem editar o projeto). Corrigidos: limite carga/reps na tela alinhado ao backup (crítico), ids de séries do backup validados, exercício repetido no treino, cardio com sets=1, falha de gravação tratada, áudio liberado no toque, lastSetsForMany (1 leitura), contraste de estados apagados, rótulo do checkbox, plural, theme_color, apple-touch-icon, diálogo de restauração mostra dados atuais. 137 testes; axe 0.
  Pendentes (decisão/escopo): retomar treino em andamento após o Android descartar o app; foco preso/Esc nos diálogos; verificação periódica de atualização do SW; seed novo para quem já tem dados; Epley >25 reps; pausa na animação das ilustrações; ErrorBoundary.
- 2026-11-22: retomada de treino em andamento (janela de 6 h): closeStaleSessions mantém aberta, findResumable, banner Continuar/Encerrar e salvar; 140 testes.

- 2026-11-23: ícones e botões no padrão Material 3 — componente `Icon` (SVG embutido, decorativo), variantes preenchido/tonal/contornado/texto/ícone/destrutivo, camadas de estado (hover/foco/pressionado), desativado M3, botão principal estendido com ícone, chips com check, timer ajustado. axe 0 violações (escuro/claro/tablet), alvos ≥44 px, 143 testes.
- 2026-11-23: catálogo completo (pedido do Lucas): 1.324 exercícios de hasaneyldrm/exercises-dataset (mídia © Gym visual, crédito em Ajustes e na tela do catálogo). `tools/build-catalog.py` gera `public/catalog/index.json` (93 KB) e miniaturas webp 160 px (2,2 MB), fora do precache (baixam sob demanda e ficam em cache para uso offline). Tela "Explorar catálogo" na Biblioteca (busca sem acento, filtro por grupo, adicionar). Exercícios `ds-<n>` entram em backup/exportação e podem ser removidos; novo grupo "Antebraço". Limitações: nomes em inglês (dataset sem português), só miniatura estática (sem GIF), licença da mídia a cargo dos termos da Gym visual.
