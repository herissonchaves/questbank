"""Parser LaTeX → QuestBank JSON.

Template suportado:
    \\begin{questao}{ID}
      \\meta{campo}{valor}
      ...
      \\enunciado{ ... }
      \\begin{alternativas}
        \\alt{A}{texto}
        ...
      \\end{alternativas}
      \\gabarito{...}
      \\imagem{caminho}
      \\resolucao{url}
    \\end{questao}

Regras principais:
- Fórmulas $...$ e $$...$$ são preservadas (KaTeX/MathJax renderiza no app).
- Parágrafos (linhas em branco) → <p>...</p>.
- \\textbf, \\textit, \\textsuperscript, \\textsubscript → HTML equivalente.
- tabular simples → <table>.
- \\imagem{...} → <p>[IMAGEM]</p> + entrada em imagens.
- \\_\\_\\_\\_ → ____ (linhas de resposta em discursivas).
- Comentários LaTeX (%...) ignorados exceto quando escapados (\\%).
"""

from __future__ import annotations

import datetime as _dt
import html
import os
import re
from typing import Any, Dict, List, Optional, Tuple


class ParseError(Exception):
    """Erro de parsing com contexto de linha e questão."""

    def __init__(self, message: str, line: Optional[int] = None, questao_id: Optional[str] = None):
        self.line = line
        self.questao_id = questao_id
        prefix_parts = []
        if questao_id:
            prefix_parts.append(f"questão {questao_id}")
        if line is not None:
            prefix_parts.append(f"linha {line}")
        prefix = f"[{' / '.join(prefix_parts)}] " if prefix_parts else ""
        super().__init__(prefix + message)


# ---------------------------------------------------------------------------
# Pré-processamento
# ---------------------------------------------------------------------------


def _strip_comments(text: str) -> str:
    """Remove comentários LaTeX (% até fim da linha) preservando \\%."""
    out_lines = []
    for line in text.splitlines():
        i = 0
        out = []
        while i < len(line):
            ch = line[i]
            if ch == "\\" and i + 1 < len(line) and line[i + 1] == "%":
                out.append("%")  # preserva %
                i += 2
                continue
            if ch == "%":
                break
            out.append(ch)
            i += 1
        out_lines.append("".join(out).rstrip())
    return "\n".join(out_lines)


# ---------------------------------------------------------------------------
# Utilitários de parsing com chaves balanceadas
# ---------------------------------------------------------------------------


def _read_braced(text: str, start: int) -> Tuple[str, int]:
    """Lê um grupo { ... } a partir de `start` (que deve apontar para '{').

    Respeita aninhamento e ignora chaves dentro de $...$ e $$...$$.
    Retorna (conteúdo_sem_chaves_externas, posição_após_fechar).
    """
    if start >= len(text) or text[start] != "{":
        raise ParseError(f"Esperava '{{' na posição {start}, achei {text[start:start+20]!r}")
    depth = 0
    i = start
    in_dollar = 0  # 0=fora, 1=$, 2=$$
    while i < len(text):
        ch = text[i]
        # escape \{ e \}
        if ch == "\\" and i + 1 < len(text) and text[i + 1] in "{}$%":
            i += 2
            continue
        # contexto math
        if in_dollar == 0 and ch == "$":
            if i + 1 < len(text) and text[i + 1] == "$":
                in_dollar = 2
                i += 2
                continue
            in_dollar = 1
            i += 1
            continue
        if in_dollar == 1 and ch == "$":
            in_dollar = 0
            i += 1
            continue
        if in_dollar == 2 and ch == "$" and i + 1 < len(text) and text[i + 1] == "$":
            in_dollar = 0
            i += 2
            continue
        if in_dollar == 0:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start + 1 : i], i + 1
        i += 1
    raise ParseError("Chave '{' sem fechamento correspondente")


def _skip_ws(text: str, i: int) -> int:
    while i < len(text) and text[i] in " \t\r\n":
        i += 1
    return i


def _line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


# ---------------------------------------------------------------------------
# Split em blocos de questão
# ---------------------------------------------------------------------------

_QUESTAO_BEGIN_RE = re.compile(r"\\begin\{questao\}")
_QUESTAO_END_RE = re.compile(r"\\end\{questao\}")


