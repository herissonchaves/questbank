# QuestBank — Banco de Questões

Web app para professores montarem provas a partir de um banco de questões de vestibulares. Inspirado no Estuda.com e SuperProfessor. Arquitetura cliente-servidor (homelab): frontend React + backend Node/SQLite, tudo orquestrado por Docker Compose.

> Como subir no servidor? Veja [`HOMELAB-DEPLOY.md`](./HOMELAB-DEPLOY.md).
> Como usar depois de no ar? Veja [`COMO-USAR.md`](./COMO-USAR.md).

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Questões objetivas e discursivas | Suporte aos dois tipos principais |
| Versões adaptadas (NEE/AEE) | Cada questão pode ter uma versão adaptada pareada por ID (`12345` ↔ `A12345`) |
| Importação via JSON | Upload de arquivo JSON validado; o app formata e insere automaticamente |
| Importação via LaTeX | Pacote opcional `questbank-server` converte `.zip` LaTeX → JSON |
| Árvore de assuntos dinâmica | Hierarquia disciplina → tópico → conteúdo → assunto, construída das questões importadas |
| Drag & drop na taxonomia | Mover ou renomear nós da árvore aplica em lote a todas as questões (com Ctrl+Z para desfazer) |
| Filtros avançados | Busca por texto, banca, ano, dificuldade, tipo, região, tag, código e lote de importação |
| Ignorar questões já usadas | Checkbox que remove da busca questões que já foram usadas em provas |
| Tags de uso | Cada questão exibe badges amarelos com o nome das provas em que foi utilizada |
| Embaralhar alternativas | Embaralha automaticamente as alternativas das questões objetivas selecionadas, ajustando o gabarito |
| Edição em lote de tags | Adicionar, remover ou substituir tags em várias questões de uma vez |
| Estatísticas | Painel com gráficos por disciplina, dificuldade, banca e ano |
| Exportação Word (.docx) | Gera prova formatada com enumeração automática, linhas para discursivas e gabarito |
| Exportação LaTeX (.zip) | Mesma prova em LaTeX, com imagens e fórmulas |
| Histórico de provas | Menu com todas as provas salvas, opção de re-download e exclusão |
| Backup offline | Exporta/importa o banco completo em `.questbank.json` |
| Service Worker (PWA) | Cache de assets do frontend; o backend continua sendo obrigatório |

---

## Arquitetura

```
[Navegador]
   │
   ▼
[ nginx :8080 ]  ── serve index.html + JSX + assets (frontend estático)
   │
   │  proxy_pass /api/ →
   ▼
[ Node.js :3000 ]  ── Express REST API
   │
   ▼
[ SQLite /data/questbank.db ]  ── volume Docker persistente
```

