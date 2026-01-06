FROM node:18-bullseye-slim

WORKDIR /app

# Install bash which some pty packages expect, and ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    python3 python3-pip \
    build-essential \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

RUN npm install --production=false || true

# copy app
COPY . .

EXPOSE 9000

ENV NODE_ENV=development

CMD ["bash", "-c", "npm run dev"]
