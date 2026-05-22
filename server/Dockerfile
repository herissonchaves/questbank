# QuestBank — Backend Dockerfile
# Node.js LTS Alpine (leve, ~170 MB com dependências)

FROM node:20-alpine

# better-sqlite3 compila código nativo — precisa de build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia package.json primeiro (camada de cache)
COPY package.json ./
RUN npm install --omit=dev

# Copia o servidor
COPY server.js ./

# Diretório de dados (será sobrescrito pelo volume do compose)
RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]
