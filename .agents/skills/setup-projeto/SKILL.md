---
name: setup-projeto
description: >
  Inicializa a estrutura completa do projeto QuestBank do zero.
  Use esta skill quando o usuário pedir para criar o projeto, configurar a PWA,
  montar a estrutura de pastas, ou quando mencionar "setup", "inicializar",
  "criar projeto", "estrutura base", "PWA", "service worker", "manifest".
  Também ative quando for necessário resetar ou recriar a estrutura do projeto.
---

# Setup do Projeto QuestBank

## Objetivo

Criar toda a estrutura de pastas e arquivos base do QuestBank, incluindo PWA (Service Worker + manifest), HTML entry point e configurações iniciais.

## Entradas esperadas

- Nenhuma entrada específica. O agente cria tudo do zero com base no AGENT.md.

## Saída esperada

Estrutura completa de pastas e arquivos conforme definido no AGENT.md:

```
questbank/
├── index.html
├── app.jsx
├── manifest.json
├── sw.js
├── components/   (pasta vazia, pronta para os componentes)
├── db/           (pasta vazia, pronta para schema e taxonomy)
├── utils/        (pasta vazia, pronta para handlers)
└── saida/        (pasta para arquivos gerados)
```

## Passo a passo

1. **Criar as pastas** do projeto: `components/`, `db/`, `utils/`, `saida/`
2. **Criar o `index.html`** com:
   - Meta tags para PWA (theme-color, apple-mobile-web-app-capable)
   - CDNs: React 18, ReactDOM 18, Babel Standalone, Dexie.js v3, Tailwind CSS Play, docx.js v8, FileSaver.js
   - Google Fonts: Inter
   - CSS customizado: scrollbar, animações, card-hover, used-tag, panel borders
   - Body com `bg-white text-gray-900`
   - Script tags para todos os componentes na ordem correta (utilities primeiro, depois componentes JSX via Babel, app.jsx por último)
   - Registro do Service Worker
3. **Criar o `manifest.json`** com:
   - `background_color: "#ffffff"`, `theme_color: "#4f46e5"`
   - Ícone SVG inline com emoji 📚
   - `display: "standalone"`, `lang: "pt-BR"`
4. **Criar o `sw.js`** com:
   - Cache name versionado (`questbank-v2`)
   - APP_SHELL com todos os arquivos locais
   - CDN_URLS com todas as dependências externas
   - Estratégia cache-first para app shell e CDN
   - Fallback offline para `index.html`
5. **Criar o `app.jsx`** com:
   - Estado inicial via `useReducer` (questions, selectedIds, activeSubjects, filters, ignoreUsed, modals)
   - Reducer com todos os action types
   - Layout de 3 painéis com header
   - Montagem do React via `createRoot`

## Regras e restrições

- Fundo do app SEMPRE branco (`bg-white`)
- Paleta de cores: brand (indigo-600), gray para texto/bordas, emerald/rose/amber para feedback
- Idioma da UI: português brasileiro
- Idioma do código: inglês
- Nomes de arquivos: kebab-case
- Todas as CDNs devem usar versões fixas (não `@latest`)

## Checklist pré-entrega

- [ ] `index.html` carrega sem erros no navegador
- [ ] Service Worker registra corretamente no console
- [ ] Manifest é detectado pelo navegador (aba Application no DevTools)
- [ ] Todas as CDNs carregam com sucesso
- [ ] Layout de 3 painéis renderiza corretamente
