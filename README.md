# R2 Backup

PostgreSQLのデータベースを定期的にCloudflare R2にバックアップするためのツールです

## Configuration

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

`docker-compose.yaml`を次のような感じで作成します

```yaml
services:
  r2_backup:
    image: tkgling/r2_backup:latest
    volumes:
      - ./.r2bk.yaml:/app/.r2bk.yaml:ro
    environment:
      ACCESS_KEY_ID: ${ACCESS_KEY_ID}
      SECRET_ACCESS_KEY: ${SECRET_ACCESS_KEY}
      CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_HOST: ${POSTGRES_HOST}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - 8080:80
    depends_on:
      - postgres
```
