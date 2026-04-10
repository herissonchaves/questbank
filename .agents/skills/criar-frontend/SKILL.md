---
name: criar-frontend
description: >
  Cria ou modifica componentes React do web app QuestBank.
  Use esta skill quando o usuário pedir para criar, editar ou corrigir
  qualquer componente da interface: subject-tree, question-list, question-card,
  selected-panel, filter-bar, import-modal, export-modal, exams-panel,
  create-question-modal, edit-question-modal, stats-panel.
  Também ative quando mencionar "componente", "painel", "tela", "interface",
  "layout", "botão", "modal", "card", "filtro", "árvore de assuntos",
  "lista de questões", "painel de seleção", "tema", "cor", "estilo",
  "carrossel", "questão adaptada", "versão adaptada", "aluno atípico".
---

# Criar / Modificar Frontend — QuestBank

## Objetivo

Criar ou modificar componentes React JSX do QuestBank, seguindo o padrão de design (fundo branco, Tailwind CSS via CDN, React 18 via CDN + Babel standalone).

## Entradas esperadas

- Nome do componente a criar ou modificar
- Descrição da funcionalidade ou mudança desejada
- (Opcional) Screenshot ou referência visual

## Saída esperada

Arquivo `.jsx` funcional em `components/`, seguindo os padrões do projeto.

## Passo a passo

1. **Consultar o AGENT.md** para entender o contexto geral, modelo de dados e estrutura
2. **Ler os componentes existentes** que interagem com o componente alvo (verificar props passadas)
3. **Criar ou editar o componente** seguindo as convenções abaixo
4. **Verificar se o `index.html`** inclui o script tag do componente
5. **Verificar se o `sw.js`** lista o componente no APP_SHELL
6. **Testar mentalmente** o fluxo de dados: App → componente → callbacks

## Convenções obrigatórias de código

### React
- React 18 via CDN global (não use imports ES6 — use `React.useState`, etc.)
- Componentes como funções (`const NomeComponente = (props) => { ... }`)
- Hooks extraídos no topo: `const { useState, useEffect } = React;` (apenas no app.jsx)
- Nos componentes, usar `React.useState`, `React.useRef`, `React.useMemo`, `React.useCallback`

### Tailwind CSS (tema branco)
- Fundo principal: `bg-white`
- Fundo secundário: `bg-gray-50` ou `bg-gray-50/50`
- Bordas: `border-gray-200`
- Texto principal: `text-gray-800` ou `text-gray-900`
- Texto secundário: `text-gray-600`, `text-gray-500`
- Texto terciário: `text-gray-400`
- Cor brand: `brand-600` (indigo) para botões e destaques
- Badges de disciplina: `bg-X-50 text-X-700` (X = cor da disciplina)
- Badges de dificuldade: `bg-X-50 text-X-700`
- Hover em botões: `hover:bg-gray-100` ou `hover:bg-brand-50`
- Focus em inputs: `focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500`

### Padrão de badges de tipo de questão
- Objetiva: `bg-gray-50 text-gray-500`
- Discursiva: `bg-violet-50 text-violet-700`
- V/F: `bg-gray-50 text-gray-500`
- Somatória: `bg-gray-50 text-gray-500`

### Tags de uso (usedInExams)
- Classe CSS: `used-tag` (definida no index.html)
- Cor: fundo amarelo claro, texto âmbar escuro

## Componentes existentes e suas responsabilidades

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| SubjectTree | `subject-tree.jsx` | Árvore hierárquica de assuntos com checkboxes |
| QuestionList | `question-list.jsx` | Lista paginada de questões com FilterBar |
| QuestionCard | `question-card.jsx` | Card expandível com badges, alternativas, tags de uso |
| SelectedPanel | `selected-panel.jsx` | Lista de questões selecionadas com drag & drop |
| FilterBar | `filter-bar.jsx` | Filtros básicos + avançados + "ignorar já usadas" |
| ImportModal | `import-modal.jsx` | Upload e validação de JSON |
| ExportModal | `export-modal.jsx` | Configuração da prova + geração de .docx |
| ExamsPanel | `exams-panel.jsx` | Histórico de provas salvas |

## Regras e restrições

- NUNCA usar dark theme (bg-slate-950, text-slate-100, etc.)
- NUNCA usar `import` / `export` — tudo via variáveis globais
- NUNCA adicionar build tools (webpack, vite, etc.)
- Sempre verificar se novos componentes estão no `index.html` e no `sw.js`
- Textos da UI sempre em português brasileiro

## Checklist pré-entrega

- [ ] Componente usa apenas classes Tailwind disponíveis no CDN
- [ ] Props estão consistentes com o componente pai (app.jsx)
- [ ] Nenhum `import`/`export` statement (apenas variáveis globais)
- [ ] Fundo branco, sem resquícios de dark theme
- [ ] Script tag presente no `index.html` na ordem correta
- [ ] Arquivo listado no `sw.js` APP_SHELL
