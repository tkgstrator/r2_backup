FROM oven/bun:1.2.15

WORKDIR /app
COPY src /app/src
COPY package.json /app/package.json
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun run build

FROM oven/bun:1.2.15-slim
RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y awscli
WORKDIR /app
COPY dist /app/dist
COPY package.json /app/package.json
RUN bun install --frozen-lockfile --ignore-scripts --production

CMD ["bun", "dist/index.js"]
