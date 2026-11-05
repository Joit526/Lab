# Используем легкий официальный образ Nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем HTML, CSS и JavaScript игры в каталог веб-сервера Nginx
COPY index.html style.css game.js /usr/share/nginx/html/

# Документируем порт, который использует веб-сервер внутри контейнера
EXPOSE 80

# Nginx запускается автоматически при старте базового образа
