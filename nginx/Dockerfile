# nginx/Dockerfile
FROM nginx:stable-alpine

# Copia certificados SSL (se necessário)
COPY ./certs /etc/nginx/certs

# Copia arquivos de configuração
COPY ./conf.d/default.conf /etc/nginx/conf.d/default.conf
