# DECISÕES

- 2026-11-22: local-first, sem backend, para simplicidade e privacidade. Sincronização fica para depois.
- 2026-11-22: time simulado em sequência nesta conversa (usuário não escolheu Claude Code com subagentes).
- 2026-11-22: textos dos exercícios próprios.
- 2026-11-22: ícones PNG 192/512 adicionados (Chrome no Android exige para instalar); SVG mantido como favicon.
- 2026-11-22: `npm audit` aponta 4 vulnerabilidades moderadas (minimatch, dentro do workbox do vite-plugin-pwa, só em tempo de build). Não afeta o app em execução; reavaliar na T8.
- 2026-11-22: demonstração dos exercícios com imagens da base aberta free-exercise-db (domínio público), 2 posições alternando em loop. Não usamos as imagens do app de origem (biblioteca comercial). Créditos em docs/time/IMAGENS.md.
- 2026-11-22: a pedido do Lucas, fotos trocadas por ilustrações da RepDB (free tier: uso em app com atribuição, sem redistribuir como base de dados, sem alimentar IA generativa). Crédito visível no rodapé da tela Treinos. Fotos da free-exercise-db removidas.
- 2026-11-22 (Lucas ausente): seguir T6→T7→T8 sem perguntas; nada é publicado em endereço público (só pacote pronto); preferir a opção mais segura em qualquer dúvida; revisão independente por agente separado NÃO feita (não autorizado), substituída por revisão própria registrada no LOG.
- 2026-11-22 (pedido do Lucas durante a T8): "importar arquivo com outros treinos" = ADICIONAR treinos de um arquivo, sem apagar nada (diferente do backup, que substitui). Aceita arquivo "plano" (kind: "plano") ou um backup (usa só os treinos). Itens por exerciseId ou por nome do exercício (sem acento/caixa); nome desconhecido com `muscle` cria exercício próprio; sem `muscle` é erro. Reps aceitam "8-12". Tela de revisão com escolha por treino, renome e aviso de nome repetido.
