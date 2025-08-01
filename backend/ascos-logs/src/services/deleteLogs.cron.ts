import { Inject, Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Logs, LogsDocument } from 'src/schemas/logs.schema'
import { Model } from 'mongoose'
import { AsyncLocalStorage } from 'async_hooks'
import { RedisClientService } from '@smambu/lib.commons-be'

@Injectable()
export class DeleteLogsCron {
  constructor (
    @Inject(RedisClientService) private readonly redis: RedisClientService,
    @InjectModel(Logs.name) private readonly logsModel: Model<LogsDocument>,
    private readonly als: AsyncLocalStorage<{ tenantId: string }>
  ) {}

  @Cron('0 0 0 * * *')
  async handleCron () {
    const executeCron = async () => {
      try {
        await this.redis.redislock.using(['deleteLogsCron'], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
          const numberOfLogs = await this.logsModel.countDocuments()
          if (numberOfLogs > parseInt(process.env.LOGS_MAXIMUM_NUMBER)) {
            const lastElementToRemove = await this.logsModel.find({}).sort({
              createdAt: -1,
            })
              .skip(parseInt(process.env.LOGS_MAXIMUM_NUMBER))
              .limit(1)
              .lean()
            if (!lastElementToRemove?.[0]?.createdAt) throw new Error('logs_deleteLogsCron_error')
            await this.logsModel.deleteMany({
              createdAt: {
                $lt: lastElementToRemove[0].createdAt
              }
            })
          }
        })
      } catch (e) {
        console.error(e)
      }
    }

    const store = { tenantId: undefined, bypassTenant: true }

    await this.als.run(store, executeCron)
  }
}
