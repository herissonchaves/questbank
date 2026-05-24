# QuestBank — Banco de Questões (Web App + Backend)

## Papel do agente

Você é o engenheiro full-stack responsável por manter e evoluir o **QuestBank**, um web app de banco de questões para vestibulares brasileiros, hospedado em servidor próprio (homelab). Você cria código limpo, modular e funcional — sempre reutilizando scripts e utilitários existentes quando disponíveis para economizar tokens.

## Contexto do projeto

O QuestBank é um app inspirado no Estuda.com e SuperProfessor, voltado para professores de ensino médio que precisam montar provas a partir de um banco de questões. A arquitetura é cliente-servidor:

- **Frontend:** SPA React 18 (via CDN + Babel standalone), servida estaticamente por nginx
- **Backend:** API REST Node.js + Express + SQLite (`better-sqlite3`)
- **Deploy:** Docker Compose (frontend `:8080` + backend `:3000`), acesso remoto via Tailscale

Layout de 3 painéis:
- **Painel esquerdo:** árvore hierárquica de assuntos (construída automaticamente a partir das questões importadas), com drag & drop e renomeio em lote
- **Painel central:** lista de questões com cards simplificados (expandíveis ao clicar) + filtros avançados
- **Painel direito:** questões selecionadas para a prova (cards simplificados, expandíveis ao clicar)

## Design do app

- **Fundo branco** em todo o app. Cores de destaque: brand (indigo-600), emerald para sucesso, rose para erros, amber para avisos
- Paleta clara: bordas em gray-200, texto em gray-800/700/600, backgrounds em gray-50 para áreas secundárias
- Badges de disciplina com cores suaves (bg-X-50 + text-X-700)

## Tipos de questões suportados

O app aceita dois tipos:
- **objetiva**: com alternativas (A, B, C, D, E...) e gabarito (letra)
- **discursiva**: sem alternativas, gabarito opcional (resposta esperada)

> Tipos legados `v_f` e `somatoria` não estão implementados na validação atual (`utils/import-handler.js`). Adicione-os apenas se houver demanda explícita.

## Questões Adaptadas (Alunos Atípicos)

O app suporta **versões adaptadas** de cada questão, destinadas a alunos atípicos (inclusão). O pareamento é feito pelo **ID**:

- Questão regular: id qualquer (ex.: `12345678`)
- Questão adaptada: mesmo id com prefixo `A` ou `A-` (ex.: `A12345678` ou `A-12345678`)
- O app detecta o par automaticamente (regex `^A-?\d+$`) e esconde a adaptada da lista principal

### Regras das questões adaptadas

- Questões **objetivas adaptadas** possuem no máximo **3 alternativas (A, B, C)**
- Questões adaptadas herdam os metadados da regular (disciplina, tópico, conteúdo, assunto, banca, ano, dificuldade)
- Questões adaptadas **não aparecem como cards separados** na lista — aparecem dentro do carrossel da questão regular

### Carrossel no QuestionCard

Cada card de questão funciona como um carrossel de 2 páginas:
- **Página 1 (Regular):** mostra a questão original
- **Página 2 (Adaptada):** mostra a versão adaptada

Tabs "Regular" / "Adaptada" aparecem quando a questão tem versão adaptada. Ambas as versões podem ser editadas individualmente.

### Exportação de prova adaptada

No modal "Gerar Prova", se alguma questão selecionada possui versão adaptada, aparece o toggle "Gerar prova adaptada". Se marcado:
- **Word:** gera 2 downloads `.docx` (regular + adaptada)
- **LaTeX:** gera 2 downloads `.zip` (regular + adaptada)

## Importação de questões

O usuário importa questões via JSON (formato padronizado) **ou** via `.zip` contendo `.tex` + imagens (convertido pelo pacote opcional `questbank-server/`). O fluxo é:

1. Usuário prepara JSON no formato padronizado (ou .zip LaTeX)
2. Usuário faz upload no app (botão "Importar questões")
3. O app valida e envia para `POST /api/questions/bulk`
4. O backend persiste no SQLite e **a árvore de assuntos é reconstruída automaticamente** no frontend ao recarregar

Campos obrigatórios: `enunciado, disciplina, topico, conteudo, assunto, tipo, dificuldade`
Campos opcionais: `id, banca, ano, gabarito, alternativas, imagens, resolucao_link, regiao, tags`

## Taxonomia dinâmica

A árvore de assuntos **NÃO é pré-definida**. Ela é construída automaticamente a partir dos campos `disciplina > topico > conteudo > assunto` das questões existentes no banco.

Drag & drop e renomeio de nós atualizam **em lote** todas as questões da subárvore (via endpoint `POST /api/questions/bulk-patch`). Ctrl+Z desfaz a última operação de taxonomia.

## Filtros avançados de busca

- **Básicos:** busca por texto (enunciado, ID, tags), banca, ano, dificuldade, tipo
- **Avançados:** região, tag(s), código da questão, lote de importação (timestamp), com/sem resolução, ordenação
- **Ignorar questões já usadas:** checkbox que exclui da busca questões que já foram usadas em provas anteriores

