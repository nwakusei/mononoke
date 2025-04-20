# Usando a imagem oficial do Node.js como base
FROM node:22.12.0

# Atualiza o sistema e garante que certificados estão disponíveis
RUN apt-get update && apt-get install -y ca-certificates && apt-get clean

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências com Yarn
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Expondo a porta 5000 para acesso externo
EXPOSE 5000

# Inicia a aplicação
CMD ["npm", "run", "dev"]