def _split_questoes(text: str) -> List[Tuple[str, int, str]]:
    """Retorna lista de (id, linha_inicio, corpo_do_bloco)."""
    blocks = []
    pos = 0
    auto_counter = 0
    last_regular_auto_id = None
    while True:
        m = _QUESTAO_BEGIN_RE.search(text, pos)
        if not m:
            break
        begin_start = m.start()
        begin_end = m.end()
        line_begin = _line_of(text, begin_start)
        # lê {ID}
        i = _skip_ws(text, begin_end)
        if i >= len(text) or text[i] != "{":
            raise ParseError("\\begin{questao} deve ser seguido de {ID}", line=line_begin)
        qid, after_id = _read_braced(text, i)
        qid = qid.strip()
        if not qid:
            # ID vazio é permitido — o QuestBank atribui automaticamente na importação
            auto_counter += 1
            qid = f"auto-{auto_counter}"
            last_regular_auto_id = qid
        elif qid in ("A-", "A"):
            # Questão adaptada (NEE) vinculada à questão regular anterior
            if last_regular_auto_id:
                qid = f"A{last_regular_auto_id}"
            else:
                auto_counter += 1
                qid = f"Aauto-{auto_counter}"
        else:
            last_regular_auto_id = None
        # procura \end{questao}
        m_end = _QUESTAO_END_RE.search(text, after_id)
        if not m_end:
            raise ParseError(f"\\begin{{questao}}{{{qid}}} sem \\end{{questao}}", line=line_begin, questao_id=qid)
        body = text[after_id : m_end.start()]
        blocks.append((qid, line_begin, body))
        pos = m_end.end()
    return blocks


# ---------------------------------------------------------------------------
# Parsing dentro do bloco de questão
# ---------------------------------------------------------------------------

_META_RE = re.compile(r"\\meta\b")
_ENUNCIADO_RE = re.compile(r"\\enunciado\b")
_GABARITO_RE = re.compile(r"\\gabarito\b")
_RESOLUCAO_RE = re.compile(r"\\resolucao\b")
_ALT_BEGIN_RE = re.compile(r"\\begin\{alternativas\}")
_ALT_END_RE = re.compile(r"\\end\{alternativas\}")
_ALT_ITEM_RE = re.compile(r"\\alt\b")


