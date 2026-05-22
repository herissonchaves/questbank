# ─────────────────────────────────────────────
#  QuestBank — Dockerfile
#  Imagem: nginx:alpine (leve, ~25 MB)
#  Serve a aplicação estática na porta 80
# ─────────────────────────────────────────────
FROM nginx:alpine

# Copia a configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia todos os arquivos da aplicação
COPY index.html       /usr/share/nginx/html/
COPY app.jsx          /usr/share/nginx/html/
COPY manifest.json    /usr/share/nginx/html/
COPY sw.js            /usr/share/nginx/html/
COPY db/              /usr/share/nginx/html/db/
# (api-client.js já está dentro de db/ — copiado acima)
COPY components/      /usr/share/nginx/html/components/
COPY utils/           /usr/share/nginx/html/utils/

# Porta exposta
EXPOSE 80

# nginx já é o CMD padrão da imagem oficial
