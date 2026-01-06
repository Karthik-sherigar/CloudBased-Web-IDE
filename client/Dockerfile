FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install || true

COPY . .

ENV HOST=0.0.0.0
EXPOSE 5173

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0"]
