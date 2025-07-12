import { exec } from 'node:child_process'
import { readFileSync, unlinkSync } from 'node:fs'
import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import dayjs from 'dayjs'
import cron from 'node-cron'
import { config, type Database } from './configure'

const client = new S3Client({
  region: 'auto',
  endpoint: config.cloudflare_s3_api,
  credentials: {
    accessKeyId: config.aws.access_key_id,
    secretAccessKey: config.aws.secret_access_key
  }
})

const backup = async (database: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const command: string = `pg_dump -U ${config.db.user} -h ${config.db.host} -d ${database.name} --file=${database.name}.sql`
    exec(command, { env: { PGPASSWORD: config.db.password } }, (error, _stdout, stderr) => {
      if (error) {
        console.error(`Error executing backup command: ${error.message}`)
        reject(new Error(`Backup failed for database ${database.name}: ${error.message}`))
      }
      if (stderr) {
        console.error(`Error in backup command output: ${stderr}`)
        reject(new Error(`Backup failed for database ${database.name}: ${stderr}`))
      }
      console.info(`Backup for ${database.name} completed successfully.`)
      resolve()
    })
  })
}

const upload = async (database: Database): Promise<void> => {
  const current_time = dayjs().startOf(database.retention_unit)
  const content = readFileSync(`${database.name}.sql`)
  await client.send(
    new PutObjectCommand({
      Bucket: database.bucket_name,
      Key: `${database.name}/${current_time.format('YYYY-MM-DD_HH-mm-ss')}.sql`,
      Body: content,
      Metadata: {
        timestamp: current_time.unix().toString()
      }
    })
  )
  try {
    unlinkSync(`${database.name}.sql`)
    console.info(`Local backup file for ${database.name} deleted successfully.`)
  } catch (error) {
    console.error(`Error deleting local backup file for ${database.name}:`, error)
    throw error
  }
}

const remove = async (database: Database): Promise<void> => {
  const current_time = dayjs()
    .subtract(database.retention_period, database.retention_unit)
    .startOf(database.retention_unit)
  const timestamp = current_time.unix()
  const list = await client.send(
    new ListObjectsV2Command({
      Bucket: database.bucket_name,
      Prefix: `${database.name}/`
    })
  )
  if (!list.Contents) return
  const results = await Promise.all(
    list.Contents.map(async (obj) => {
      if (!obj.Key) return null
      const head = await client.send(
        new HeadObjectCommand({
          Bucket: database.bucket_name,
          Key: obj.Key
        })
      )
      const ts = head.Metadata?.timestamp ? Number(head.Metadata.timestamp) : undefined
      return ts && ts < timestamp ? { Key: obj.Key } : null
    })
  )
  const targets = results.filter((v): v is { Key: string } => v !== null)
  if (targets.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: database.bucket_name,
        Delete: { Objects: targets }
      })
    )
    console.info(`[REMOVE] Deleted ${targets.length} objects`)
  }
}

console.info('R2 Backup: Scheduled Task Started')
for (const database of config.db.databases) {
  cron.schedule(database.cron_expression, async () => {
    try {
      await backup(database)
      await upload(database)
      await remove(database)
    } catch (error) {
      console.error(`Error processing database ${database.name}:`, error)
    }
  })
}
