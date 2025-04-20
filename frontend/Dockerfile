# Usando a imagem oficial do Node.js como base
FROM node:22.12.0

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências com npm
RUN npm install

# Instala o react-icons explicitamente
RUN npm install react-icons

# Copia o restante do código da aplicação
COPY . .  

# Expondo a porta 3000 para acesso externo
EXPOSE 3000

# Inicia a aplicação
CMD ["npx", "next", "dev", "-H", "0.0.0.0"]
