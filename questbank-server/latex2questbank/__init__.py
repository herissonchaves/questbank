"""latex2questbank — Converte arquivos .tex no formato QuestBank para JSON v1.0.

Exporta:
    parse_tex(text: str, base_dir: str | None = None) -> dict
        Converte string LaTeX → dicionário no schema QuestBank.

    parse_tex_file(path: str) -> dict
        Conveniência para ler arquivo e parsear.
"""

from .parser import parse_tex, parse_tex_file, ParseError

__all__ = ["parse_tex", "parse_tex_file", "ParseError"]
__version__ = "0.1.0"
