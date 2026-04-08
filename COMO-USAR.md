# QuestBank — Como abrir e colocar no ar

Guia passo a passo para pessoas leigas. Nenhum conhecimento técnico é necessário.

---

## OPÇÃO 1: Abrir direto no seu computador (mais fácil)

O QuestBank é um app que roda direto no navegador. Você só precisa de um "servidor local" simples para que o navegador consiga carregar todos os arquivos corretamente.

### Passo 1 — Instale o Python (se ainda não tiver)

O Python já vem instalado no Mac e na maioria dos Linux. No Windows:

1. Acesse https://www.python.org/downloads/
2. Clique no botão amarelo "Download Python 3.x.x"
3. Na instalação, **marque a opção "Add Python to PATH"** (muito importante!)
4. Clique em "Install Now" e aguarde

Para conferir se já tem Python, abra o Terminal (Mac/Linux) ou Prompt de Comando (Windows) e digite:

```
python3 --version
```

Se aparecer algo como `Python 3.12.0`, está tudo certo.

### Passo 2 — Abra o Terminal na pasta do QuestBank

**No Windows:**
1. Abra o Explorador de Arquivos e navegue até a pasta `questbank`
2. Clique na barra de endereço (onde mostra o caminho da pasta)
3. Digite `cmd` e aperte Enter
4. O Prompt de Comando vai abrir já dentro da pasta certa

**No Mac:**
1. Abra o Finder e navegue até a pasta `questbank`
2. Clique com botão direito na pasta → "Novo Terminal na Pasta"
   (ou: Abra o Terminal e digite `cd ` e arraste a pasta para o Terminal)

### Passo 3 — Inicie o servidor local

No Terminal/Prompt, digite:

```
python3 -m http.server 8080
```

(No Windows, se não funcionar, tente `python -m http.server 8080`)

Vai aparecer algo como:
```
Serving HTTP on :: port 8080 (http://[::]:8080/) ...
```

### Passo 4 — Abra no navegador

Abra o Google Chrome (recomendado) e acesse:

```
http://localhost:8080
```

Pronto! O QuestBank está rodando no seu computador.

**Para parar o servidor:** volte ao Terminal e aperte `Ctrl + C`.

---

## OPÇÃO 2: Colocar online de graça com o GitHub Pages

Esta opção permite que qualquer pessoa acesse o app pela internet, sem instalar nada.

### Passo 1 — Crie uma conta no GitHub

1. Acesse https://github.com
2. Clique em "Sign up" e crie sua conta gratuita
3. Confirme seu email

### Passo 2 — Crie um repositório

1. No GitHub, clique no botão **"+"** no canto superior direito → "New repository"
2. Nome do repositório: `questbank`
3. Marque como **Public**
4. Clique em **"Create repository"**

### Passo 3 — Faça upload dos arquivos

1. Na página do repositório recém-criado, clique em **"uploading an existing file"**
2. Arraste TODA a pasta `questbank` (todos os arquivos e pastas dentro dela) para a área de upload
   - Inclua: `index.html`, `app.jsx`, `manifest.json`, `sw.js`, pasta `components/`, pasta `db/`, pasta `utils/`
   - **Não inclua** a pasta `.git` nem a pasta `.agents`
3. Clique em **"Commit changes"**

### Passo 4 — Ative o GitHub Pages

1. No repositório, vá em **Settings** (engrenagem)
2. No menu lateral, clique em **Pages**
3. Em "Source", selecione **Deploy from a branch**
4. Em "Branch", selecione **main** e pasta **/ (root)**
5. Clique em **Save**

### Passo 5 — Acesse seu app online

Após 1-2 minutos, seu app estará disponível em:

```
https://SEU-USUARIO.github.io/questbank/
```

(Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub)

---

## OPÇÃO 3: Colocar online com o Netlify (alternativa ao GitHub Pages)

O Netlify é outra plataforma gratuita, ainda mais simples.

### Passo 1 — Acesse o Netlify Drop

1. Acesse https://app.netlify.com/drop
2. (Crie conta gratuita se necessário)

### Passo 2 — Arraste a pasta

1. Arraste a pasta `questbank` inteira para a área indicada no site
2. Aguarde o upload (poucos segundos)

### Passo 3 — Pronto!

O Netlify vai gerar um link tipo:
```
https://nome-aleatorio.netlify.app
```

Seu app está no ar! Você pode depois personalizar o nome do link.

---

## Como usar o QuestBank depois de abrir

### Importar questões

1. Prepare um arquivo JSON no formato aceito (veja os exemplos na pasta `.agents/skills/importar-questoes/examples/`)
2. Clique no botão **"Importar"** no header
3. Arraste o arquivo JSON ou clique para selecionar
4. O app valida e mostra quantas questões foram encontradas
5. Clique em **"Importar X questões"**

### Montar uma prova

1. Na árvore de assuntos (painel esquerdo), selecione os assuntos desejados
2. Use os filtros para refinar (banca, ano, dificuldade, tipo)
3. Clique no botão **"+"** em cada questão para adicionar à prova
4. No painel direito, arraste para reordenar as questões
5. Clique em **"Gerar Prova (.docx)"**
6. Preencha o nome da prova (obrigatório), professor e instituição
7. Clique em **"Baixar Word (.docx)"**

### Fazer backup

1. Clique no botão **"Backup"** no header
2. **"Exportar banco"** salva todas as questões e provas em um arquivo .json
3. **"Restaurar banco"** carrega um backup salvo anteriormente

---

## Dúvidas frequentes

**O app funciona offline?**
Sim! Depois de abrir pela primeira vez, o app funciona mesmo sem internet (é um PWA).

**Posso usar no celular?**
Sim, mas a experiência é melhor em tela grande (computador ou tablet).

**Meus dados ficam seguros?**
Os dados ficam salvos apenas no SEU navegador (IndexedDB). Ninguém mais tem acesso. Faça backups regularmente!

**Posso usar em mais de um computador?**
Sim, mas os dados não sincronizam automaticamente. Use a função de backup para transferir dados entre computadores.
