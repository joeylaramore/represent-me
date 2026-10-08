FROM nginx:1.27-alpine
COPY index.html styles.css app.js ballot.js evidence.js explore.js mobile-nav.js /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
