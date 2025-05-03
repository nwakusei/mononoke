# Usando a imagem oficial do Nginx
FROM nginx:latest

# Instalar dependências e o wait-for-it
RUN apt-get update && apt-get install -y curl && \
    curl -sSL https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/local/bin/wait-for-it && \
    chmod +x /usr/local/bin/wait-for-it

# Copiar a configuração do Nginx para dentro do container
COPY ./conf.d/default.conf /etc/nginx/conf.d/default.conf
