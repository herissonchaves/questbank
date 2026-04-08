---
name: importar-questoes
description: >
  Gera dados de teste, valida JSON de questões e gerencia a importação no QuestBank.
  Use esta skill quando o usuário pedir para criar questões de teste, gerar seed data,
  validar formato de JSON, corrigir erros de importação, ou quando mencionar
  "importar", "JSON de questões", "dados de teste", "seed", "formato de importação",
  "questões de exemplo", "modelo de JSON", "template de questão".
  Também ative quando houver erros de validação durante a importação.
---

# Importar Questões — QuestBank

## Objetivo

Gerar dados de teste no formato JSON aceito pelo app, validar JSONs do usuário, e resolver problemas de importação.

## Formato JSON aceito pelo app (QuestBank Import Standard v1.0)

```json
{
  "version": "1.0",
  "questions": [
    {
      "id": "ENEM-2024-Q45",
      "enunciado": "Texto completo do enunciado da questão...",
      "tipo": "objetiva",
      "disciplina": "Física",
      "topico": "Mecânica",
      "conteudo": "Cinemática",
      "assunto": "Lançamento Oblíquo",
      "dificuldade": "medio",
      "banca": "ENEM",
      "ano": 2024,
      "gabarito": "B",
      "alternativas": [
        {"letra": "A", "texto": "Texto da alternativa A"},
        {"letra": "B", "texto": "Texto da alternativa B"},
        {"letra": "C", "texto": "Texto da alternativa C"},
        {"letra": "D", "texto": "Texto da alternativa D"},
        {"letra": "E", "texto": "Texto da alternativa E"}
      ],
      "imagens": [],
      "resolucao_link": "",
      "regiao": "Nacional",
      "tags": ["vestibular", "cinemática"]
    }
  ]
}
```

## Campos obrigatórios vs opcionais

### Obrigatórios (importação falha sem eles)
| Campo | Tipo | Exemplo |
|-------|------|---------|
| `id` | string | `"ENEM-2024-Q45"` |
| `enunciado` | string | `"Um corpo de massa 2kg..."` |
| `tipo` | enum | `"objetiva"`, `"discursiva"`, `"v_f"`, `"somatoria"` |
| `disciplina` | string | `"Física"` |
| `topico` | string | `"Mecânica"` |
| `conteudo` | string | `"Cinemática"` |
| `assunto` | string | `"Lançamento Oblíquo"` |
| `dificuldade` | enum | `"facil"`, `"medio"`, `"dificil"`, `"nao_definida"` |

### Opcionais (importação funciona sem eles)
| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `banca` | string | `""` | Ex: "ENEM", "FUVEST", "UERJ" |
| `ano` | number/string | `""` | Ex: 2024 |
| `gabarito` | string | `""` | Letra para objetiva, texto para discursiva |
| `alternativas` | array | `[]` | Obrigatório se `tipo === "objetiva"` |
| `imagens` | array | `[]` | Base64 strings |
| `resolucao_link` | string | `""` | URL para resolução externa |
| `regiao` | string | `""` | "Sudeste", "Sul", "Nacional", etc. |
| `tags` | array | `[]` | Tags livres |

## Exemplos por tipo de questão

### Questão objetiva
```json
{
  "id": "UDESC-2026-Q9",
  "enunciado": "Um pequeno corpo de massa 20 g e carga 4,0 μC encontra-se em equilíbrio suspenso em um campo elétrico uniforme vertical, dirigido para cima. Assinale a alternativa correta do módulo do campo elétrico.",
  "tipo": "objetiva",
  "disciplina": "Física",
  "topico": "Eletrostática",
  "conteudo": "Campo Elétrico",
  "assunto": "Trabalho da Força Elétrica",
  "dificuldade": "medio",
  "banca": "UDESC",
  "ano": 2026,
  "gabarito": "C",
  "alternativas": [
    {"letra": "A", "texto": "2,0 × 10⁴ N/C"},
    {"letra": "B", "texto": "3,0 × 10⁴ N/C"},
    {"letra": "C", "texto": "5,0 × 10⁴ N/C"},
    {"letra": "D", "texto": "8,0 × 10⁴ N/C"},
    {"letra": "E", "texto": "1,0 × 10⁵ N/C"}
  ],
  "tags": ["eletrostática", "campo elétrico", "equilíbrio"]
}
```

### Questão discursiva
```json
{
  "id": "UNICAMP-2025-D3",
  "enunciado": "Explique o conceito de energia potencial gravitacional e derive a expressão para a energia potencial gravitacional de um corpo de massa m a uma altura h da superfície terrestre.",
  "tipo": "discursiva",
  "disciplina": "Física",
  "topico": "Mecânica",
  "conteudo": "Energia",
  "assunto": "Energia Potencial Gravitacional",
  "dificuldade": "dificil",
  "banca": "UNICAMP",
  "ano": 2025,
  "gabarito": "Ep = mgh, onde m é a massa, g é a aceleração gravitacional e h é a altura.",
  "tags": ["energia", "gravitação", "discursiva"]
}
```

## Passo a passo para gerar dados de teste

1. Definir quantas questões gerar e de quais disciplinas
2. Para cada questão, gerar:
   - ID único (formato: `BANCA-ANO-QNUMERO` ou UUID)
   - Enunciado realista (mínimo 2 frases)
   - Taxonomia completa (disciplina > tópico > conteúdo > assunto)
   - Alternativas plausíveis (para objetivas)
   - Gabarito correto
3. Montar o JSON no formato `{ "version": "1.0", "questions": [...] }`
4. Salvar em `saida/sample-data.json`
5. Validar com o import handler antes de entregar

## Regras e restrições

- IDs devem ser **únicos** dentro de cada arquivo
- `tipo` deve ser exatamente: `objetiva`, `discursiva`, `v_f` ou `somatoria`
- `dificuldade` deve ser: `facil`, `medio`, `dificil` ou `nao_definida`
- Objetivas DEVEM ter `alternativas` com pelo menos 2 itens
- Cada alternativa deve ter `letra` e `texto`
- O `gabarito` de objetivas deve corresponder a uma `letra` das alternativas

## Checklist pré-entrega

- [ ] JSON é válido (sem trailing commas, aspas corretas)
- [ ] Todos os campos obrigatórios presentes em cada questão
- [ ] IDs únicos em todo o arquivo
- [ ] Tipos e dificuldades são valores válidos do enum
- [ ] Objetivas têm alternativas e gabarito correspondente
- [ ] Taxonomia realista (disciplina/tópico/conteúdo/assunto fazem sentido)