## Exportação para Word (.docx) e LaTeX (.zip)

Ao clicar "Gerar Prova", o app:
1. **Pede o nome da prova/lista** (campo obrigatório)
2. O usuário escolhe formato: **Word (.docx)** ou **LaTeX (.zip)**
3. Salva a prova no banco de dados (`POST /api/exams`)
4. **Marca as questões como usadas** (campo `usedInExams` recebe o nome da prova)
5. **Gera o arquivo** com formatação automática (cabeçalho, enumeração, gabarito opcional)
6. Se "Gerar prova adaptada" estiver marcado, gera 2 arquivos

## Backup do banco de dados

O app permite exportar e importar o banco completo via JSON (`.questbank.json`). Para backup bare-metal do volume Docker, veja `HOMELAB-DEPLOY.md`.

## Stack tecnológica

- **Frontend:** React 18 (via CDN + Babel standalone — zero build step), Tailwind CSS Play CDN
- **Cliente do banco:** `db/api-client.js` — interface drop-in que substitui a API do Dexie (toArray, where().equals(), update, bulkPatch) chamando `fetch()` no backend
- **Backend:** Node.js 20 + Express 4 + better-sqlite3
- **Exportação Word:** docx.js v8 + FileSaver.js (renderiza no browser)
- **Exportação LaTeX:** template gerador + JSZip (no browser)
- **Deploy:** Docker Compose (nginx + Node) + Tailscale para acesso remoto

## Regras globais

- **SEMPRE** rode `python3 script.py --help` antes de ler o código-fonte de qualquer script Python
- **NUNCA** reescreva lógica que já existe em um script Python — chame o script
- Idioma do código: inglês. Idioma da UI: português brasileiro
- Nomes de arquivos: kebab-case
- CSS: Tailwind utility classes (via CDN)
- Fundo do app: **sempre branco**. Cores de destaque combinar com brand (indigo)
- Para operações em lote (taxonomia, tags, embaralhar alternativas), **use `db.questions.bulkPatch([...])`** — nunca chame `update()` em loop (evita N+1 round-trips)
- Ao adicionar componente novo, **registre o arquivo no `index.html` e no `sw.js`** (lista `APP_SHELL`)

## Estrutura de pastas do app

```
questbank/
├── docker-compose.yml         ← orquestração frontend + backend
├── Dockerfile                 ← imagem do frontend (nginx)
├── nginx.conf                 ← config nginx (proxy /api/ → backend:3000)
├── .dockerignore
│
├── index.html                 ← entry point PWA
├── app.jsx                    ← componente principal React (3 painéis + modais)
├── sw.js                      ← Service Worker (cache de assets)
├── manifest.json              ← PWA manifest
│
├── components/                ← todos os componentes React
├── db/
│   ├── api-client.js          ← cliente HTTP (interface drop-in tipo Dexie)
│   ├── schema.js              ← cores e labels
│   └── taxonomy.js            ← construção da árvore dinâmica
├── utils/                     ← validação, exportação, sanitização
├── server/                    ← backend Node.js (Express + SQLite)
└── questbank-server/          ← (opcional) conversor LaTeX → JSON em Python
```

## API REST

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/questions` | Lista todas as questões |
| `GET` | `/api/questions/:id` | Busca uma questão |
| `POST` | `/api/questions` | Cria/sobrescreve uma questão |
| `POST` | `/api/questions/bulk` | Importação em lote |
| `PATCH` | `/api/questions/:id` | Atualiza campos (merge parcial) |
| `POST` | `/api/questions/bulk-patch` | Atualiza vários campos em lote |
| `DELETE` | `/api/questions/:id` | Exclui uma questão |
| `POST` | `/api/questions/bulk-delete` | Exclui várias |
| `GET` | `/api/exams` | Lista provas |
| `POST` | `/api/exams` | Salva prova no histórico |
| `DELETE` | `/api/exams/:id` | Exclui prova |

## Modelo de dados — Questão

```json
{
  "id": "string (ou prefixo 'A' / 'A-' para adaptada)",
  "enunciado": "HTML (com fórmulas KaTeX e <img>)",
  "imagens": ["base64 strings"],
  "alternativas": [
    {"letra": "A", "texto": "...", "correta": false},
    {"letra": "B", "texto": "...", "correta": true}
  ],
  "tipo": "objetiva | discursiva",
  "disciplina": "Física",
  "topico": "Mecânica",
  "conteudo": "Cinemática",
  "assunto": "Lançamento Oblíquo",
  "banca": "ENEM",
  "ano": 2024,
  "dificuldade": "facil | medio | dificil | nao_definida",
  "gabarito": "B (para objetiva) ou texto (para discursiva)",
  "tags": ["string"],
  "usedInExams": ["nome-da-prova-1"],
  "created_at": "ISO date"
}
```

## Workflow principal

1. `setup-projeto` → estrutura de pastas, Docker, nginx
2. `criar-banco-dados` → schema SQLite + endpoints REST + api-client.js
3. `criar-frontend` → componentes React (painel a painel)
4. `importar-questoes` → seed data de teste para desenvolvimento
5. `exportar-word` → gerar prova em .docx com formatação automática
