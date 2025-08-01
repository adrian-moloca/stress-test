import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { CronJob } from 'cron'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'
import { QUEUE_NAMES, queueRetry, DEPENDENCY_NODE_STATUS, parseRedisLockVars, tGenericDependencyJob } from '@smambu/lib.constantsjs'
import { DependenciesGraphService } from './dependencies-graph.service'
import { FieldsOperationsService } from './field-operations.service'

@Injectable()
export class DependenciesGraphEvaluatorService {
  @Inject(RedisClientService)
  private readonly redis: RedisClientService

  @Inject(DependenciesGraphService)
  private readonly dependenciesGraphService: DependenciesGraphService

  @Inject(FieldsOperationsService)
  private readonly fieldsOperations: FieldsOperationsService

  async handleCron () {
    try {
      const env = process.env

      const {
        lockDuration,
        driftFactor,
        retryDelay,
        retryJitter,
        automaticExtensionThreshold
      } = parseRedisLockVars(env)

      this.loggingService.logInfo('[Dependencies evaluator] service started', false)
      const lockName = this.configService.get('UR_DEPENDENCIES_ANALYZER_LOCK_NAME')
      await this.redis.redislock
        .using([lockName], lockDuration, {
          retryCount: 0,
          driftFactor,
          retryDelay,
          retryJitter,
          automaticExtensionThreshold,
        }, async () => {
          this.loggingService.logInfo('[Dependencies evaluator] lock gained', false)

          // XXX We check that there is not a config being processed - if that is the case,
          // all operations that might create or edit proxies are halted until the config
          // has been processed successfully.
          const systemIsBusy = await this.fieldsOperations.areThereOperationsRunning()

          if (systemIsBusy) {
            this.loggingService.logInfo('There is a config being processed, service will halt.', false)
            return
          }

          const nodesToProcess = await this.dependenciesGraphService
            .getDepencedyGraphsNodeToProcess()

          const promises = Object.entries(nodesToProcess).map(([entity, nodes]) => {
            // XXX So - in order to use some of the most useful features of bull (auto duplicate
            // job prevention, retries, etc) a jobId must be unique.
            // This cron is doing the following:
            // - getting all the "affected" nodes (i.e. any nodes whose dependencies are met)
            // - grouping them by entity id so that we can batch them, avoiding doing multiple
            //   queries that are copies of one another
            // - create a job which such nodes
            //
            // To prevent processing the same nodes at the same time (with all the concurrency problems
            // related to that) we then group the by entity id, so that at any given time only one
            // "batch of nodes" can be processed in a safe way.
            // If this doesn´t hold true in the future, here are some alternative approaches that
            // we tried or discussed, but ended up chosing this one:
            // - divide every node into a single job, retrieving the needed data here and
            //   packing it into the job object
            // - same as before, but moving the retrieval part into the job processer

            const jobId = entity

            this.loggingService.logInfo(`Job ${jobId} queued in the dependencies queue`, false)

            const jobOptions = {
              jobId,
              removeOnComplete: true,
              removeOnFail: true,
              ...queueRetry()
            }

            const nodeJob:tGenericDependencyJob = {
              type: DEPENDENCY_NODE_STATUS.DIRTY,
              nodes,
              tenantId: nodes[0].tenantId
            }

            return this.nodesQueue.add('node',
              nodeJob,
              jobOptions)
          })
          await Promise.all(promises)
        })
    } catch (e) {
      this.loggingService.logInfo(e, false)
    }
  }

  async init () {
    const cronPattern = this.configService.get('UR_DEPENDENCIES_ANALYZER_CRONSTRING')

    if (!cronPattern) throw new Error('Error: cronPattern MUST exists for Dependencies evaluator service')

    const job = new CronJob(cronPattern, () => this.handleCron())

    this.schedulerRegistry.addCronJob('Dependencies evaluator added', job)
    job.start()

    this.loggingService.logWarn(`Dependencies evaluator Job added with pattern ${cronPattern}`)
  }

  constructor (@InjectQueue(QUEUE_NAMES.DepenenciesGraphQueue) private nodesQueue: Queue,
    private readonly configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly als: AsyncLocalStorage<{ bypassTenant: boolean }>,
    private readonly loggingService: LoggingService) {
    global.als = this.als
    const store = { bypassTenant: true }
    this.als.run(store, () => this.init())
  }
}
