FROM mcr.microsoft.com/devcontainers/typescript-node:1.1-22

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
  apt-get update && apt-get install -y postgresql-client-17
