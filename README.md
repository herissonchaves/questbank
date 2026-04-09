# QuestBank — Banco de Questões

Web app SaaS **offline-first** para professores montarem provas a partir de um banco de questões de vestibulares. Inspirado no Estuda.com e SuperProfessor. Roda 100% no navegador, sem instalar nada.

> 📖 **Como abrir e colocar no ar?** Veja o guia passo a passo em [`COMO-USAR.md`](./COMO-USAR.md)

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Questões objetivas e discursivas** | Suporte a 4 tipos: objetiva, discursiva, V/F, somatória |
| **Importação via JSON** | Upload de arquivo JSON validado; o app formata e insere automaticamente |
| **Árvore de assuntos dinâmica** | Hierarquia disciplina → tópico → conteúdo → assunto, construída das questões importadas |
| **Filtros avançados** | Busca por texto, banca, ano, dificuldade, tipo, região, tag e código |
| **Ignorar questões já usadas** | Checkbox que remove da busca questões que já foram usadas em provas |
| **Tags de uso** | Cada questão exibe badges amarelos com o nome das provas em que foi utilizada |
| **Exportação Word (.docx)** | Gera prova formatada com enumeração automática, linhas para discursivas e gabarito |
| **Histórico de provas** | Menu com todas as provas salvas, opção de re-download e exclusão |
| **Backup offline** | Exporta/importa o banco completo em `.questbank.json` |
| **100% offline (PWA)** | Funciona sem internet após o primeiro carregamento |

---

## Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  📚 QuestBank        [Provas] [Importar] [Backup ▾]                   │  ← Header branco
├───────────────┬───────────────────────────────────────┬───────────────-┤
│ Assuntos      │  🔍 Busca + Filtros [Avançado ▾]      │ Prova         │
│               │  [Banca] [Ano] [Dificuldade] [Tipo]   │               │
│ □ Biologia    │  ────────────────────────────────────  │  2 obj. 1 disc│
│  □ Genética   │                                        │               │
│  □ Ecologia   │  ┌──────────────────────────────────┐  │  ⠿ 1 ENEM-24 │
│ ☑ Física      │  │ UDESC 2026 · Física · Médio      │  │  ⠿ 2 FUV-23  │
│  ☑ Mecânica   │  │ [Objetiva] [Campo Elétrico]      │  │  ⠿ 3 UERJ-22 │
│  □ Óptica     │  │ Um pequeno corpo de massa 20g... │  │               │
│ □ Química     │  │ [Usada em: P1 Física]            │  │  [Gerar Prova │
│               │  │                              [+] │  │    .docx]     │
│               │  └──────────────────────────────────┘  │               │
└───────────────┴───────────────────────────────────────-┴───────────────┘
```

---

## Fluxo de uso

```
1. Importar questões (JSON)
       ↓
2. Selecionar assuntos na árvore
       ↓
3. Refinar com filtros avançados
       ↓
4. Clicar [+] nas questões desejadas
       ↓
5. Reordenar no painel direito (drag & drop)
       ↓
6. Clicar "Gerar Prova"
       ↓
7. Preencher nome da prova → Baixar Word
       ↓
