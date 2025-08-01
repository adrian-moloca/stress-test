import { ConfigService } from '@nestjs/config'
import { RedisOptions } from 'ioredis'

export const getRedisSentinelConfig = (configService: ConfigService): RedisOptions => {
  const redis_host = configService.get('REDIS_HOST')
  const redis_port = configService.get('REDIS_PORT')

  if (redis_host == null || redis_host === '') throw new Error('redis_host_null')

  if (redis_port == null || redis_port === '') throw new Error('redis_port_null')

  return ({
    host: redis_host,
    port: +redis_port
  })
}
