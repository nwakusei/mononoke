# # Dockerfile para desenvolvimento de frontend com Next.js
# # Usando a imagem oficial do Node.js como base
# FROM node:22.12.0

# WORKDIR /app

# # Copia os arquivos de dependência
# COPY package*.json ./

# # Instala as dependências com npm
# RUN npm install

# # Instala o react-icons explicitamente
# RUN npm install react-icons

# # Copia o restante do código da aplicação
# COPY . .  

# # Expondo a porta 3000 para acesso externo
# EXPOSE 3000

# # Inicia a aplicação
# CMD ["npx", "next", "dev", "-H", "0.0.0.0"]

# # -------------------------------------------------------------

# # Dockerfile para produção de frontend com Next.js
# Etapa 1: build
FROM node:22.12.0 AS builder

WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Compila para produção
RUN npm run build

# Etapa 2: produção
FROM node:22.12.0 AS production

WORKDIR /app

# Apenas dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia arquivos da build
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
