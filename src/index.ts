import { exec } from 'node:child_process'
import cron from 'node-cron'
import { config } from './configure'

console.info('R2 Backup: Scheduled Task Started')
console.info('BucketName:', config.bucket_name)
console.info('CronExpression:', config.expression)
console.info('EndpointURL:', config.cloudflare_s3_api)
console.info('TargetDir:', config.source_dir)
cron.schedule(config.expression, () => {
  const command: string = `aws s3 sync ${config.source_dir} ${config.bucket_name}  --endpoint-url ${config.cloudflare_s3_api}`
  exec(
    command,
    {
      env: {
        AWS_ACCESS_KEY_ID: config.access_key_id,
        AWS_SECRET_ACCESS_KEY: config.secret_access_key
      }
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`)
        return
      }
      if (stderr) {
        console.error(`Error in command output: ${stderr}`)
        return
      }
      console.log(`Command output: ${stdout}`)
    }
  )
})
