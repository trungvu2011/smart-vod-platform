FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -o Acquire::Retries=3 \
  && apt-get install -y --fix-missing --no-install-recommends python3 python3-venv ffmpeg ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

# Local Whisper runtime expected by src/services/ai.service.js
RUN python3 -m venv /app/whisper-env \
  && /app/whisper-env/bin/pip install --no-cache-dir --upgrade pip \
  && /app/whisper-env/bin/pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch \
  && /app/whisper-env/bin/pip install --no-cache-dir openai-whisper

COPY src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
