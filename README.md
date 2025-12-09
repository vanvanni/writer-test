# 📝 Writer Test - Bun Counter App

A simple Bun app that counts up to 2500 with random intervals and periodic snapshots.

## Features

- Counts from 0 to 2500
- Updates on random intervals between 100ms and 320ms
- Creates snapshots every 6-12 seconds (random interval)
- Stores count in `./storage/count.json`
- Stores snapshots in `./storage/snapshots/`

## Running Locally

```bash
bun run index.ts
```

## Running with Docker
Run the container:
```bash
docker run -v ./storage-docker:/app/storage vanvanni/write-test:latest
```