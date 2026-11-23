# Análise do app contra o Material Design 3 — 2026-11-22

Base: leitura do código, capturas em 390×844, 900×1100 e 1440×900, cálculo de contraste e teste com o sistema em modo claro.
Não feito: conferência das especificações no site oficial do Material nesta sessão (conclusões baseadas nas diretrizes do M3 já conhecidas); teste no Android real.

## Recomendação
Manter componentes próprios (app pequeno, offline) e adotar o **vocabulário do M3**: tokens por papel, escala tipográfica, escala de formas, claro e escuro. Paleta gerada no Material Theme Builder a partir da cor-semente #a78bfa. Não adotar `@material/web` (em manutenção). Expressive só no botão "Finalizar" e no timer.

## Falhas objetivas
1. **Bordas de campo com contraste 1,2–1,4:1** (mínimo de 3:1 para limites de componentes, WCAG 1.4.11): campos de carga/repetições e botão ○ quase somem. O axe não detecta isto. Usar o papel `outline`.
2. **Só existe tema escuro** (confirmado: com o sistema em modo claro o app continua escuro; theme-color fixo). M3 pede claro e escuro.
3. **Sem tokens por papel:** só variáveis soltas (--bg, --surface, --accent). Mapear para surface, surface-container(-high), on-surface, on-surface-variant, primary, on-primary, primary-container, outline, error.
4. **Barra inferior com 2 destinos** (M3: 3 a 5) e sem ícones nem indicador do item ativo. Quando entrarem Plano/Biblioteca (T7) e Backup/Perfil (T8), passa a servir; até lá, abas.
5. **Layout não adaptativo** (confirmado em 1440 px): coluna de 640 px no meio, botão ✓ longe dos campos. Classes: compacta <600, média 600–840 (trilho de navegação), expandida ≥840 (lista + detalhe).
6. **Controles feitos com texto:** ○/✓ e "‹ Voltar" são caracteres. Usar botão de ícone com alternância (SVG de ícones Material auto-hospedados, funciona offline) e barra superior com seta de voltar.

## Padrões a alinhar
7. **Timer** cobre a série seguinte: usar folha inferior padrão ou barra fixa e indicador de progresso (linear/circular), não só o número.
8. **Diálogo "Sair do treino?"**: M3 é centralizado, com scrim, botões de texto alinhados à direita ("Continuar treino", "Salvar e sair").
9. **Tipografia:** tamanhos soltos (1,6/1,2/1,1/.9/.85/.8/.75 rem). Definir escala (headline, title, body, label) em 3 a 4 papéis usados.
10. **Formas:** raios 10/12/16 sem regra. Adotar a escala (8, 12, 16, 28, pílula) por tipo de componente; botões M3 padrão são em pílula.
11. **Estados:** sem camadas de estado (foco, pressionado) nem anel de foco próprio. Definir.
12. **Movimento:** telas e estados trocam sem transição. Transição de eixo compartilhado entre Início e Treino, respeitando "reduzir movimento".
13. **Áreas seguras:** o botão "Finalizar" e o timer não usam `safe-area-inset-bottom`.

## O que já está alinhado
Alvos de toque ≥48 px; contraste de texto AA (texto 15,6:1; texto secundário 6,3:1; botão principal 6,9:1; erro 9,1:1); superfícies tonais em vez de sombras pesadas; uma ação principal por tela; estados vazio e de erro; reduzir movimento nas ilustrações; foco da pergunta de saída no botão seguro.

## Ordem sugerida
Tokens + tema claro/escuro + contraste das bordas (1–3) → ícones, barra superior e barra de navegação (4, 6) → timer e diálogo (7, 8) → escala tipográfica e formas (9, 10) → adaptativo (5), movimento (12) e estados (11, 13).

## Implementado em 2026-11-22 (noite)
Tokens por papel com tema claro/escuro automático (e theme-color); contorno de controles ≥3:1 (--outline); barra de navegação com 4 destinos, ícones e indicador; trilho lateral ≥600 px; timer com barra de progresso e rótulo truncado; diálogo centralizado em 28 px; foco visível global; áreas seguras. Não feito: escala tipográfica formal, transição entre telas, lista+detalhe em tela expandida, Expressive.
