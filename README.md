# QuestBank — Banco de Questões Offline

Web app SaaS offline-first para professores montarem provas a partir de um banco de questões de vestibulares brasileiros. Inspirado no Estuda.com e SuperProfessor.

## Conceitos-chave

- **Importação:** o usuário envia questões **já em JSON** no formato aceito. Sem conversão de PDF/imagem/Word.
- **Taxonomia dinâmica:** a árvore de assuntos se constrói sozinha a partir das questões importadas. Sem categorias pré-definidas.
- **100% offline:** PWA com IndexedDB. Funciona sem internet após o primeiro carregamento.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Importar JSON]  [Gerar Prova .docx]          QuestBank    │
├──────────┬─────────────────────────────┬─────────────────────┤
│ 📚 Árvore│  🔍 Filtros + Questões      │ ✅ Selecionadas     │
│ (dinâmica│  (cards simplificados)      │ (reordenáveis)      │
│          │                             │                     │
│ □ Física │  ┌───────────────────────┐  │  1. ENEM-2024-Q45  │
│  □ Mecân │  │ UDESC 2026/1 Q6       │  │  2. FUVEST-2023-Q3 │
│   ☑ Cinem│  │ Médio | Física | Ópt  │  │                     │
│   □ Dinâm│  │ Lançado em dez...     │  │  [Gerar Prova]      │
│          │  │           [Adicionar] │  │                     │
│          │  └───────────────────────┘  │                     │
└──────────┴─────────────────────────────┴─────────────────────┘
```

## Como usar com o Antigravity

### Workflow (execute nesta ordem)

```
Passo 1: /antigravity Configure o projeto QuestBank. Crie estrutura de pastas e index.html.
Passo 2: /antigravity Crie o schema IndexedDB e a lógica de taxonomia dinâmica.
Passo 3: /antigravity Crie o SubjectTree (árvore dinâmica com checkboxes).
Passo 4: /antigravity Crie o QuestionCard com modo simplificado e completo.
Passo 5: /antigravity Crie o QuestionList com FilterBar e filtros dinâmicos.
Passo 6: /antigravity Crie o SelectedPanel com reordenação.
Passo 7: /antigravity Crie o ImportModal para upload de JSON.
Passo 8: /antigravity Crie o ExportModal para gerar prova Word.
Passo 9: /antigravity Integre tudo no App principal.
```

## Scripts Python

| Script | Função | Uso |
|--------|--------|-----|
| `generate-sample-data.py` | Gera questões fictícias para testar o app | `--questions 200 --stats` |
| `validate-questions.py` | Valida JSON antes de importar | `saida/sample-data.json` |
| `generate-docx.py` | Gera prova .docx a partir de JSON | `--titulo "P1" --professor "Prof. X"` |

## Estrutura do projeto

```
banco-questoes-app/
├── AGENT.md
├── README.md
├── entrada/                              ← (não usado — import é via JSON no app)
├── saida/
│   └── sample-data.json                  ← 200 questões de exemplo
└── .agents/skills/
    ├── setup-projeto/
    │   └── SKILL.md
    ├── criar-frontend/
    │   ├── SKILL.md
    │   └── resources/design-tokens.md
    ├── importar-questoes/
    │   ├── SKILL.md
    │   └── scripts/
    │       ├── generate-sample-data.py
    │       └── validate-questions.py
    ├── exportar-word/
    │   ├── SKILL.md
    │   └── scripts/generate-docx.py
    └── criar-banco-dados/
        └── SKILL.md
```

## Formato JSON de questões

```json
{
  "questions": [
    {
      "codigo": "ENEM-2024-Q45",
      "enunciado": "Texto da questão...",
      "alternativas": [
        {"letra": "A", "texto": "...", "correta": false},
        {"letra": "B", "texto": "...", "correta": true}
      ],
      "tipo": "objetiva",
      "disciplina": "Física",
      "topico": "Mecânica",
      "conteudo": "Cinemática",
      "assunto": "Lançamento Oblíquo",
      "fonte": "ENEM",
      "ano": 2024,
      "dificuldade": "medio",
      "regiao": "Nacional"
    }
  ]
}
```

Campos mínimos obrigatórios: `enunciado` e `disciplina`. Tudo mais é opcional.
