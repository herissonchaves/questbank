# QuestBank — Banco de Questões Offline (Web App)

## Papel do agente

Você é o engenheiro full-stack responsável por construir o **QuestBank**, um web app SaaS offline-first de banco de questões para vestibulares brasileiros. Você cria código limpo, modular e funcional — sempre reutilizando scripts Python prontos quando disponíveis para economizar tokens.

## Contexto do projeto

O QuestBank é um app inspirado no Estuda.com e SuperProfessor, voltado para professores de ensino médio que precisam montar provas a partir de um banco de questões local. O app roda 100% offline no navegador (PWA), com dados em IndexedDB.

Layout de 3 painéis:
- **Painel esquerdo:** árvore hierárquica de assuntos (construída automaticamente a partir das questões importadas)
- **Painel central:** lista de questões com cards simplificados (expandíveis ao clicar)
- **Painel direito:** questões selecionadas para a prova (cards simplificados, expandíveis ao clicar)

## Importação de questões

O usuário importa questões **já no formato JSON aceito pelo app**. Não há conversão de PDF, imagem, HTML ou Word. O fluxo é:

1. Usuário prepara JSON no formato padronizado (via ferramenta externa, agente Antigravity em outro projeto, ou manualmente)
2. Usuário faz upload do JSON no app (botão "Importar questões")
3. O app valida o JSON, insere no IndexedDB e **atualiza a árvore de assuntos automaticamente**

## Taxonomia dinâmica

A árvore de assuntos **NÃO é pré-definida**. Ela é construída automaticamente a partir dos campos `disciplina > topico > conteudo > assunto` das questões existentes no banco. Quando o usuário importa questões com categorias novas, a árvore cresce. Quando todas as questões de uma categoria são removidas, o nó desaparece.

```javascript
// Pseudo-código da construção da árvore
const tree = {};
for (const q of allQuestions) {
  tree[q.disciplina] ??= {};
  tree[q.disciplina][q.topico] ??= {};
  tree[q.disciplina][q.topico][q.conteudo] ??= {};
  tree[q.disciplina][q.topico][q.conteudo][q.assunto] ??= 0;
  tree[q.disciplina][q.topico][q.conteudo][q.assunto]++;
}
```

## Stack tecnológica

- **Frontend:** React 18 (via CDN + Babel standalone — zero build step)
- **Banco de dados:** IndexedDB via Dexie.js (offline)
- **Exportação:** .docx via script Python (python-docx)
- **PWA:** Service Worker para funcionar 100% offline

## Regras globais

- **SEMPRE** rode `python3 script.py --help` antes de ler o código-fonte de qualquer script
- **NUNCA** reescreva lógica que já existe em um script Python — chame o script
- Idioma do código: inglês. Idioma da UI: português brasileiro
- Nomes de arquivos: kebab-case
- CSS: Tailwind utility classes (pré-definidas, sem compilador)

## Estrutura de pastas do app

```
questbank/
├── index.html              ← entry point PWA
├── app.jsx                 ← componente principal React
├── components/
│   ├── subject-tree.jsx    ← painel esquerdo (árvore dinâmica)
│   ├── question-list.jsx   ← painel central
│   ├── question-card.jsx   ← card simplificado/completo
│   ├── selected-panel.jsx  ← painel direito
│   ├── filter-bar.jsx      ← filtros avançados
│   ├── import-modal.jsx    ← modal de importação JSON
│   └── export-modal.jsx    ← modal de exportação Word
├── db/
│   ├── schema.js           ← schema IndexedDB (Dexie)
│   └── taxonomy.js         ← construção da árvore dinâmica
├── utils/
│   ├── export-handler.js   ← preparar JSON para export Word
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
  "id": "uuid",
  "codigo": "ENEM-2024-Q45",
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
  "fonte": "ENEM",
  "ano": 2024,
  "dificuldade": "facil | medio | dificil | nao_definida",
  "regiao": "Sudeste | Sul | Nordeste | Centro-oeste | Norte | Nacional",
  "tags": ["string"],
  "resolucao": "string (opcional)",
  "created_at": "ISO date"
}
```

## Workflow principal

1. `setup-projeto` → estrutura de pastas e PWA
2. `criar-banco-dados` → schema IndexedDB + taxonomia dinâmica
3. `criar-frontend` → componentes React (painel a painel)
4. `importar-questoes` → seed data de teste para desenvolvimento
5. `exportar-word` → gerar prova em .docx