def _parse_questao_block(qid: str, body: str, base_line: int) -> Dict[str, Any]:
    """Converte o corpo entre \\begin{questao}{id}...\\end{questao} em dict."""
    meta: Dict[str, str] = {}
    enunciado_raw: Optional[str] = None
    alternativas: List[Dict[str, str]] = []
    gabarito: Optional[str] = None
    resolucao: Optional[str] = None

    i = 0
    while i < len(body):
        i = _skip_ws(body, i)
        if i >= len(body):
            break

        # \meta{campo}{valor}
        m = _META_RE.match(body, i)
        if m:
            j = _skip_ws(body, m.end())
            campo, j = _read_braced(body, j)
            j = _skip_ws(body, j)
            valor, j = _read_braced(body, j)
            meta[campo.strip()] = valor.strip()
            i = j
            continue

        # \enunciado{...}
        m = _ENUNCIADO_RE.match(body, i)
        if m:
            j = _skip_ws(body, m.end())
            enun, j = _read_braced(body, j)
            enunciado_raw = enun
            i = j
            continue

        # \begin{alternativas} ... \end{alternativas}
        m = _ALT_BEGIN_RE.match(body, i)
        if m:
            end_m = _ALT_END_RE.search(body, m.end())
            if not end_m:
                raise ParseError(
                    "\\begin{alternativas} sem \\end{alternativas}",
                    line=base_line + body.count("\n", 0, i),
                    questao_id=qid,
                )
            alt_block = body[m.end() : end_m.start()]
            alternativas = _parse_alternativas(alt_block, qid, base_line + body.count("\n", 0, m.end()))
            i = end_m.end()
            continue

        # \gabarito{...}
        m = _GABARITO_RE.match(body, i)
        if m:
            j = _skip_ws(body, m.end())
            gab, j = _read_braced(body, j)
            gabarito = gab.strip()
            i = j
            continue

        # \resolucao{...}
        m = _RESOLUCAO_RE.match(body, i)
        if m:
            j = _skip_ws(body, m.end())
            res, j = _read_braced(body, j)
            resolucao = res.strip()
            i = j
            continue

        # \imagem fora do enunciado é inválido — orienta o usuário
        if body.startswith("\\imagem", i):
            raise ParseError(
                "\\imagem deve aparecer dentro de \\enunciado{} ou \\alt{}",
                line=base_line + body.count("\n", 0, i),
                questao_id=qid,
            )

        # caractere desconhecido ou texto solto — pula com aviso silencioso
        # (aceita espaços entre macros, mas texto solto fora das macros é ignorado)
        i += 1

    if enunciado_raw is None:
        raise ParseError("\\enunciado{} obrigatório", questao_id=qid)

    # Metadados
    tipo = meta.get("tipo") or ("objetiva" if alternativas else "discursiva")
    tipo = tipo.lower().strip()
    if tipo not in ("objetiva", "discursiva"):
        raise ParseError(f"tipo inválido: {tipo!r} (use 'objetiva' ou 'discursiva')", questao_id=qid)

    if tipo == "objetiva" and not alternativas:
        raise ParseError("tipo 'objetiva' requer bloco \\begin{alternativas}", questao_id=qid)

    dificuldade = meta.get("dificuldade", "medio").lower().strip() or "medio"
    if dificuldade not in ("facil", "medio", "dificil", "nao_definida"):
        raise ParseError(
            f"dificuldade inválida: {dificuldade!r} (use facil/medio/dificil)",
            questao_id=qid,
        )

    banca = meta.get("banca", "").strip() or "Desconhecida"
    ano_raw = meta.get("ano", "").strip()
    try:
        ano = int(ano_raw) if ano_raw else 0
    except ValueError:
        raise ParseError(f"ano inválido: {ano_raw!r}", questao_id=qid)

    # Tags
    tags_raw = meta.get("tags", "").strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []

    # Converte enunciado e alternativas para HTML, extraindo imagens
    imagens: List[Dict[str, str]] = []
    enunciado_html = _latex_body_to_html(enunciado_raw, imagens, banca=banca, ano=ano)
    alternativas_html: List[Dict[str, str]] = []
    for alt in alternativas:
        alt_imgs: List[Dict[str, str]] = []
        alt_html = _latex_body_to_html(alt["texto"], alt_imgs, inline=True)
        imagens.extend(alt_imgs)
        alternativas_html.append({"letra": alt["letra"], "texto": alt_html})

    # Validação gabarito em objetiva
    if tipo == "objetiva" and gabarito:
        letras = {a["letra"] for a in alternativas_html}
        if gabarito not in letras:
            raise ParseError(
                f"gabarito {gabarito!r} não corresponde a nenhuma alternativa ({sorted(letras)})",
                questao_id=qid,
            )

    result = {
        "id": qid,
        "enunciado": enunciado_html,
        "tipo": tipo,
        "disciplina": meta.get("disciplina", "").strip(),
        "topico": meta.get("topico", "").strip(),
        "conteudo": meta.get("conteudo", "").strip(),
        "assunto": meta.get("assunto", "").strip(),
        "banca": banca,
        "ano": ano,
        "dificuldade": dificuldade,
        "gabarito": gabarito or "",
        "alternativas": alternativas_html if tipo == "objetiva" else [],
        "imagens": imagens,
        "resolucao_link": resolucao or "",
        "tags": tags,
        "usedInExams": [],
        "created_at": _dt.datetime.now(_dt.timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    return result


def _parse_alternativas(block: str, qid: str, base_line: int) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    i = 0
    while i < len(block):
        i = _skip_ws(block, i)
        if i >= len(block):
            break
        m = _ALT_ITEM_RE.match(block, i)
        if not m:
            # ignora texto/espaço entre itens
            i += 1
            continue
        j = _skip_ws(block, m.end())
        letra, j = _read_braced(block, j)
        j = _skip_ws(block, j)
        texto, j = _read_braced(block, j)
        items.append({"letra": letra.strip().upper(), "texto": texto})
        i = j
    return items


# ---------------------------------------------------------------------------
# Conversão LaTeX → HTML
# ---------------------------------------------------------------------------


# Macros de inline simples (substituição direta, sem argumento)
_INLINE_TOKEN_SUBS = [
    (r"\\&", "&amp;"),
    (r"\\%", "%"),
    (r"\\_", "_"),
    (r"\\#", "#"),
    (r"\\ ", " "),
    (r"~", "&nbsp;"),
    (r"---", "—"),
    (r"--", "–"),
    (r"``", "&ldquo;"),
    (r"''", "&rdquo;"),
]


# Macros com UM argumento {arg} → wrapper HTML
_ONE_ARG_MACROS = {
    "textbf": ("<strong>", "</strong>"),
    "textit": ("<em>", "</em>"),
    "emph": ("<em>", "</em>"),
    "underline": ("<u>", "</u>"),
    "textsuperscript": ("<sup>", "</sup>"),
    "textsubscript": ("<sub>", "</sub>"),
}


def _extract_math_placeholders(text: str) -> Tuple[str, List[str]]:
    """Substitui $...$ e $$...$$ por tokens opacos; retorna (texto, lista_originais)."""
    chunks: List[str] = []
    out = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "\\" and i + 1 < len(text) and text[i + 1] == "$":
            out.append("\\$")
            i += 2
            continue
        if ch == "$":
            # $$...$$ ou $...$
            if i + 1 < len(text) and text[i + 1] == "$":
                end = text.find("$$", i + 2)
                if end == -1:
                    raise ParseError("$$ sem fechamento correspondente")
                math = text[i : end + 2]
                token = f"\x00M{len(chunks)}\x00"
                chunks.append(math)
                out.append(token)
                i = end + 2
                continue
            else:
                end = i + 1
                while end < len(text):
                    if text[end] == "\\" and end + 1 < len(text) and text[end + 1] == "$":
                        end += 2
                        continue
                    if text[end] == "$":
                        break
                    end += 1
                if end >= len(text) or text[end] != "$":
                    raise ParseError("$ sem fechamento correspondente")
                math = text[i : end + 1]
                token = f"\x00M{len(chunks)}\x00"
                chunks.append(math)
                out.append(token)
                i = end + 1
                continue
        out.append(ch)
        i += 1
    return "".join(out), chunks


def _restore_math(text: str, chunks: List[str]) -> str:
    def repl(m):
        idx = int(m.group(1))
        return chunks[idx]

    return re.sub(r"\x00M(\d+)\x00", repl, text)


def _process_macro_imagem(text: str, imagens: List[Dict[str, str]]) -> str:
    """Substitui \\imagem{caminho} por marcador HTML e adiciona à lista."""
    out = []
    i = 0
    while i < len(text):
        if text.startswith("\\imagem", i):
            j = _skip_ws(text, i + len("\\imagem"))
            if j < len(text) and text[j] == "{":
                caminho, after = _read_braced(text, j)
                imagens.append({"arquivo": caminho.strip()})
                out.append("\x01IMG\x01")
                i = after
                continue
        out.append(text[i])
        i += 1
    return "".join(out)


def _process_one_arg_macros(text: str) -> str:
    """Converte \\textbf{x}, \\textit{x}, \\textsuperscript{x}, etc."""
    pattern = re.compile(r"\\(" + "|".join(_ONE_ARG_MACROS.keys()) + r")\b")
    out = []
    i = 0
    while i < len(text):
        m = pattern.match(text, i)
        if m:
            macro = m.group(1)
            j = _skip_ws(text, m.end())
            if j < len(text) and text[j] == "{":
                arg, after = _read_braced(text, j)
                open_tag, close_tag = _ONE_ARG_MACROS[macro]
                inner = _process_one_arg_macros(arg)
                out.append(open_tag + inner + close_tag)
                i = after
                continue
        out.append(text[i])
        i += 1
    return "".join(out)


def _process_tabular(text: str) -> str:
    """Converte \\begin{tabular}{...} ... \\end{tabular} em <table>."""
    pattern = re.compile(r"\\begin\{tabular\}\s*\{([^}]*)\}(.*?)\\end\{tabular\}", re.DOTALL)

    def repl(m):
        body = m.group(2)
        # remove \hline
        body = re.sub(r"\\hline", "", body)
        rows_html = []
        first = True
        # linhas separadas por \\
        rows = re.split(r"\\\\", body)
        for row in rows:
            cells = [c.strip() for c in row.split("&")]
            if not any(c for c in cells):
                continue
            if first:
                rows_html.append(
                    "<tr>" + "".join(f"<th>{c}</th>" for c in cells) + "</tr>"
                )
                first = False
            else:
                rows_html.append(
                    "<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>"
                )
        return "<table>" + "".join(rows_html) + "</table>"

    return pattern.sub(repl, text)


def _latex_body_to_html(
    raw: str,
    imagens: List[Dict[str, str]],
    banca: str = "",
    ano: int = 0,
    inline: bool = False,
) -> str:
    """Converte corpo LaTeX em HTML seguindo as regras do SKILL-questbank."""
    text = raw

    # 1. Protege $...$ e $$...$$
    text, math_chunks = _extract_math_placeholders(text)

    # 2. Processa \imagem{...} (antes de mexer em chaves)
    text = _process_macro_imagem(text, imagens)

    # 3. Processa tabular (antes de outros replaces quebrarem)
    text = _process_tabular(text)

    # 4. Substitui linhas de resposta \_\_\_\_ → ____
    # (o parser já protegeu \_ como token literal; tratamos aqui)

    # 5. Macros com 1 arg
    text = _process_one_arg_macros(text)

    # 6. Substituições inline simples
    for pat, rep in _INLINE_TOKEN_SUBS:
        text = re.sub(pat, rep, text)

    # 7. Escape HTML do texto remanescente (mas preservando tokens)
    # Tokens: \x00M<n>\x00 para math, \x01IMG\x01 para imagem, tags HTML já inseridas
    # Precisamos escapar < > & sem quebrar as tags HTML já produzidas.
    # Estratégia: nossas tags inseridas são controladas; escapamos apenas & que não
    # fazem parte de entidades já inseridas, e deixamos < > como está — o app já
    # trata HTML. Para segurança, escapamos & isolado.
    text = re.sub(r"&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)", "&amp;", text)

    # 8. Parágrafos: linha em branco separa
    if inline:
        # remove quebras → espaço
        text = re.sub(r"\s+", " ", text).strip()
        html_out = text
    else:
        paragraphs = re.split(r"\n[ \t]*\n", text.strip())
        html_paras = []
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            # quebras simples viram espaço
            p = re.sub(r"\s*\n\s*", " ", p)
            html_paras.append(p)
        # primeiro parágrafo: prefixa (BANCA - ANO) se houver
        if html_paras and banca and banca != "Desconhecida" and ano:
            html_paras[0] = f"({banca} - {ano}) " + html_paras[0]
        html_out = "".join(
            f'<p style="text-align:justify;">{p}</p>' for p in html_paras
        )

    # 9. Substitui tokens IMG por marcador oficial
    if inline:
        html_out = html_out.replace("\x01IMG\x01", "[IMAGEM]")
    else:
        html_out = html_out.replace("\x01IMG\x01", "</p><p>[IMAGEM]</p><p style=\"text-align:justify;\">")
        # limpa <p>s vazios resultantes
        html_out = re.sub(r'<p style="text-align:justify;">\s*</p>', "", html_out)

    # 10. Restaura math
    html_out = _restore_math(html_out, math_chunks)

    return html_out


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------


def parse_tex(text: str, base_dir: Optional[str] = None) -> Dict[str, Any]:
    """Converte conteúdo .tex em dict no formato QuestBank v1.0.

    Retorna { "version": "1.0", "questions": [...] }.
    """
    text = _strip_comments(text)
    blocks = _split_questoes(text)
    if not blocks:
        raise ParseError(
            "Nenhum \\begin{questao}...\\end{questao} encontrado no arquivo."
        )
    seen: set = set()
    questions = []
    for qid, line, body in blocks:
        if qid in seen:
            raise ParseError(f"ID duplicado: {qid!r}", line=line)
        seen.add(qid)
        q = _parse_questao_block(qid, body, line)
        questions.append(q)
    return {"version": "1.0", "questions": questions}


def parse_tex_file(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    return parse_tex(text, base_dir=os.path.dirname(os.path.abspath(path)))
