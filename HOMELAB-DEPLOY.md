# QuestBank — Deploy no Homelab

Guia completo para colocar o QuestBank no ar em um servidor próprio e acessá-lo de qualquer lugar via Tailscale.

---

## Arquitetura

```
[Seu navegador] ──── Tailscale VPN ────► [Servidor homelab]
                                               │
                                        nginx :8080 (frontend)
                                               │  proxy /api/
                                        Node.js :3000 (backend)
                                               │
                                        SQLite /data/questbank.db
                                        (volume Docker persistente)
```

---

## Parte 1 — Subir o QuestBank com Docker

### Pré-requisitos no servidor

- Docker Engine instalado
- Docker Compose (v2, embutido no Docker moderno)

**Instalar Docker no servidor (Ubuntu/Debian):**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # adiciona seu usuário ao grupo docker
# faça logout e login novamente para o grupo ter efeito
```

### Subir o app

```bash
# 1. Copie a pasta questbank para o servidor (exemplo com rsync)
rsync -av --exclude='.git' ~/questbank/ usuario@IP-DO-SERVIDOR:~/questbank/

# 2. No servidor, entre na pasta e suba os containers
ssh usuario@IP-DO-SERVIDOR
cd ~/questbank
docker compose up -d --build

# 3. Verifique que está rodando
docker compose ps
# Deve mostrar questbank-backend e questbank-frontend como "healthy"

# 4. Teste no próprio servidor
curl http://localhost:8080
```

O app estará acessível em **`http://IP-DO-SERVIDOR:8080`** de qualquer computador na rede local.

### Comandos do dia a dia

```bash
# Ver logs em tempo real
docker compose logs -f

# Atualizar depois de mudar arquivos
docker compose up -d --build

# Parar tudo
docker compose down

# Parar e apagar o banco (CUIDADO!)
docker compose down -v
```

### Backup do banco de dados

O banco SQLite fica em um Docker volume chamado `questbank_questbank-data`. Para fazer backup:

```bash
# Criar backup
docker run --rm \
  -v questbank_questbank-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/questbank-backup-$(date +%Y%m%d).tar.gz /data

# Restaurar backup
docker run --rm \
  -v questbank_questbank-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/questbank-backup-YYYYMMDD.tar.gz -C /
```

---

## Parte 2 — Tailscale: acesso de qualquer lugar

O Tailscale cria uma VPN peer-to-peer entre seus dispositivos. Você instala no servidor e nos seus outros computadores/celulares, e todos se enxergam como se estivessem na mesma rede local — sem abrir portas no roteador.

### Passo 1 — Criar conta

Acesse **[tailscale.com](https://tailscale.com)** e crie uma conta gratuita. O plano gratuito suporta até 100 dispositivos — mais do que suficiente para homelab pessoal.

### Passo 2 — Instalar no servidor

```bash
# Ubuntu / Debian
curl -fsSL https://tailscale.com/install.sh | sh

# Iniciar e autenticar (abrirá uma URL para login)
sudo tailscale up

# Verificar o IP Tailscale do servidor
tailscale ip -4
# Exemplo: 100.64.x.x
```

Anote o IP Tailscale (começa com `100.`). Este será o endereço permanente do seu servidor dentro da VPN — não muda mesmo que o IP local mude.

### Passo 3 — Instalar no seu computador

Baixe o Tailscale para seu sistema em **[tailscale.com/download](https://tailscale.com/download)**:

- **Windows / macOS:** instalador gráfico — faça login com a mesma conta
- **Linux:** `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`
- **Android / iOS:** app na loja, faça login com a mesma conta

### Passo 4 — Acessar o QuestBank de qualquer lugar

Depois de instalar o Tailscale em ambos os dispositivos:

```
http://100.64.x.x:8080
```

(substitua `100.64.x.x` pelo IP Tailscale do seu servidor)

Isso funciona de qualquer lugar — escritório, celular no 4G, viagem — sem precisar abrir portas no roteador.

### Dica: nome fixo com MagicDNS

O Tailscale tem um recurso chamado **MagicDNS** que dá um nome amigável para cada máquina. Ative em **[login.tailscale.com/admin/dns](https://login.tailscale.com/admin/dns)** e depois acesse por nome:

```
http://nome-do-servidor:8080
```

### Passo 5 — Tailscale como serviço no servidor (inicialização automática)

```bash
# Habilita o Tailscale para iniciar com o sistema
sudo systemctl enable --now tailscaled

# Confirma que está ativo
sudo systemctl status tailscaled
```

---

## Resumo rápido

| O que fazer | Comando / URL |
|---|---|
| Subir o app | `docker compose up -d --build` |
| Ver status | `docker compose ps` |
| Ver logs | `docker compose logs -f` |
| IP Tailscale | `tailscale ip -4` |
| Acessar o app | `http://<IP-TAILSCALE>:8080` |
| Painel Tailscale | https://login.tailscale.com/admin/machines |

---

## Solução de problemas

**Container não sobe:**
```bash
docker compose logs backend   # veja o erro do backend
docker compose logs frontend  # veja o erro do nginx
```

**Backend não aparece como healthy:**
- Verifique se a porta 3000 está livre internamente: `docker compose exec backend wget -qO- http://localhost:3000/api/health`

**Não consigo acessar pelo Tailscale:**
- Confirme que o Tailscale está ativo nos dois dispositivos: `tailscale status`
- Confirme que o app está rodando: `docker compose ps`
- Tente pingar o servidor: `ping 100.64.x.x`
