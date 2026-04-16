"""CLI: latex2questbank entrada.tex [-o saida.json]"""

from __future__ import annotations

import argparse
import json
import sys

from .parser import parse_tex_file, ParseError


def main(argv=None):
    p = argparse.ArgumentParser(description="Converte .tex QuestBank em .json")
    p.add_argument("input", help="Arquivo .tex de entrada")
    p.add_argument("-o", "--output", help="Arquivo .json de saída (padrão: stdout)")
    p.add_argument("--indent", type=int, default=2, help="Indentação do JSON")
    args = p.parse_args(argv)

    try:
        result = parse_tex_file(args.input)
    except ParseError as e:
        print(f"ERRO: {e}", file=sys.stderr)
        sys.exit(2)

    out = json.dumps(result, ensure_ascii=False, indent=args.indent)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"Escrito {args.output} ({len(result['questions'])} questões)", file=sys.stderr)
    else:
        print(out)


if __name__ == "__main__":
    main()
