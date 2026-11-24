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
- 2026-11-23: revisão de interface após prints de todas as telas (escuro/claro/tablet): chips de grupo muscular quebram linha (antes cortados), seletor de backup estilizado em PT (antes "Choose File"), parágrafos com respiro nos cartões, campos de edição alinhados pela base e ações de linha (subir/descer à esquerda, remover à direita). axe 0 violações.
- 2026-11-23: animações dos exercícios do catálogo: GIFs do dataset convertidos para WebP animado 180 px (`tools/build-anim.py`, 29,5 MB em `public/catalog/anim`, fora do precache, cache sob demanda). Aparecem no treino ativo (substituem a miniatura; com "reduzir movimento" fica a imagem estática) e, no catálogo, ao tocar na miniatura. Os 24 exercícios do protocolo seguem com as ilustrações RepDB de duas posições.
- 2026-11-23: padronização das demonstrações (feedback do Lucas: vídeos sem padrão). Os 24 exercícios do protocolo passaram a usar a mesma mídia animada do catálogo (Gym visual) em vez das ilustrações RepDB: mapeamento seed→dataset (ex.: prancha→0464/2135 weighted front plank, cardio→3666 esteira inclinada, puxada fechada→2616 v-bar, panturrilha no leg press→1391). Ficam em `public/exercises/<id>/{0,anim}.webp` e entram no precache (0,8 MB), então funcionam offline. Créditos trocados para Gym visual; RepDB removido. Aproximações: prancha (versão com carga) e cardio (caminhada em esteira).
- 2026-11-23: corrigido "Finalizar treino" que perdera a posição fixa no rodapé (regra de camada de toque sobrescrevia `position: fixed`); botão agora largo, com fade de fundo e área segura. Botão de concluir série redesenhado: 56 px, quadrado arredondado, check apagado quando vazio e verde cheio quando feito, rótulo "Série N" fica verde.
- 2026-11-23: revisão de redação UX e padronização de layout (pedido do Lucas, skill redacao-ux). Textos: título "Treinos" igual à aba; aviso de nova versão com a ação ("Atualize para usar as novidades"); "Adicionado" no catálogo e mensagem "Adicionado à Biblioteca: X."; erro de catálogo com ação ("Conecte-se à internet e tente de novo"); exclusão explica a consequência; backup sem "de tempos em tempos" e sem "fez backup"; "Sobre" corrigido (catálogo precisa de internet na 1ª vez); créditos simplificados; contagem com milhar (1.324). Layout: cabeçalho do catálogo igual ao das outras telas (voltar + título "Catálogo"), campos de edição sem quebra em "Descanso (s)", espaçamento entre texto e botões nos cartões, timer mostra só "Descanso" (nome do exercício fica para leitor de tela). axe 0 violações, 149 testes.
- 2026-11-23: estado vazio do Histórico redesenhado (cartão centralizado com ícone, título "Nenhum treino finalizado", texto e botão "Ir para Treinos"); classe `.empty` reutilizável; mensagem de busca sem resultado centralizada com margem.
- 2026-11-23: identidade visual (pedido do Lucas). App renomeado para "CG - Corre Gordo" (manifest name/short_name "CG", título, Sobre, rodapé). Ícone do halter com degradê roxo→magenta→laranja: PNG 192/512, maskable 512 (zona segura 50%), apple-touch 180, favicon 32 e SVG; logo `Logo.tsx` no cabeçalho de Treinos. Paleta: tema claro com acento roxo #4F148A (11,9:1 com branco), tema escuro com acento laranja #FF6F00 e texto escuro (6,6:1); magenta #D81B60 no selo "Próximo"; degradê no botão Finalizar (claro) e na barra de descanso. Verde segue só para "feito". Chave interna do backup continua "treino" (compatibilidade). axe 0 violações, 149 testes.
- 2026-11-23: marca em todas as telas (pedido do Lucas). Telas da barra inferior trocam o título visível ("Treinos", "Biblioteca", "Histórico", "Ajustes") pelo cabeçalho com ícone + "Corre Gordo" (o título segue como h1 só para leitor de tela); telas internas (treino ativo, editar, importar, catálogo) ganham a mesma marca em versão compacta acima do voltar/título. Componentes `BrandBar`/`BrandHeader`.
- 2026-11-23: deploy do Pages falhou por teste instável (audit: "Voltar com séries marcadas…" clicava em Voltar antes de a série salvar). Corrigido: `logFirst` espera aria-pressed=true. Causa raiz: corrida entre o clique de concluir (grava no banco) e o clique em Voltar.

