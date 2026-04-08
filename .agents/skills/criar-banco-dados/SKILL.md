---
name: criar-banco-dados
description: >
  Cria ou modifica o schema IndexedDB e a lógica de taxonomia dinâmica do QuestBank.
  Use esta skill quando o usuário pedir para modificar o banco de dados, adicionar
  campos, alterar índices, corrigir a árvore de assuntos, ou quando mencionar
  "IndexedDB", "Dexie", "schema", "banco de dados", "taxonomia", "árvore",
  "migração", "versão do banco", "índice", "campo novo", "usedInExams".
  Também ative quando houver erros de banco de dados ou migração.
---

# Banco de Dados — QuestBank

## Objetivo

Gerenciar o schema IndexedDB (via Dexie.js v3), incluindo migrações de versão, índices otimizados e a lógica de construção da árvore taxonômica dinâmica.

## Arquivos envolvidos

- `db/schema.js` — Schema Dexie, constantes de cores/estilos, funções helper
- `db/taxonomy.js` — Construção da árvore hierárquica e utilitários de filtragem

## Schema atual (v2)

```javascript
db.version(1).stores({
    questions: 'id, disciplina, topico, conteudo, assunto, banca, ano, tipo, dificuldade, created_at',
    exams: '++id, title, created_at',
    settings: 'key',
});

db.version(2).stores({
    questions: 'id, disciplina, topico, conteudo, assunto, banca, ano, tipo, dificuldade, regiao, *tags, *usedInExams, created_at',
    exams: '++id, title, created_at',
    settings: 'key',
});
```

## Tabelas

### questions
Armazena todas as questões importadas.

| Campo | Tipo | Indexed | Notas |
|-------|------|---------|-------|
| `id` | string | PK | ID único da questão |
| `enunciado` | string | Não | Texto do enunciado |
| `tipo` | string | Sim | objetiva, discursiva, v_f, somatoria |
| `disciplina` | string | Sim | Nível 1 da taxonomia |
| `topico` | string | Sim | Nível 2 da taxonomia |
| `conteudo` | string | Sim | Nível 3 da taxonomia |
| `assunto` | string | Sim | Nível 4 da taxonomia |
| `banca` | string | Sim | ENEM, FUVEST, etc. |
| `ano` | number/string | Sim | 2024, 2025, etc. |
| `dificuldade` | string | Sim | facil, medio, dificil, nao_definida |
| `gabarito` | string | Não | Resposta correta |
| `alternativas` | array | Não | [{letra, texto}] |
| `imagens` | array | Não | Base64 strings |
| `resolucao_link` | string | Não | URL |
| `regiao` | string | Sim | Região geográfica |
| `tags` | array | MultiEntry | Tags livres |
| `usedInExams` | array | MultiEntry | Nomes das provas que usaram esta questão |
| `created_at` | string | Sim | ISO date |

### exams
Histórico de provas geradas.

| Campo | Tipo | Indexed | Notas |
|-------|------|---------|-------|
| `id` | number | PK (auto) | ID auto-incrementado |
| `title` | string | Sim | Nome da prova |
| `professor` | string | Não | Nome do professor |
| `instituicao` | string | Não | Nome da instituição |
| `data` | string | Não | Data da prova (YYYY-MM-DD) |
| `questionIds` | array | Não | IDs das questões usadas |
| `questionCount` | number | Não | Total de questões |
| `config` | object | Não | Configurações da exportação |
| `created_at` | string | Sim | ISO date |

### settings
Configurações do usuário (key-value).

## Taxonomia dinâmica (taxonomy.js)

O objeto `QBTaxonomy` expõe:

| Método | O que faz |
|--------|-----------|
| `buildTree(questions)` | Constrói árvore hierárquica {disciplina > topico > conteudo > assunto} |
| `getQuestionPath(q)` | Retorna path completo da questão: `"Física>Mecânica>Cinemática>Lançamento"` |
| `getLeafPaths(node, prefix)` | Lista todos os paths folha sob um nó |
| `getNodeState(path, node, active)` | Retorna estado do checkbox: checked/indeterminate/unchecked |
| `toggleNode(path, node, active)` | Alterna seleção de um nó (cascata para filhos) |
| `questionMatchesSubjects(q, active)` | Verifica se questão bate com filtros de assunto ativos |
| `getUniqueValues(questions, field)` | Lista valores únicos de um campo (para dropdowns) |

## Constantes de estilo (schema.js)

- `DISCIPLINE_COLORS`: mapa disciplina → {bg, text, border, dot} (tema claro)
- `DIFFICULTY_STYLES`: mapa dificuldade → {bg, text, label, dot}
- `TYPE_LABELS`: mapa tipo → label em português
- `getDisciplineColor(disciplina)`: busca cor com fallback

## Passo a passo para adicionar novo campo

1. **Incrementar versão** do schema (`db.version(3).stores({...})`)
2. **Adicionar upgrade function** se necessário (para popular campo em registros existentes)
3. **Atualizar `import-handler.js`** para incluir o campo na inserção
4. **Atualizar `export-handler.js`** para incluir no backup
5. **Atualizar AGENT.md** modelo de dados
6. **Atualizar componentes** que exibem o novo campo

## Regras e restrições

- NUNCA apagar versões antigas do schema (Dexie precisa da cadeia completa para migrar)
- Sempre adicionar upgrade function quando novos campos têm valores default
- Índices MultiEntry (`*campo`) para arrays (tags, usedInExams)
- Manter `getDisciplineColor` com fallback para disciplinas desconhecidas
- Cores sempre no tema claro (bg-X-50, text-X-700)

## Checklist pré-entrega

- [ ] Versão do schema incrementada corretamente
- [ ] Upgrade function popula campos default em registros existentes
- [ ] Índices otimizados para os filtros mais usados
- [ ] DISCIPLINE_COLORS cobre as disciplinas mais comuns
- [ ] taxonomy.js constrói árvore corretamente para todos os níveis
- [ ] Nenhum erro no console ao abrir o app com banco existente
