# ─────────────────────────────────────────────
#  latex2questbank — Dockerfile
#  Serve o conversor LaTeX → JSON na porta 8765
# ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Instala o pacote latex2questbank a partir do código local
COPY . /app

RUN pip install --no-cache-dir -e .

# Expõe na porta padrão
EXPOSE 8765

# Bind em 0.0.0.0 para ser acessível pelos outros serviços Docker
CMD ["python", "-m", "latex2questbank.server", "--host", "0.0.0.0", "--port", "8765"]
