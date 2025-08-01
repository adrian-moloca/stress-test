import { Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { AsyncLocalStorage } from 'async_hooks'
import { Component, parseRedisLockVars, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import { initLocalEventsCronService, LocalEventsService, LoggingService, RedisClientService } from '@smambu/lib.commons-be'

@Injectable()
export class EventsSenderService {
  async init () {
    try {
      const env = process.env

      const {
        lockDuration,
        driftFactor,
        retryDelay,
        retryJitter,
        automaticExtensionThreshold
      } = parseRedisLockVars(env)

      const cronPattern = env.EVENTS_SENDER_DOWNLOADER_CRONSTRING

      const sysLockName = env.EVENTS_SENDER_DOWNLOADER_LOCK_NAME
      const lockName = `${sysLockName}-${Component.ANAGRAPHICS}`

      initLocalEventsCronService(cronPattern,
        lockDuration,
        driftFactor,
        retryDelay,
        retryJitter,
        automaticExtensionThreshold,
        lockName,
        this.loggingService,
        this.localEventsServiceClient,
        this.schedulerRegistry,
        this.redis,
        this.eventsQueue)
    } catch (e) {
      this.loggingService.logInfo(e as string, false)
    }
  }

  constructor (@InjectQueue(QUEUE_NAMES.LocalEventsAnagraphicsQueue) private eventsQueue: Queue,
    private schedulerRegistry: SchedulerRegistry,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
    private readonly loggingService: LoggingService,
    private readonly redis: RedisClientService,
    private readonly localEventsServiceClient: LocalEventsService) {
    global.als = this.als
    const store = { bypassTenant: true }

    this.localEventsServiceClient.setComponent(Component.EVENT_SENDER_ANAGRAPHICS)

    this.als.run(store, () => this.init())
  }
}
//
//
