import { z } from 'zod'

export const ConfigSchema = z.object({
  access_key_id: z.string().nonempty(),
  cloudflare_s3_api: z.string().url(),
  expression: z.string().nonempty(),
  secret_access_key: z.string().nonempty(),
  bucket_name: z
    .string()
    .nonempty()
    .transform((v) => `s3://${v}`),
  source_dir: z.string().nonempty()
})
export type Config = z.infer<typeof ConfigSchema>

export const config: Config = ConfigSchema.parse({
  access_key_id: process.env.AWS_ACCESS_KEY_ID,
  bucket_name: process.env.BUCKET_NAME,
  cloudflare_s3_api: process.env.CLOUDFLARE_S3_API,
  expression: process.env.CRON_EXPRESSION,
  secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  target_dir: process.env.TARGET_DIR,
  source_dir: process.env.TARGET_DIR
})
