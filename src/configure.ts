import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import cron from 'cron-validator'
import yaml from 'js-yaml'
import { z } from 'zod'

export const DatabaseSchema = z.object({
  name: z.string().nonempty(),
  bucket_name: z.string().nonempty(),
  cron_expression: z.string().refine((v) => cron.isValidCron(v), { message: 'Invalid cron expression' }),
  retention_period: z.number().int().positive(),
  retention_unit: z.enum(['minute', 'hour', 'day', 'week', 'month'])
})
export type Database = z.infer<typeof DatabaseSchema>

export const ConfigSchema = z
  .object({
    aws: z.object({
      access_key_id: z.string().nonempty(),
      secret_access_key: z.string().nonempty()
    }),
    cf: z.object({
      account_id: z.string().nonempty()
    }),
    db: z.object({
      host: z.string().nonempty(),
      user: z.string().nonempty(),
      password: z.string().nonempty(),
      databases: z.array(DatabaseSchema).nonempty()
    })
  })
  .transform((v) => ({
    ...v,
    cloudflare_s3_api: `https://${v.cf.account_id}.r2.cloudflarestorage.com`
  }))
export type Config = z.infer<typeof ConfigSchema>

const path = resolve(process.cwd(), './.r2bk.yaml')
export const config = ConfigSchema.parse(
  JSON.parse(
    JSON.stringify(yaml.load(readFileSync(path, 'utf-8'))).replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '')
  )
)
