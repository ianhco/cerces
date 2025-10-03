FROM oven/bun:latest
WORKDIR /home/bun/app
COPY package.json bun.lock ./
RUN bun install
COPY . .
CMD ["bun", "run", "--port", "3000", "src/index.ts"]
