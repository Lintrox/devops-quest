# Utilisation d'une image nginx pour le serveur web
FROM nginx:latest
 
COPY src/ /usr/share/nginx/html/

EXPOSE 80

