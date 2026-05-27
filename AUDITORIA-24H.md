# QuestBank — Auditoria para operação 24/7 em container

> Diagnóstico do estado atual e plano de refatoração focado em estabilidade, segurança e eficiência ao rodar o stack `docker compose` ininterruptamente em um servidor (homelab).

## Veredicto geral

O projeto **está funcional e bem estruturado** para o caso de uso pessoal/homelab via Tailscale. Arquitetura cliente-servidor limpa, separação clara de responsabilidades, Service Worker, WAL mode ativo no SQLite, healthchecks no compose. Subir e usar funciona.

Para rodar **24h por dia em produção**, porém, existem ~10 gaps que vão eventualmente morder você: derrubam o container sem log, deixam o disco encher, abrem janela para corromper o banco no restart, ou degradam silenciosamente a performance. Nenhum é blocker pra começar a rodar — mas dá pra fechar quase todos em uma tarde.

## O que está bom

A base é sólida: backend pequeno e legível (237 linhas), endpoints REST bem nomeados, transações em SQL para operações bulk (`bulk`, `bulk-patch`, `bulk-delete`) evitando N+1, WAL e `foreign_keys` habilitados, frontend modularizado em ~14 componentes, proxy reverso correto no nginx, gzip ligado, `server_tokens off`, restart `unless-stopped`, healthchecks nos dois serviços, volume nomeado persistente, `.dockerignore` separando frontend e backend, e Service Worker funcional com versionamento por hash.

## Problemas críticos para 24/7

### 1. Backend não tem graceful shutdown
`server/server.js` chama `app.listen()` e termina. Quando o Docker manda `SIGTERM` (a cada `docker compose restart`, `up -d --build`, deploy etc.), o Node morre sem fechar a conexão SQLite. Com WAL ativo isso geralmente sobrevive, mas em transações grandes (uma importação bulk de 5000 questões interrompida na hora errada) é exatamente a receita para um `.db-wal` órfão ou checkpoint pela metade.

**Fix:** capturar `SIGTERM`/`SIGINT`, parar de aceitar requisições, esperar inflight terminar e chamar `db.close()`.

### 2. Sem `uncaughtException` / `unhandledRejection`
Uma promise rejeitada num handler async que você esqueceu de envolver em try/catch já derruba o processo. O Docker reinicia (porque `restart: unless-stopped`), mas você perde o log do que aconteceu. Em 24/7 esses crashes silenciosos viram um mistério.

**Fix:** registrar handlers globais que logam e depois saem (deixar o Docker reiniciar é OK — `process.exit(1)` após logar).

### 3. Sem error handler global do Express
Toda rota repete um `try/catch` quase idêntico. Funciona, mas se você esquecer um a exceção sobe sem padrão de resposta. Um middleware `(err, req, res, next) => …` no fim limpa isso e garante resposta JSON consistente.

### 4. Logs do Docker sem rotação
Não há `logging.driver: json-file` com `max-size`/`max-file` no `docker-compose.yml`. Em servidor 24/7, o JSON de log do container cresce indefinidamente e em meses pode comer GB do disco do host.

**Fix:** adicionar em cada serviço:
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

### 5. Sem limites de memória/CPU
Nenhum dos serviços tem `mem_limit` / `cpus`. Um leak no Node, uma importação base64 mal formatada que estoura `express.json({ limit: '50mb' })`, ou um bug no SW que faz `fetch` em loop pode comer toda a RAM do host. Pra homelab é especialmente ruim porque outros serviços do servidor caem junto.

**Fix:**
```yaml
backend:
  mem_limit: 512m
  cpus: 1.0
frontend:
  mem_limit: 256m
  cpus: 0.5
```

### 6. SQLite sem `busy_timeout` nem `synchronous = NORMAL`
Você já ativa `journal_mode = WAL` (ótimo), mas a configuração canônica de WAL inclui `PRAGMA synchronous = NORMAL` (drasticamente mais rápido em escrita sem perder durabilidade prática) e `PRAGMA busy_timeout = 5000` (evita `SQLITE_BUSY` em rajadas — improvável aqui porque `better-sqlite3` é síncrono, mas é cinto de segurança).

### 7. Backup é manual
`HOMELAB-DEPLOY.md` ensina o comando `tar` mas não há cron/timer agendado. Em 24/7 isso significa que o backup vai ser feito "quando eu lembrar" — e a Lei de Murphy garante que o disco vai morrer 3 dias depois do último backup. Sugestão: um container `offen/docker-volume-backup` ou um simples `crontab` no host disparando o `tar` para uma pasta que sincronize com cloud.

## Problemas importantes (não-críticos)

### 8. Container roda como root
`Dockerfile` (frontend) e `server/Dockerfile` não criam usuário não-privilegiado. Se um dia alguém escapar do nginx ou do Node, terá root no container. Adicionar `USER node` no backend e `USER nginx` no frontend é trivial.

### 9. Imagem do backend tem `python3 make g++` no runtime
Você instala build tools para compilar `better-sqlite3` mas eles ficam na imagem final. Multi-stage build (estágio "builder" com toolchain + estágio "runtime" só com `node_modules` compilados) corta ~120 MB e reduz superfície de ataque.

