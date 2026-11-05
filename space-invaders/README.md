# Space Invaders — Docker Lab

Браузерная аркада на HTML, CSS и JavaScript. Nginx раздает статические файлы игры из Docker-контейнера.

## Локальная сборка

```bash
docker build -t space-invaders:1.0 .
docker run -d --name space-invaders -p 8080:80 space-invaders:1.0
```

Откройте `http://localhost:8080`.

## Проверка

```bash
docker ps
curl http://localhost:8080
docker logs space-invaders
```

## Остановка и удаление контейнера

```bash
docker stop space-invaders
docker rm space-invaders
```

## Публикация в Docker Hub

Замените `YOUR_DOCKERHUB_NAME` своим именем пользователя Docker Hub:

```bash
docker login
docker tag space-invaders:1.0 YOUR_DOCKERHUB_NAME/space-invaders:1.0
docker push YOUR_DOCKERHUB_NAME/space-invaders:1.0
```

## Управление

- Стрелки влево и вправо — движение.
- Space — стрельба.
- Кнопка Pause — пауза.
