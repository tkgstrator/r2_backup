FROM oven/bun:1.2.18 AS build

WORKDIR /app
COPY src /app/src
COPY package.json /app/package.json
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun run build

FROM oven/bun:1.2.18-slim
RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && apt-get install -y \
  postgresql-common
RUN \
  echo | /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update && apt-get install -y \
  postgresql-client-17 \
  awscli

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
RUN bun install --frozen-lockfile --ignore-scripts --production

CMD ["bun", "dist/index.js"]