Tudo roda em containers via `docker-compose.yml`. Acesso remoto via Tailscale (recomendado) — sem precisar abrir portas no roteador.

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
        { "letra": "C", "texto": "Texto da alternativa C" }
      ],
      "regiao": "Nacional",
      "tags": ["vestibular", "cinemática"]
    }
  ]
}
```

### Campos obrigatórios

`enunciado`, `tipo`, `disciplina`, `topico`, `conteudo`, `assunto`, `dificuldade`

### Campos opcionais

`id`, `banca`, `ano`, `gabarito`, `alternativas`, `imagens`, `resolucao_link`, `regiao`, `tags`

### Valores aceitos

| Campo | Valores válidos |
|---|---|
| `tipo` | `objetiva` · `discursiva` |
| `dificuldade` | `facil` · `medio` · `dificil` · `nao_definida` |

---

## Stack tecnológica

### Frontend (estático, servido por nginx)

| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 (CDN) | Interface de usuário |
| Babel Standalone | 7 (CDN) | Transpila JSX no browser |
| Tailwind CSS | Play CDN | Estilização |
| docx.js | 8.5 (CDN) | Geração de .docx no browser |
| FileSaver.js | 2.0 (CDN) | Download automático de arquivos |
| JSZip | 3.10 (CDN) | Empacotamento de arquivos `.zip` |
| KaTeX | 0.16 (CDN) | Renderização de fórmulas matemáticas |
| MathJax | 3 (CDN) | Conversão de fórmulas para imagem no .docx |
| Service Worker | — | Cache de assets do frontend |

### Backend (Node.js)

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 20 (Alpine) | Runtime |
| Express | 4.18 | Servidor HTTP |
| better-sqlite3 | 9.4 | Banco de dados |
| cors | 2.8 | CORS |

### Deploy

| Tecnologia | Função |
|---|---|
| nginx (Alpine) | Servidor web + proxy reverso para /api/ |
| Docker Compose | Orquestração dos containers |
| Tailscale | VPN para acesso remoto |

> Zero build step no frontend. Os arquivos `.jsx` são transpilados pelo Babel direto no browser.

---

## Estrutura de arquivos

```
questbank/
├── AGENT.md                    ← Instruções do agente Antigravity
├── README.md                   ← Este arquivo
├── COMO-USAR.md                ← Guia de uso do app
├── HOMELAB-DEPLOY.md           ← Guia de deploy Docker + Tailscale
│
├── docker-compose.yml          ← Orquestração (frontend + backend)
├── Dockerfile                  ← Imagem do frontend (nginx)
├── nginx.conf                  ← Config nginx + proxy /api/
├── .dockerignore               ← Exclui arquivos do build
│
├── index.html                  ← Entry point (carrega todas as dependências)
├── app.jsx                     ← Componente principal (useReducer, 3 painéis)
├── manifest.json               ← PWA manifest
├── sw.js                       ← Service Worker (cache de assets)
│
├── components/
│   ├── subject-tree.jsx           ← Painel esquerdo: árvore + drag & drop + rename
│   ├── filter-bar.jsx             ← Filtros básicos + avançados
│   ├── question-list.jsx          ← Painel central: lista paginada
│   ├── question-card.jsx          ← Card com carrossel Regular/Adaptada
│   ├── selected-panel.jsx         ← Painel direito: drag & drop
│   ├── import-modal.jsx           ← Upload JSON/ZIP com validação
│   ├── export-modal.jsx           ← Configura prova e gera .docx/.zip
│   ├── exams-panel.jsx            ← Histórico de provas salvas
│   ├── stats-panel.jsx            ← Estatísticas
│   ├── create-question-modal.jsx  ← Criar questão + versão adaptada
│   ├── edit-question-modal.jsx    ← Editar questão
│   ├── visual-editor.jsx          ← Editor WYSIWYG
│   ├── rich-text-toolbar.jsx      ← Toolbar (equação, imagem)
│   └── bulk-edit-tags-modal.jsx   ← Editar tags em lote
│
├── db/
│   ├── api-client.js              ← Cliente fetch — interface drop-in tipo Dexie
│   ├── schema.js                  ← Cores e labels (disciplina, dificuldade)
│   └── taxonomy.js                ← Construção da árvore hierárquica
│
├── utils/
│   ├── import-handler.js          ← Valida e envia JSON ao backend
│   ├── export-handler.js          ← Backup/restauração do banco
│   ├── export-engines.js          ← Motores de geração .docx e .zip LaTeX
│   ├── latex-to-docx-math.js      ← LaTeX math → docx
│   └── html-sanitizer.js          ← Sanitiza HTML de Word/Office
│
├── server/                     ← Backend Node.js
│   ├── Dockerfile
│   ├── package.json
│   └── server.js                  ← API REST (Express + SQLite)
│
├── questbank-server/           ← (Opcional) conversor LaTeX → JSON em Python
├── saida/                      ← Dados de exemplo
└── .agents/                    ← Skills do Antigravity (não vai pra imagem)
```

---

## API REST (backend)

Todas as rotas têm prefixo `/api`. O nginx faz `proxy_pass` para o container backend.

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
| `GET` | `/api/exams` | Lista provas (mais recentes primeiro) |
| `POST` | `/api/exams` | Salva uma prova no histórico |
| `DELETE` | `/api/exams/:id` | Exclui uma prova |

### Schema SQLite

```
questions   ( id TEXT PRIMARY KEY, data TEXT )
exams       ( id INTEGER PK, created_at TEXT, data TEXT )
```

O campo `data` armazena a questão/prova inteira em JSON. Filtros e taxonomia rodam no frontend depois de carregar tudo (volume típico ≤ 10k questões — rápido o bastante na rede local).
