---
name: exportar-word
description: >
  Gera arquivo .docx (Word) ou .zip (LaTeX) a partir das questões selecionadas no QuestBank.
  Use esta skill quando o usuário pedir para exportar prova, gerar Word, gerar LaTeX,
  baixar documento, formatar prova, ou quando mencionar "Word", ".docx", "LaTeX",
  "gerar prova", "exportar prova", "baixar prova", "formatar documento",
  "gabarito", "enumeração de questões", "linhas para resposta", "prova adaptada",
  "questão adaptada", "aluno atípico", "versão adaptada".
  Também ative quando houver problemas na geração do .docx/.zip ou na formatação.
---

# Exportar para Word — QuestBank

## Objetivo

Gerar um arquivo .docx formatado profissionalmente a partir das questões selecionadas, com enumeração automática, alternativas formatadas, linhas para discursivas e gabarito em página separada.

## Entradas esperadas

- Array de questões selecionadas (do estado `selectedQuestions` no app)
- Configuração da prova:
  - `titulo` (obrigatório): nome da prova/lista
  - `professor`: nome do professor
  - `instituicao`: nome da escola/colégio
  - `data`: data da prova
  - `incluir_gabarito`: boolean
  - `linhas_discursiva`: número de linhas para questões discursivas (padrão: 5)

## Saída esperada

Arquivo `.docx` baixado automaticamente no navegador do usuário.

## Estrutura do documento gerado

```
┌─────────────────────────────────────────┐
│          [Instituição]                  │  ← centralizado, Arial 12, bold
│       [Título da Prova]                │  ← centralizado, Arial 14, bold
│    Prof.: [nome]  |  Data: [dd/mm/yyyy]│  ← centralizado, Arial 10, cinza
│                                         │
│ Nome: _________________________ Turma: _│  ← Arial 11
│─────────────────────────────────────────│
│                                         │
│ 1) [Enunciado da questão objetiva]      │  ← Arial 11, numeração automática
│    A) [Texto alternativa A]             │  ← indent, letra automática
│    B) [Texto alternativa B]             │
│    C) [Texto alternativa C]             │
│    D) [Texto alternativa D]             │
│    E) [Texto alternativa E]             │
│                                         │
│ 2) [Enunciado da questão discursiva]    │
│    _____________________________________│  ← linhas de resposta (5x)
│    _____________________________________│
│    _____________________________________│
│    _____________________________________│
│    _____________________________________│
│                                         │
│ ═══════════ NOVA PÁGINA ════════════════│
│                                         │
│              GABARITO                   │  ← centralizado, bold
│    1) B                                 │
│    2) (questão discursiva)              │
│    3) A                                 │
└─────────────────────────────────────────┘
```

## Passo a passo (fluxo no export-modal.jsx)

1. Usuário clica "Gerar Prova (.docx)" no painel direito
2. Modal abre pedindo **nome da prova** (obrigatório), professor, instituição, data
3. Usuário configura opções (gabarito, linhas discursiva)
4. Ao confirmar:
   a. **Salvar prova no IndexedDB** (tabela `exams`)
   b. **Marcar questões como usadas** (campo `usedInExams` recebe nome da prova)
   c. **Gerar .docx** via docx.js
   d. **Baixar automaticamente** via FileSaver.js
5. Modal mostra confirmação de sucesso

## Tecnologias utilizadas

- **docx.js v8** (`window.docx`): criação do documento Word
- **FileSaver.js** (`window.saveAs`): trigger do download
- Ambas carregadas via CDN no `index.html`

## Formatação do Word

| Elemento | Font | Size | Style |
|----------|------|------|-------|
| Instituição | Arial | 12pt | Bold, centralizado |
| Título da prova | Arial | 14pt | Bold, centralizado |
| Info (prof/data) | Arial | 10pt | Normal, cor cinza |
| Nome/Turma | Arial | 11pt | Normal |
| Nº da questão | Arial | 11pt | Bold |
| Enunciado | Arial | 11pt | Normal |
| Alternativas | Arial | 11pt | Normal, indent |
| Letra alternativa | Arial | 11pt | Bold |
| Linhas resposta | — | — | Border bottom cinza |
| GABARITO (título) | Arial | 14pt | Bold, centralizado |
| Gabarito (itens) | Arial | 11pt | Normal |

## Regras e restrições

- Nome da prova é **obrigatório** — não gerar sem ele
- Enumeração de questões: `1)`, `2)`, `3)` ... (automática na ordem selecionada)
- Enumeração de alternativas: `A)`, `B)`, `C)` ... (da própria questão)
- Linhas de resposta apenas para `tipo === "discursiva"`
- Gabarito em página separada (pageBreakBefore)
- Arquivo salvo como: `titulo-formatado.docx` (kebab-case)

## Checklist pré-entrega

- [ ] Nome da prova preenchido antes de gerar
- [ ] Prova salva no IndexedDB (tabela exams)
- [ ] Questões marcadas com tag de uso (usedInExams)
- [ ] .docx baixa automaticamente
- [ ] Questões enumeradas na ordem correta
- [ ] Alternativas formatadas (objetivas) OU linhas de resposta (discursivas)
- [ ] Gabarito em página separada (se habilitado)
