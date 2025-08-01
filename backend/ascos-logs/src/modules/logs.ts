import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LogsController } from 'src/controllers/logs.controller'
import { Logs, LogsSchema } from 'src/schemas/logs.schema'
import { LogsService } from 'src/services/logs.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Logs.name, schema: LogsSchema },
    ]),
  ],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogModule {}
