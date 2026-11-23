# Auditoria de UX, texto e acessibilidade — 2026-11-22

**Status:** itens 1 a 12 corrigidos em 2026-11-22 (39 testes passando; axe sem violações nos estados com erro, diálogo, aviso e histórico). Itens 13 a 20 seguem pendentes. Achado extra na revisão dos prints: eixo do gráfico usava ponto decimal e o 1RM mostrava 2 casas; corrigido.

Escopo: telas Treinos, Treino ativo (com timer) e Histórico, em 390×844, pt-BR.
Método: axe-core (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA e boas práticas) em 4 estados; roteiro automatizado no app real; leitura dos textos no código.
Não feito: teste com TalkBack no aparelho, teste com pessoas, uso em Android real.

## Resultado automático
0 violações no axe em todos os estados; idioma pt-BR declarado; nenhum alvo de toque abaixo de 44 px. O axe cobre só parte do WCAG, então isto não prova conformidade.

## Prioridade alta
1. **Concluir série sem dados não dá nenhum retorno** (confirmado). Texto: "Informe a carga e as repetições para concluir a série." Mostrar junto à série, com aria-live.
2. **Voltar no meio do treino não finaliza nem avisa** (confirmado: depois do Voltar o próximo treino sugerido continua A). As séries só entram no histórico na próxima abertura do app. Opção: ao tocar em Voltar com séries marcadas, perguntar "Sair do treino? Suas séries ficam salvas." com botões "Salvar e sair" e "Continuar treino".
3. **Falha ao abrir o banco local deixa "Carregando…" para sempre** (leitura do código: sem tratamento de erro). Texto: "Não conseguimos abrir seus dados neste navegador. Feche outras abas do Treino e tente de novo." com botão "Tentar de novo".
4. **Atualização automática do app pode recarregar a página no meio do treino** (autoUpdate). Trocar por aviso na tela inicial: "Nova versão disponível" + botão "Atualizar".
5. **Sem backup ainda (T8) e sem pedido de armazenamento persistente.** Limpar os dados do navegador apaga o histórico. Até a T8: pedir `navigator.storage.persist()` e avisar na tela Histórico.

## Prioridade média
6. Plural: "1 séries" e "em 1 treinos" (gráfico). Usar plural correto.
7. Decimais inconsistentes (confirmado): histórico mostra "42,5 kg", o treino mostra "Última vez: 42.5 kg" e preenche o campo com "42.5". Padronizar em vírgula.
8. Nome acessível dos campos não contém o texto visível ("kg", "reps") — WCAG 2.5.3. Usar "Carga em kg, série 1, Agachamento no Smith" e "Repetições, série 1, …".
9. Fim do descanso só vibra e apita; leitor de tela não é avisado. Anunciar "Descanso terminou" em região aria-live (polida).
10. Sem confirmação ao finalizar. Mostrar "Treino salvo: 12 séries, 3.240 kg de volume." e levar ao Histórico.
11. "Sugerido" é vago. Trocar por "Próximo".
12. "1RM estimado" é jargão. Texto: "Carga máxima estimada para 1 repetição".

## Prioridade baixa
13. Botão de série troca o nome ("Concluir"/"Desmarcar") e também usa aria-pressed: manter nome fixo ("Série 1 concluída") com aria-pressed.
14. Seletor de exercício no Histórico sem rótulo visível: adicionar "Exercício".
15. Eixo do gráfico sem unidade: "kg".
16. Estado vazio do Histórico sem ação: botão "Ir para Treinos".
17. Aviso de saúde ausente: "Estas orientações são gerais. Se tiver dor ou condição de saúde, consulte um profissional." (também reforça o termo de não ser aconselhamento médico da fonte das ilustrações).
18. Link de crédito abre nova aba sem avisar: "(abre em nova aba)".
19. Cardio: nome do botão fica redundante ("Concluir cardio Cardio (esteira…)"). Usar "Concluir cardio".
20. Título do painel de descanso quebra em 3 linhas no celular: encurtar para "Descanso" e mostrar o exercício só em texto pequeno, ou truncar.

## O que está bom
Voz consistente e sem emoji; rótulos com verbo; textos curtos em ordem direta; datas e números no formato brasileiro; contraste AA nos estados testados; reduzir animação respeitado; alvos de toque grandes; estado vazio do Histórico explica o que fazer; gráfico com resumo em texto.

## Atualização 2026-11-22 (noite)
Itens 13–20 resolvidos (14, 17, 18 já estavam feitos; 13, 15, 16, 19, 20 corrigidos): botão da série com nome fixo + aria-pressed; unidade "kg" no eixo; botão "Ir para Treinos" no Histórico vazio; "Cardio concluído"; rótulo do timer truncado em uma linha.
