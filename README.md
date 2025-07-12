# R2 Backup

PostgreSQLのデータベースを定期的にCloudflare R2にバックアップするためのツールです

## Development

`.devcontainer/.env.exmaple`の中身を参考に`.devcontainer/.env`を作成します

```zsh
cp .devcontainer/.env.example .devcontainer/.env
```

Cloudflareのアカウント情報とR2 User Tokenを設定します

```zsh
ACCESS_KEY_ID={YOUR_R2_ACCESS_KEY_ID}
SECRET_ACCESS_KEY={YOUR_R2_SECRET_ACCESS_KEY}
CLOUDFLARE_ACCOUNT_ID={YOUR_CLOUDFLARE_ACCOUNT_ID}
POSTGRES_DB=db1
POSTGRES_HOST=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

PGADMIN_DEFAULT_EMAIL=default@postgres.com
PGADMIN_DEFAULT_PASSWORD=password
```

以下のデータベース名はダミーデータなので何でも構いません

ここに設定されている`POSTGRES_DB`のデータベースが初期化時に作成されます

pgadminが起動するようにしているので[localhost:8080](http://localhost:8080)にアクセスしてダミーデータをいれたり、データベースを作成したりできます

## Get Started

`.r2bk.yaml`を作成します

```yaml
aws:
  access_key_id: ${ACCESS_KEY_ID} # アクセスキー
  secret_access_key: ${SECRET_ACCESS_KEY} # シークレット
cf:
  account_id: ${CLOUDFLARE_ACCOUNT_ID} # CloudflareアカウントID
db:
  host: ${POSTGRES_HOST} # ホスト名
  user: ${POSTGRES_USER} # ユーザー名
  password: ${POSTGRES_PASSWORD} # パスワード
  databases:
    - name: db1 # データベース名
      bucket_name: pg-backup # バックアップ先のバケット名
      retention_period: 3 # リテンション
      retention_unit: minute # リテンション単位
      cron_expression: "*/1 * * * *" # バックアップ実行間隔

    # - name: db2
    #   bucket_name: pg-backup
    #   retention_period: 5
    #   retention_unit: minute
    #   cron_expression: "*/1 * * * *"
```

`cron_expression`は正しく評価できるcron式であれば何でも構いません

`@daily`などのような式も、多分正しく評価されます

`compose.yaml`を次のような感じで作成します

環境変数は勝手に読み込まれて置換されるので`databases`のところだけ弄れば良いですが、ハードコードすることもできます

オススメはしていません

```yaml
services:
  r2_backup:
    image: ghcr.io/tkgstrator/r2_backup:latest-1.2.18
    volumes:
      - ./.r2bk.yaml:/app/.r2bk.yaml:ro
    environment:
      ACCESS_KEY_ID: ${ACCESS_KEY_ID}
      SECRET_ACCESS_KEY: ${SECRET_ACCESS_KEY}
      CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "$POSTGRES_USER"]
      interval: 10s
      timeout: 5s
      retries: 5
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - 8080:80
    depends_on:
      postgres:
        condition: service_healthy
```

実行する場合にはこの`compose.yaml`と同じ場所に`.env`または何らかの方法で環境変数を設定してください
