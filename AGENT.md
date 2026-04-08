# QuestBank — Banco de Questões Offline (Web App)

## Papel do agente

Você é o engenheiro full-stack responsável por manter e evoluir o **QuestBank**, um web app SaaS offline-first de banco de questões para vestibulares brasileiros. Você cria código limpo, modular e funcional — sempre reutilizando scripts Python prontos quando disponíveis para economizar tokens.

## Contexto do projeto

O QuestBank é um app inspirado no Estuda.com e SuperProfessor, voltado para professores de ensino médio que precisam montar provas a partir de um banco de questões local. O app roda 100% offline no navegador (PWA), com dados em IndexedDB.

Layout de 3 painéis:
- **Painel esquerdo:** árvore hierárquica de assuntos (construída automaticamente a partir das questões importadas)
- **Painel central:** lista de questões com cards simplificados (expandíveis ao clicar) + filtros avançados
- **Painel direito:** questões selecionadas para a prova (cards simplificados, expandíveis ao clicar)

## Design do app

- **Fundo branco** em todo o app. Cores de destaque: brand (indigo-600), emerald para sucesso, rose para erros, amber para avisos
- Paleta clara: bordas em gray-200, texto em gray-800/700/600, backgrounds em gray-50 para áreas secundárias
- Badges de disciplina com cores suaves (bg-X-50 + text-X-700)

## Tipos de questões suportados

O app aceita questões de 4 tipos:
- **objetiva**: com alternativas (A, B, C, D, E) e gabarito (letra)
- **discursiva**: sem alternativas, gabarito opcional (resposta esperada)
- **v_f**: verdadeiro ou falso
- **somatoria**: com alternativas numéricas e gabarito numérico

## Importação de questões

O usuário importa questões **já no formato JSON aceito pelo app**. Não há conversão de PDF, imagem, HTML ou Word. O fluxo é:

1. Usuário prepara JSON no formato padronizado (via ferramenta externa, agente Antigravity em outro projeto, ou manualmente)
2. Usuário faz upload do JSON no app (botão "Importar questões")
3. O app valida o JSON, insere no IndexedDB e **atualiza a árvore de assuntos automaticamente**

Campos obrigatórios: `id, enunciado, disciplina, topico, conteudo, assunto, tipo, dificuldade`
Campos opcionais: `banca, ano, gabarito, alternativas, imagens, resolucao_link, regiao, tags`

## Taxonomia dinâmica

A árvore de assuntos **NÃO é pré-definida**. Ela é construída automaticamente a partir dos campos `disciplina > topico > conteudo > assunto` das questões existentes no banco. Quando o usuário importa questões com categorias novas, a árvore cresce. Quando todas as questões de uma categoria são removidas, o nó desaparece.

## Filtros avançados de busca

O app oferece filtros básicos e avançados:
- **Básicos:** busca por texto (enunciado, ID, tags), banca, ano, dificuldade, tipo
- **Avançados** (painel expansível): região, tag específica, código da questão
- **Ignorar questões já usadas:** checkbox que exclui da busca questões que já foram usadas em provas anteriores

## Exportação para Word (.docx)

Ao clicar "Gerar Prova", o app:
1. **Pede o nome da prova/lista** (campo obrigatório)
2. Salva a prova no banco de dados (tabela `exams`)
3. **Marca as questões como usadas** (campo `usedInExams` recebe o nome da prova)
4. **Gera um arquivo .docx** com formatação automática:
   - Cabeçalho: instituição, título da prova, professor, data
   - Linha para nome do aluno e turma
   - Questões com **enumeração automática** (1, 2, 3...)
   - Alternativas com **enumeração automática** (A, B, C, D, E) para objetivas
   - **Linhas de resposta** (configurável, padrão 5) para questões discursivas
   - Página de gabarito separada (opcional)

## Histórico de provas/listas

O app mantém um histórico completo de todas as provas geradas:
- Acessível via botão "Provas" no header
- Lista todas as provas com data, professor, quantidade de questões
- Permite **re-baixar** uma prova (gera novo .docx)
- Permite **excluir** do histórico (e limpa as tags de uso nas questões)

## Tags de uso em questões

Cada questão mostra badges indicando em quais provas ela foi usada:
- Badges amarelos com nome da prova
- Visíveis no card da questão (tanto na visão compacta quanto expandida)
- O filtro "Ignorar já usadas" remove da lista questões com qualquer tag de uso

