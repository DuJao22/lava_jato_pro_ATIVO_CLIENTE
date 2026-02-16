
# 🚀 Manual de Deploy: Lava-jato Pro

Para colocar seu sistema online, siga estas instruções exatas para o **Render**.

## 1. Onde você está errando no Render?
Existem dois tipos de serviços. Escolha o **Static Site** para evitar cobranças e configurações desnecessárias.

### ✅ Opção A: Static Site (RECOMENDADO)
1. No Render, clique em **New +** e escolha **Static Site**.
2. **Build Command:** `npm install && npm run build`
3. **Publish Directory:** `dist`
4. **Start Command:** (Este campo não existirá ou não será obrigatório aqui).

### ⚠️ Opção B: Web Service (O que você selecionou na imagem)
Se você vir o campo "Start Command" como obrigatório, preencha assim:
1. **Build Command:** `npm install && npm run build`
2. **Start Command:** `npm run start`
3. **Environment Variables:** Você DEVE adicionar a variável `PORT` com o valor `4173`.

## 2. Configurando o Banco de Dados
Não esqueça de adicionar sua variável de ambiente em qualquer uma das opções acima:
- **Key:** `VITE_SQLITE_CLOUD_CONNECTION_STRING`
- **Value:** `sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/LavaJato_melhoria.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc`

## 3. Preparando o Banco de Dados (SQLite Cloud)
Antes de acessar o site, você deve garantir que as tabelas existam:
1. Acesse o painel do [SQLite Cloud](https://sqlitecloud.io).
2. Vá em **SQL Editor**.
3. Copie o código do arquivo `database.sql` deste projeto e execute.

---
*Desenvolvido por João Layón*