- 2026-11-23: "Importar treinos de um arquivo" movido da Home para Ajustes (cartão "Treinos"); após importar, volta para a aba Treinos. 149 testes ok.
- 2026-11-23: tela Treinos redesenhada (cartão do próximo treino destacado, prévia dos exercícios, botão play, editar só com ícone).
- 2026-11-23: play removido; lápis de editar pequeno no canto do cartão.
- 2026-11-23: miniaturas da Biblioteca e do Catálogo ampliam a demonstração em janela (MediaLightbox).
- 2026-11-23: nomes do catálogo traduzidos para PT-BR (padrão de academia), ordenados A–Z, nome em inglês guardado para busca (tools/names-pt.json).
- 2026-11-23: Biblioteca e Catálogo unificados (cards por grupo com figura, lista com filtro de equipamento, busca PT/EN); criar exercício removido; "Adicionar exercício" no editor de treino abre a Biblioteca.

## 2026-11-23 — Só exercícios do catálogo + fonte Samsung Sans
- Os 24 exercícios do protocolo agora são do catálogo (ids ds-…); treinos A/B/C usam eles. Prancha é por tempo.
- Banco v3: troca ids antigos em treinos e histórico; backups e planos antigos também são convertidos (src/db/legacy.ts).
- Removidos public/exercises, MEDIA_FRAMES e o código de mídia antigo; mídia dos 24 fica offline via precache.
- Agachamentos/leg press → quadríceps; stiff → posterior. Prancha renomeada "Prancha frontal".
- Fonte Samsung Sans (Regular/Medium/Bold, woff2) em todo o app. 154 testes ok, build ok.
- Fonte: não vai no site. Ajustes > Fonte: a pessoa escolhe os arquivos (.ttf/.otf/.woff2), guardados só no aparelho (IndexedDB).
- Treino em andamento: cartão novo (número, chips, miniatura que amplia, séries em grade, progresso). Botão "Novo treino" na tela de Treinos.
- Removido importar fonte. Fonte: Gotham se instalada, senão Montserrat (embutida, só latino). Catálogo index.json agora NetworkFirst (nomes em inglês vinham do cache antigo).
- Nomes no vocabulário de academia (tools/gym-names.py: Terra, Abdominal supra, Tríceps testa/francês, Elevação pélvica, Puxada frontal…); busca inteligente (src/lib/search.ts: sinônimos PT/EN/gíria, erro de digitação); nomes salvos sincronizam com o catálogo (DB v4 + syncNames).
- Detalhes dos exercícios: passo a passo em português (1.324, traduzido em lotes) + músculos que ajudam, em catalog/info/<n>.json (tools/build-details.py); aparecem ao ampliar a demonstração.
- Botão de atualizar do aviso: só o ícone (não estoura mais o aviso).
- Biblioteca: tocar no exercício abre detalhes com "Adicionar a um treino" (escolhe treino existente ou cria treino novo já com o exercício; volta para Treinos com aviso).
- App renomeado para "CG Fit" (título, manifest, cabeçalho, ajustes). Ícone: monograma "CG" branco sobre degradê roxo → magenta → laranja (icon.svg, PNGs 32/180/192/512 e maskable com margem de segurança).
- Janela do exercício: imagem, texto e botões aparecem juntos (mostra "Carregando…" até o passo a passo chegar).
- Bonecos da Biblioteca redesenhados: silhueta anatômica contínua, músculos com formato próprio (peito, deltoide, bíceps, abdômen em blocos, quadríceps/panturrilha, glúteos, costas, coração no cardio).
- Bonecos agora usam o desenho anatômico de react-native-body-parts-anatomy (MIT; tools/build-body.mjs gera src/lib/bodyData.ts; créditos em THIRD_PARTY_NOTICES.md). Cardio acende o corpo todo.
- Imagens dos exercícios refeitas: o catálogo original só tem 180 px; antes eu comprimia forte (q40/q55) e reduzia. Agora ampliadas com Lanczos + nitidez (animação 360 px q70 ≈ 97 MB; miniatura 300 px q80 ≈ 11 MB), baixadas só ao abrir o exercício. Índice (nomes) preservado.
- Rolagem desnecessária na tela de Treinos: espaço inferior padrão agora é só o da barra de abas (88 px); 170 px apenas em telas com botão fixo/descanso (:has).
- Janela do exercício: X no canto superior direito (fixo ao rolar) no lugar do botão Fechar; "Adicionar a um treino" flutua no rodapé do card.
- Logo nas telas do app agora é o mesmo ícone do app instalado (monograma CG sobre degradê).
- Nova tela Início (primeira aba): treino de hoje com "Começar", semana (dias, treinos, volume vs. semana passada, semanas seguidas) e último treino. Botão voltar do Android: Início é a raiz (de lá fecha o app); outras abas voltam ao Início; telas (treino, edição, importação) e janelas (exercício, confirmações, grupo da Biblioteca) fecham uma por vez; sair do treino pelo voltar mantém as séries (Continuar treino). src/lib/backstack.ts + useBackClose, week.ts.
- Confirmações: "Sair do CG Fit?" (voltar no Início, via entrada-guarda no histórico), "Descartar alterações?" (editar treino com mudanças, no Cancelar e no voltar) e "Encerrar este treino?" (Encerrar e salvar). Componente ConfirmDialog (voltar = cancelar). Sair: o navegador não deixa o app se fechar sozinho; tenta voltar/fechar e, se continuar aberto, avisa para tocar em voltar de novo.
- Removidos os botões Voltar/Cancelar das telas (Editar treino, Treino ativo, Importar, Biblioteca): só o voltar do Android. Treino ativo com séries marcadas e editor com mudanças perguntam ao voltar (guarda via useBackClose). backstack: pedido de "ignorar próximo popstate" expira em 500 ms.
- Histórico: botão de lixeira em cada treino feito abre "Excluir este treino?" (Excluir treino / Cancelar); depois de excluir aparece "Treino excluído." com "Desfazer" por 8 s, que devolve o treino com as mesmas séries. Teste: src/history.delete.test.tsx.
- Treino ativo: "Finalizar treino" e "Descartar treino" só aparecem depois da primeira série concluída; "Adicionar série" em cada exercício (menos cardio), também em treino retomado com séries extras; "Descartar treino" pergunta (Descartar treino / Continuar treino) e apaga a sessão. Testes em src/App.test.tsx.
- Novos recursos: tela sempre acesa durante o treino (Wake Lock); aviso "Novo recorde!" ao bater a maior carga de um exercício; anotação do treino (aparece no Histórico); meta de treinos por semana (Início mostra o progresso, Ajustes muda); calculadora de anilhas no treino; compartilhar resumo do treino (Histórico); medidas corporais com diferença para o registro anterior (Histórico). Banco v5 (tabela measures); backup leva medidas e anotações. Testes: plates.test.ts, recursos.ui.test.tsx.
- Revisão com as Web Interface Guidelines (Vercel): touch-action: manipulation, overscroll-behavior nas janelas, números tabulares, títulos balanceados, textos longos quebram sem estourar, imagens com largura e altura, campos com autocomplete desligado e sem corretor nos numéricos, reticências nos exemplos, marca com translate=no.
- Removido o recurso de medidas corporais (tela, tabela e backup). Banco v6 apaga a tabela measures; backups antigos com medidas ainda abrem (o campo é ignorado).
- Novo ícone: halter com o monograma CG no lugar da barra (icon.svg, PNGs 32/180/192/512, maskable com margem de segurança e logo das telas).
