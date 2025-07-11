ARG BUN_VERSION=1.2.18
FROM oven/bun:${BUN_VERSION} AS build

WORKDIR /app
COPY package.json bun.lockb* /app/
COPY src /app/src
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun run build

FROM oven/bun:${BUN_VERSION}-slim

WORKDIR /app

RUN --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && \
  apt-get install -y postgresql-common && \
  echo | /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh && \
  apt-get update && \
  apt-get install -y postgresql-client-17 awscli && \
  rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/bun.lockb* /app/
RUN bun install --frozen-lockfile --ignore-scripts --production

CMD ["bun", "dist/index.js"]
