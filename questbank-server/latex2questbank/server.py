"""HTTP server local para o app QuestBank.

Expõe POST /convert-tex com corpo de texto LaTeX e retorna JSON.
Responde OPTIONS com CORS para permitir uso do PWA.

Uso:
    python -m latex2questbank.server [--port 8765] [--host 127.0.0.1]

Segurança:
    - Bind padrão em 127.0.0.1 (loopback) — inacessível fora da máquina.
    - Sem persistência nem acesso a disco do usuário.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .parser import parse_tex, ParseError

DEFAULT_PORT = 8765
DEFAULT_HOST = "127.0.0.1"

logger = logging.getLogger("latex2questbank.server")


class _Handler(BaseHTTPRequestHandler):
    # ------------------------------------------------------------------
    # CORS helpers
    # ------------------------------------------------------------------
    def _set_cors(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "3600")

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._set_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ------------------------------------------------------------------
    # Handlers
    # ------------------------------------------------------------------
    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):  # noqa: N802
        if self.path == "/health" or self.path == "/":
            self._send_json(200, {"ok": True, "service": "latex2questbank", "version": "0.1.0"})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):  # noqa: N802
        if self.path != "/convert-tex":
            self._send_json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            self._send_json(400, {"error": "corpo vazio"})
            return
        raw = self.rfile.read(length)

        ctype = self.headers.get("Content-Type", "").lower()
        try:
            if "application/json" in ctype:
                data = json.loads(raw.decode("utf-8"))
                text = data.get("tex") or data.get("content") or ""
            else:
                text = raw.decode("utf-8")
        except Exception as e:
            self._send_json(400, {"error": f"payload inválido: {e}"})
            return

        if not text.strip():
            self._send_json(400, {"error": "campo 'tex' vazio"})
            return

        try:
            result = parse_tex(text)
        except ParseError as e:
            self._send_json(
                422,
                {
                    "error": str(e),
                    "line": e.line,
                    "questao_id": e.questao_id,
                },
            )
            return
        except Exception as e:
            logger.exception("erro inesperado")
            self._send_json(500, {"error": f"erro interno: {e}"})
            return

        self._send_json(200, result)

    def log_message(self, format, *args):  # noqa: A002
        logger.info("%s - %s", self.address_string(), format % args)


def run(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> None:
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s")
    server = ThreadingHTTPServer((host, port), _Handler)
    logger.info("latex2questbank rodando em http://%s:%d", host, port)
    logger.info("endpoints: GET /health  |  POST /convert-tex")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("encerrando…")
    finally:
        server.server_close()


def main(argv=None):
    p = argparse.ArgumentParser(description="Servidor local LaTeX → QuestBank JSON")
    p.add_argument("--host", default=DEFAULT_HOST, help="Host (padrão: 127.0.0.1)")
    p.add_argument("--port", type=int, default=DEFAULT_PORT, help="Porta (padrão: 8765)")
    args = p.parse_args(argv)
    run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
