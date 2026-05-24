# QuestBank — Como usar

Guia rápido de uso do app **depois** que ele já estiver no ar. Para colocar no ar pela primeira vez, veja [`HOMELAB-DEPLOY.md`](./HOMELAB-DEPLOY.md).

---

## Acessar o app

Depois de subir os containers com `docker compose up -d --build`, o app fica disponível em:

- **Na rede local:** `http://IP-DO-SERVIDOR:8080`
- **Via Tailscale (de qualquer lugar):** `http://IP-TAILSCALE-DO-SERVIDOR:8080`

Use Chrome, Edge ou Firefox. No celular funciona, mas o layout de 3 painéis é otimizado para tela grande (tablet ou computador).

---

## Importar questões

### Via JSON

1. Prepare um arquivo JSON no formato aceito (veja exemplos em `.agents/skills/importar-questoes/examples/` ou `saida/sample-data.json`)
2. Clique em **"Importar"** no header (atalho: `Ctrl + I`)
3. Arraste o arquivo `.json` ou clique para selecionar
4. O app valida e mostra quantas questões foram encontradas
5. Clique em **"Importar X questões"**

### Via LaTeX (`.zip`)

Se você prefere editar em LaTeX, o pacote opcional `questbank-server/` (Python) converte `.zip` LaTeX → JSON automaticamente. Veja `questbank-server/README.md` para instalar e usar localmente.

---

## Montar uma prova

1. Na **árvore de assuntos** (painel esquerdo), marque os assuntos desejados
   - Clique na seta para expandir; marque a caixa para incluir
   - Você pode **arrastar nós** entre disciplinas (atualiza em lote todas as questões)
   - Clique com botão direito em um nó para **renomear** (atualiza em lote)
   - `Ctrl + Z` desfaz a última operação de árvore
2. Use os **filtros** (painel central) para refinar: banca, ano, dificuldade, tipo, tags, etc.
3. Clique no botão **`+`** em cada questão para adicionar à prova (painel direito)
4. No painel direito, **arraste** para reordenar; use os botões para embaralhar ou ordenar por dificuldade
5. Clique em **"Gerar Prova"**
6. Preencha o nome da prova (obrigatório), professor e instituição
7. Escolha **Word (`.docx`)** ou **LaTeX (`.zip`)** e baixe
8. Se houver versões adaptadas, marque "Gerar prova adaptada" para baixar também a versão para alunos atípicos

---

## Criar questão manualmente

1. Clique em **"Nova Questão"** no header (atalho: `Ctrl + N`)
2. Preencha enunciado, alternativas (se objetiva), gabarito
3. Classifique: disciplina, tópico, conteúdo, assunto, banca, ano, dificuldade
4. (Opcional) Marque "Adicionar versão adaptada" para criar a versão para alunos atípicos no mesmo fluxo
5. Salve

---

## Editar / excluir questão

- Clique no card da questão para expandir → botões **Editar** e **Excluir** aparecem no rodapé
- Em lote: selecione várias questões (clicando no `+`) e use os botões do painel direito

---

## Estatísticas

Botão **Stats** no header abre o painel de estatísticas: distribuição por disciplina, dificuldade, banca e ano.

---

## Backup do banco de dados

### Via app (JSON)

- **Backup → Exportar banco:** baixa um `.questbank.json` com todas as questões e provas
- **Backup → Restaurar banco:** substitui dados existentes pelo conteúdo do arquivo

### Via Docker (volume bare-metal)

Para backups automáticos / restore rápido do volume SQLite, veja `HOMELAB-DEPLOY.md`.

---

## Atalhos de teclado

| Atalho | Ação |
|---|---|
| `Ctrl + F` | Focar o campo de busca |
| `Ctrl + N` | Nova questão |
| `Ctrl + I` | Importar questões |
| `Ctrl + Z` | Desfazer última operação de taxonomia (mover/renomear) |
| `Esc` | Fechar modal aberto |

---

## Dúvidas frequentes

**O app funciona offline?**
Não 100%. O frontend (React + assets) é cacheado pelo Service Worker e abre sem internet, mas as questões ficam no backend SQLite — então precisa de conexão com o servidor. Para uso "offline real", use Tailscale: o servidor fica acessível mesmo sem internet pública, desde que ambos os dispositivos estejam na mesma rede Tailscale.

**Posso usar no celular?**
Sim, mas a experiência é melhor em tela grande (computador ou tablet).

**Meus dados ficam seguros?**
Os dados ficam no servidor (homelab) — apenas você tem acesso via rede local ou Tailscale. **Faça backups regularmente** usando o botão Backup → Exportar banco.

**Como uso em mais de um computador?**
Como agora há servidor central, basta apontar todos os dispositivos para o mesmo `http://IP-DO-SERVIDOR:8080`. Sincronização automática.

**Onde fica o banco de dados?**
Num volume Docker chamado `questbank_questbank-data`. Por padrão em `/var/lib/docker/volumes/questbank_questbank-data/_data/questbank.db`.
