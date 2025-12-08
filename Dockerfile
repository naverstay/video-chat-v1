# Используем официальный Node.js образ
FROM node:18

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь проект
COPY . .

# Указываем порт (Render задаёт через переменную окружения)
ENV PORT=10000

# Запускаем сервер
CMD ["node", "server.js"]
