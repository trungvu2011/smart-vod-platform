FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y python3 curl ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY scripts ./scripts
COPY prisma.config.ts ./

EXPOSE 5000

CMD ["node", "src/server.js"]
