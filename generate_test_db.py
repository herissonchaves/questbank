import json
import base64
from io import BytesIO
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    pass

def create_synthetic_image(text, width=400, height=300):
    try:
        img = Image.new('RGB', (width, height), color=(240, 240, 240))
        d = ImageDraw.Draw(img)
        d.text((10, height//2), text, fill=(50, 50, 50))
        d.rectangle([0, 0, width-1, height-1], outline=(100, 100, 100))
        
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        return f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
    except:
        # Fallback 1px gray image if Pillow is not installed
        return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAQDAQEAAwAAAAEAKv/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AQv/Z"

questoes = []

vestibulares = ["FUVEST", "Unicamp", "ENEM", "Vunesp", "ITA"]

for i in range(1, 21):
    q_tipo = "objetiva" if i % 2 != 0 else "discursiva"
    
    img1 = create_synthetic_image(f"Figura {i} - Esquema Fisico")
    
    # Mistura LaTeX e Image tag
    enunciado = f"({vestibulares[i%5]}) Sabendo que a aceleração da gravidade local é de $g = 9,8 \\text{{ m/s}}^2$, um bloco de massa $M$ desliza pelo plano inclinado mostrado na figura abaixo, com coeficiente de atrito cinético$\\mu_c = 0,2$."
    enunciado += f"<br/><br/>[IMAGEM_0]<br/><br/>Calcule o valor do trabalho elástico ou a força resultante se $F = M \\cdot a$ considerando o angulo $\\theta = 30^\\circ$."
    
    q = {
        "id": f"TESTE_FIS_{i:03d}",
        "disciplina": "Física",
        "assunto": "Mecânica > Dinâmica",
        "instituicao": vestibulares[i%5],
        "ano": 2024,
        "enunciado": enunciado,
        "imagens": [img1],
        "tipo": q_tipo,
        "dificuldade": "Médio" if i % 2 == 0 else "Difícil"
    }
    
    if q_tipo == "objetiva":
        q["alternativas"] = [
            {"letra": "a", "texto": "$10 \\sqrt{3} \\text{ J}$", "correta": False},
            {"letra": "b", "texto": "$20 \\sqrt{3} \\text{ J}$", "correta": True},
            {"letra": "c", "texto": "$30 \\text{ J}$", "correta": False},
            {"letra": "d", "texto": "Nenhuma das anteriores [IMAGEM_0] pois a força é $\\vec{F}$", "correta": False}
        ]
        q["gabarito"] = "B"
    else:
        q["gabarito"] = "O trabalho é calculado por $W = F \\cdot d \\cdot \\cos(\\theta)$."
        
    questoes.append(q)

with open("teste_fisica_20.json", "w", encoding="utf-8") as f:
    json.dump(questoes, f, ensure_ascii=False, indent=2)

print("Arquivo teste_fisica_20.json gerado com sucesso!")
