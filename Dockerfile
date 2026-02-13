# Используем стабильную версию Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем файлы манифестов для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь исходный код
COPY . .

# Собираем TypeScript проект в папку /dist
RUN npm run build

# Удаляем dev-зависимости для уменьшения веса образа
RUN npm prune --production

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "run", "start:prod"]
