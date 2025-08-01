import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { parseRedisLockVars } from '@smambu/lib.constantsjs'
import { Redis } from 'ioredis'
import { getRedisSentinelConfig } from '../utilities/redis-utils'
import Redlock from '../utilities/redlock'

@Injectable()
export class RedisClientService implements OnApplicationShutdown {
  private _client: Redis | undefined
  private _redislock: any

  public get client () {
    return this._client
  }

  public get redislock () {
    return this._redislock
  }

  private set client (value) {
    this._client = value
  }

  private set redislock (value) {
    this._redislock = value
  }

  constructor (private readonly configService: ConfigService) {
    const redisConfig = getRedisSentinelConfig(configService)

    const env = process.env

    const {
      retryCount,
      driftFactor,
      retryDelay,
      retryJitter,
      automaticExtensionThreshold
    } = parseRedisLockVars(env)

    this.client = new Redis(redisConfig)
    this.redislock = new Redlock([this.client], {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor, // multiplied by lock ttl to determine drift time

      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount,

      // the time in ms between attempts
      retryDelay, // time in ms

      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter, // time in ms

      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold, // time in ms
    })
  }

  async onApplicationShutdown () {
    await this.client?.quit()
  }
}