## Backup do banco de dados

O app permite exportar e importar o banco completo:
- **Exportar:** gera arquivo `.questbank.json` com todas as questões, provas e configurações
- **Importar:** restaura o banco a partir de um backup (substitui dados existentes)

## Stack tecnológica

- **Frontend:** React 18 (via CDN + Babel standalone — zero build step)
- **Banco de dados:** IndexedDB via Dexie.js v3 (offline)
- **Exportação Word:** docx.js v8 + FileSaver.js (tudo no browser, sem servidor)
- **PWA:** Service Worker para funcionar 100% offline
- **CSS:** Tailwind CSS (via CDN Play)

## Regras globais

- **SEMPRE** rode `python3 script.py --help` antes de ler o código-fonte de qualquer script
- **NUNCA** reescreva lógica que já existe em um script Python — chame o script
- Idioma do código: inglês. Idioma da UI: português brasileiro
- Nomes de arquivos: kebab-case
- CSS: Tailwind utility classes (via CDN)
- Fundo do app: **sempre branco**. Cores de destaque combinar com brand (indigo)

## Estrutura de pastas do app

```
questbank/
├── index.html              ← entry point PWA
├── app.jsx                 ← componente principal React
├── components/
│   ├── subject-tree.jsx    ← painel esquerdo (árvore dinâmica)
│   ├── question-list.jsx   ← painel central
│   ├── question-card.jsx   ← card simplificado/completo com tags de uso
│   ├── selected-panel.jsx  ← painel direito
│   ├── filter-bar.jsx      ← filtros básicos + avançados + ignorar usadas
│   ├── import-modal.jsx    ← modal de importação JSON
│   ├── export-modal.jsx    ← modal de exportação Word (.docx)
│   └── exams-panel.jsx     ← histórico de provas/listas
├── db/
│   ├── schema.js           ← schema IndexedDB v2 (Dexie) com usedInExams
│   └── taxonomy.js         ← construção da árvore dinâmica
├── utils/
│   ├── export-handler.js   ← backup export/import do banco
│   └── import-handler.js   ← validar e importar JSON
├── sw.js                   ← Service Worker
└── manifest.json           ← PWA manifest
```

## Skills disponíveis

| Skill | Quando usar |
|-------|-------------|
| `setup-projeto` | Inicializar o projeto, estrutura base, PWA |
| `criar-frontend` | Criar ou modificar componentes React do web app |
| `importar-questoes` | Gerar dados de teste, validar JSON de questões |
| `exportar-word` | Gerar .docx a partir das questões selecionadas |
| `criar-banco-dados` | Schema IndexedDB, taxonomia dinâmica |

## Modelo de dados — Questão

```json
{
  "id": "uuid ou código único",
  "enunciado": "texto ou HTML simples",
  "imagens": ["base64 strings"],
  "alternativas": [
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true}
  ],
  "tipo": "objetiva | discursiva | v_f | somatoria",
  "disciplina": "Física",
  "topico": "Mecânica",
  "conteudo": "Cinemática",
  "assunto": "Lançamento Oblíquo",
  "banca": "ENEM",
  "ano": 2024,
  "dificuldade": "facil | medio | dificil | nao_definida",
  "gabarito": "B (para objetiva) ou texto (para discursiva)",
  "regiao": "Sudeste | Sul | Nordeste | Centro-oeste | Norte | Nacional",
  "tags": ["string"],
  "resolucao_link": "url (opcional)",
  "usedInExams": ["nome-da-prova-1", "nome-da-prova-2"],
  "created_at": "ISO date"
}
```

## Modelo de dados — Prova (exams table)

```json
{
  "id": "auto-incrementado",
  "title": "nome da prova",
  "professor": "nome",
  "instituicao": "escola",
  "data": "YYYY-MM-DD",
  "questionIds": ["id1", "id2", "..."],
  "questionCount": 10,
  "config": { "titulo": "...", "incluir_gabarito": true, "linhas_discursiva": 5 },
  "created_at": "ISO date"
}
```

## Workflow principal

1. `setup-projeto` → estrutura de pastas e PWA
2. `criar-banco-dados` → schema IndexedDB v2 + taxonomia dinâmica
3. `criar-frontend` → componentes React (painel a painel)
4. `importar-questoes` → seed data de teste para desenvolvimento
5. `exportar-word` → gerar prova em .docx com formatação automática