8. Questões ficam marcadas como "usadas" automaticamente
```

---

## Formato JSON de importação (v1.0)

```json
{
  "version": "1.0",
  "questions": [
    {
      "id": "ENEM-2024-Q45",
      "enunciado": "Texto completo da questão...",
      "tipo": "objetiva",
      "disciplina": "Física",
      "topico": "Mecânica",
      "conteudo": "Cinemática",
      "assunto": "Lançamento Oblíquo",
      "dificuldade": "medio",
      "banca": "ENEM",
      "ano": 2024,
      "gabarito": "C",
      "alternativas": [
        { "letra": "A", "texto": "Texto da alternativa A" },
        { "letra": "B", "texto": "Texto da alternativa B" },
        { "letra": "C", "texto": "Texto da alternativa C" },
        { "letra": "D", "texto": "Texto da alternativa D" },
        { "letra": "E", "texto": "Texto da alternativa E" }
      ],
      "regiao": "Nacional",
      "tags": ["vestibular", "cinemática"]
    },
    {
      "id": "UNICAMP-2025-D3",
      "enunciado": "Explique o conceito de energia potencial gravitacional...",
      "tipo": "discursiva",
      "disciplina": "Física",
      "topico": "Mecânica",
      "conteudo": "Energia",
      "assunto": "Energia Potencial",
      "dificuldade": "dificil",
      "banca": "UNICAMP",
      "ano": 2025,
      "gabarito": "Ep = mgh (resposta esperada opcional)"
    }
  ]
}
```

### Campos obrigatórios

`id`, `enunciado`, `tipo`, `disciplina`, `topico`, `conteudo`, `assunto`, `dificuldade`

> Questões do tipo `objetiva` também exigem `alternativas` (array com pelo menos 2 itens).

### Campos opcionais

`banca`, `ano`, `gabarito`, `imagens`, `resolucao_link`, `regiao`, `tags`

### Valores aceitos

| Campo | Valores válidos |
|---|---|
| `tipo` | `objetiva` · `discursiva` · `v_f` · `somatoria` |
| `dificuldade` | `facil` · `medio` · `dificil` · `nao_definida` |

---

## Documento Word gerado

```
┌──────────────────────────────────────────┐
│          Colégio Estadual XYZ            │
│       Prova de Física – 2º Bimestre      │
│    Prof.: Maria Silva  |  Data: 10/04/26 │
│                                          │
│ Nome: ___________________________Turma:_ │
│ ──────────────────────────────────────── │
│                                          │
│ 1) [Enunciado questão objetiva...]       │
│    A) Texto alternativa A                │
│    B) Texto alternativa B ← (gabarito)   │
│    C) Texto alternativa C                │
│                                          │
│ 2) [Enunciado questão discursiva...]     │
│    _____________________________________ │  ← 5 linhas (configurável)
│    _____________________________________ │
│    _____________________________________ │
│                                          │
│ ════════════ GABARITO ═════════════════  │  ← página separada (opcional)
│    1) B     2) (discursiva)              │
└──────────────────────────────────────────┘
```

---

## Stack tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 (CDN) | Interface de usuário |
| Babel Standalone | 7 (CDN) | Transpila JSX no browser |
| Dexie.js | 3 (CDN) | Wrapper IndexedDB (banco offline) |
| docx.js | 8.5 (CDN) | Geração de .docx no browser |
| FileSaver.js | 2.0 (CDN) | Download automático de arquivos |
| Tailwind CSS | Play CDN | Estilização |
| Service Worker | — | Cache offline (PWA) |

> Zero dependências de build. Nenhum npm, webpack ou vite necessário.

---

## Estrutura de arquivos

```
questbank/
├── AGENT.md                    ← Instruções do agente Antigravity
├── README.md                   ← Este arquivo
├── COMO-USAR.md                ← Guia de instalação para leigos
├── index.html                  ← Entry point (carrega todas as dependências)
├── app.jsx                     ← Componente principal (useReducer, 3 painéis)
├── manifest.json               ← PWA manifest (tema branco, ícone)
├── sw.js                       ← Service Worker (cache-first, offline)
│
├── components/
│   ├── subject-tree.jsx        ← Painel esquerdo: árvore dinâmica de assuntos
│   ├── filter-bar.jsx          ← Filtros básicos + avançados + "ignorar usadas"
│   ├── question-list.jsx       ← Painel central: lista paginada + lazy load
│   ├── question-card.jsx       ← Card expandível com badges de uso
│   ├── selected-panel.jsx      ← Painel direito: drag & drop, contador por tipo
│   ├── import-modal.jsx        ← Upload JSON com validação visual
│   ├── export-modal.jsx        ← Configura prova → salva → gera .docx
│   └── exams-panel.jsx         ← Histórico de provas salvas
│
├── db/
│   ├── schema.js               ← Schema Dexie v2 (questions + exams + settings)
│   └── taxonomy.js             ← Construção e navegação da árvore hierárquica
│
├── utils/
│   ├── import-handler.js       ← Valida e importa JSON no IndexedDB
│   └── export-handler.js       ← Backup/restauração do banco
│
├── saida/
│   └── sample-data.json        ← Questões de exemplo para testar
│
└── .agents/
    └── skills/
        ├── setup-projeto/      ← Criar estrutura, PWA, index.html
        ├── criar-frontend/     ← Componentes React (convenções de tema)
        ├── importar-questoes/  ← Formato JSON, exemplos, validação
        │   └── examples/       ← sample-objetiva.json, sample-discursiva.json
        ├── exportar-word/      ← Geração .docx, formatação, gabarito
        └── criar-banco-dados/  ← Schema IndexedDB, taxonomia, migrações
```

---

## Banco de dados (IndexedDB)

### Tabela `questions`

| Campo | Tipo | Indexado |
|---|---|---|
| `id` | string | PK |
| `tipo` | string | ✓ |
| `disciplina / topico / conteudo / assunto` | string | ✓ |
| `banca / ano / dificuldade / regiao` | string/number | ✓ |
| `tags` | array | ✓ MultiEntry |
| `usedInExams` | array | ✓ MultiEntry |
| `alternativas / imagens / gabarito` | — | — |

### Tabela `exams` (histórico de provas)

| Campo | Tipo |
|---|---|
| `id` | auto-increment PK |
| `title` | string |
| `questionIds` | array de IDs |
| `professor / instituicao / data` | string |
| `created_at` | ISO date |

---

## Como usar com o Antigravity

```
# Para criar o projeto do zero:
/antigravity Configure o projeto QuestBank com estrutura completa e PWA.

# Para criar ou editar componentes:
/antigravity Adicione um campo "serie" no filtro avançado do QuestBank.

# Para gerar dados de teste:
/antigravity Gere 20 questões de Química no formato JSON do QuestBank.

# Para ajustar o banco de dados:
/antigravity Adicione um índice para o campo "professor" na tabela exams.

# Para ajustar o Word exportado:
/antigravity Adicione cabeçalho e rodapé em todas as páginas do .docx gerado.
```

O agente lê o `AGENT.md` e ativa a skill correta automaticamente. Skills disponíveis: `setup-projeto`, `criar-frontend`, `importar-questoes`, `exportar-word`, `criar-banco-dados`.
