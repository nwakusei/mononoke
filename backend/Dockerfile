# # Dockerfile de Desenvolvimento para a aplicação Node.js
# # Usando a imagem oficial do Node.js como base
# FROM node:22.12.0

# # Atualiza o sistema e garante que certificados estão disponíveis
# RUN apt-get update && apt-get install -y ca-certificates && apt-get clean

# WORKDIR /app

# # Copia os arquivos de dependência
# COPY package*.json ./

# # Instala as dependências com Yarn
# RUN npm install

# # Copia o restante do código da aplicação
# COPY . .

# # Expondo a porta 5000 para acesso externo
# EXPOSE 5000

# # Inicia a aplicação
# CMD ["npm", "run", "dev"]

# # --------------------------------------------------------------------------------------

# # Etapa 1: Build
# FROM node:22.12.0 AS builder

# WORKDIR /app

# COPY package*.json ./

# # Instala TODAS as dependências (incluindo dev, como typescript)
# RUN npm install

# # Copia o restante dos arquivos
# COPY . .

# # Compila TypeScript
# RUN npm run build

# # Etapa 2: Imagem final (produção)
# FROM node:22.12.0

# WORKDIR /app

# # Copia apenas o que é necessário
# COPY package*.json ./

# # Instala só dependências de produção
# RUN npm install --omit=dev

# # Copia os arquivos compilados da etapa de build
# COPY --from=builder /app/dist ./dist

# # Copia outras coisas necessárias (ex: config, .env.example, etc — opcional)
# # COPY --from=builder /app/.env ./ 

# EXPOSE 5000

# # Comando para iniciar o servidor em produção
# CMD ["node", "dist/index.js"]

# # --------------------------------------------------------------
    
# # Dockerfile para produção de backend sem npm install e build
FROM node:22.12.0

WORKDIR /app

COPY package*.json ./

# Instala só dependências de produção
RUN npm install --omit=dev

# Copia os arquivos já compilados
COPY dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