### 10. Sem rate limiting
Tailscale limita o acesso à sua rede, mas se você compartilhar com colegas, um colega bem-intencionado com loop infinito de import pode martelar o servidor. `express-rate-limit` resolve em 3 linhas.

### 11. CORS `*` global
Como tudo passa pelo nginx interno (`proxy_pass http://backend:3000`), o backend nem precisa de CORS — o `cors()` aberto é um vestígio. Removendo, fecha uma porta lateral.

### 12. Sem `init: true` (ou `tini`)
Node como PID 1 não faz reaping de processos zumbis. `better-sqlite3` não faz fork, mas é higiene básica para containers Node. Adicionar `init: true` em cada serviço.

### 13. `GET /api/questions` envia tudo a cada chamada
A interface `api-client.js` tem um cache global mutável (`_questionsCache`) que é invalidado a **cada** mutação. Resultado: toda edição/criação/exclusão dispara um GET completo do banco. Com 10k questões com imagens base64, isso é dezenas de MB indo e voltando. Soluções, em ordem de esforço:

- Adicionar `ETag` no `GET /api/questions` (o `better-sqlite3` retorna em milissegundos; gerar hash do payload é barato e o cliente envia `If-None-Match` → 304).
- Adicionar middleware `compression` (gzip no Express; o nginx já gzipa, mas só faz sentido se você expor o backend direto).
- A médio prazo: paginação real e/ou filtros no servidor (extrair `banca`, `ano`, `disciplina` para colunas indexadas e parar de armazenar tudo como TEXT JSON).

### 14. Schema "JSON-blob" no SQLite
`questions(id TEXT PRIMARY KEY, data TEXT)` armazena a questão inteira como JSON serializado. Funciona para ≤10k linhas porque o frontend filtra na memória, mas você perde toda a capacidade de query do SQLite. Refatorar para colunas (`disciplina`, `banca`, `ano`, `dificuldade`, `tipo`) + JSON apenas para o conteúdo livre permitiria índices e filtros server-side. Não é urgente, mas é a próxima evolução natural.

### 15. Sem índice em `exams.created_at`
`SELECT … ORDER BY created_at DESC` faz table scan. Com algumas centenas de provas isso é instantâneo; com milhares começa a doer. `CREATE INDEX idx_exams_created ON exams(created_at DESC)` resolve.

## Frontend — observações

Aqui o conjunto não é crítico para 24/7 (afinal o servidor só serve estáticos), mas vale registrar:

**Babel Standalone no browser** transpila ~9000 linhas de JSX a cada page load. Funciona, mas o boot do app fica notavelmente mais lento que com bundle pré-compilado. Migrar para um build esbuild/vite (1 comando, 200ms de build) elimina o Babel CDN inteiro e permite usar import maps de verdade. Como você está em homelab pessoal e só você usa, isso é puramente cosmético — mas se quiser apertar, é o maior ganho percebido.

**Tailwind Play CDN** + **MathJax** + **KaTeX** + **docx.js** + **JSZip** vêm todos via CDN externo. O Service Worker cacheia depois da primeira visita, então é OK — só lembre que sem internet a primeira visita falha. Para um app que existe "para rodar no homelab", talvez valha colocar esses assets na imagem nginx (vendoring).

**`app.jsx` com 1500 linhas** é a parte mais difícil de manter. Tem um único `reducer` gigante, mas a lógica está separada em casos — não é spaghetti, só está crescendo. Quando precisar mexer, vale extrair os modais e os subreducers.

## Plano de refatoração — o que eu faria em ordem

A ordem é por relação custo/benefício; cada item é pequeno e independente, dá pra parar em qualquer ponto.

**Primeiro pacote (30 min, valor enorme para 24/7):**
1. Adicionar graceful shutdown + handlers globais em `server.js`
2. Adicionar log rotation no `docker-compose.yml`
3. Adicionar `mem_limit` e `cpus` no `docker-compose.yml`
4. Adicionar `PRAGMA synchronous = NORMAL` e `busy_timeout = 5000` em `server.js`

**Segundo pacote (1 hora, qualidade de produção):**
5. Multi-stage build no `server/Dockerfile` + `USER node`
6. `init: true` em ambos os serviços
7. Middleware de erro global no Express
8. `compression` no Express + `ETag` no `GET /api/questions`
9. Rate limit com `express-rate-limit`
10. Índice em `exams.created_at`

**Terceiro pacote (backup, ~30 min):**
11. Container de backup automático (`offen/docker-volume-backup` ou cron no host) com retenção 7 dias

**Eventualmente, quando precisar escalar:**
12. Schema relacional para `questions` (índices em banca/ano/disciplina) + filtros server-side
13. Build do frontend com esbuild ou Vite
14. Auth (mesmo que `basic_auth` no nginx)

## Resposta direta

**Está tudo OK com o projeto?** Sim, para o uso atual. Não há bug evidente nem decisão arquitetural que precise ser desfeita.

**Precisa de refatoração?** Não obrigatória, mas **altamente recomendada**. Os 4 itens do "primeiro pacote" são o mínimo que eu não rodaria 24/7 sem — são todos baixo risco, alto retorno, e dão sleep peace.

Se quiser, posso aplicar o primeiro pacote agora — são edições pontuais em `server/server.js` e `docker-compose.yml` que não mudam comportamento, só endurecem o stack.
