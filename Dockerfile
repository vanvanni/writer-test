FROM oven/bun:alpine

WORKDIR /app

COPY package.json ./
COPY index.ts ./

RUN mkdir -p storage/snapshots

VOLUME ["/app/storage"]
CMD ["bun", "run", "index.ts"]


