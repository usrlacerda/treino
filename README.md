# Treino

App de treino (PWA) para registrar cargas e repetições. Funciona offline; os dados ficam só no aparelho (IndexedDB). Sem conta, sem servidor.

## Rodar
    npm install
    npm run dev        # desenvolvimento
    npm run typecheck && npm test
    npm run build      # gera dist/

## Publicar
`dist/` é um site estático e funciona na raiz ou em subpasta (caminhos relativos). Precisa de HTTPS para instalar e funcionar offline (Netlify, Cloudflare Pages, GitHub Pages…). `public/_headers` traz a política de segurança (CSP) para Netlify/Cloudflare. Abra o endereço no celular e use "Instalar app".

## Dados
- **Ajustes → Exportar backup / Importar backup**: copia completa; importar **substitui** tudo.
- **Importar treinos de um arquivo** (tela inicial): **adiciona** treinos sem apagar nada. Aceita o modelo (botão "Baixar modelo"), um arquivo de "Exportar meus treinos" ou um backup (usa só os treinos).
- Faça backup de tempos em tempos: limpar os dados do navegador apaga o histórico.

## Créditos
Ilustrações dos exercícios: RepDB (uso gratuito com atribuição; exibida no app).
Catálogo opcional de 1.324 exercícios: hasaneyldrm/exercises-dataset (dados MIT; imagens © Gym visual, https://gymvisual.com/). Para regenerar: `python3 tools/build-catalog.py <pasta do dataset>`.

## Observações
`npm audit` aponta 4 avisos moderados só em ferramentas de build (vite-plugin-pwa/minimatch), que não vão para o app publicado.
