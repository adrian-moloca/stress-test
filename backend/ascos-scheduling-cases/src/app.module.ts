import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { CasesController, HealthController, SchedulingController, ScheduleNotesController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { EnvConfigsService, EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService, SendgridService } from '@smambu/lib.commons-be'
import { ScheduleModule } from '@nestjs/schedule'
import { dynamicModelProviders } from './dynamic-module-providers'

@Module({
  imports: [
    ...modules,
    ScheduleModule.forRoot(),
  ],
  controllers: [CasesController,
    SchedulingController,
    HealthController,
    ScheduleNotesController],
  providers: [
    ...convertObjectToArray(services),
    ...dynamicModelProviders,
    EnvConfigsService,
    LoggingService,
    SendgridService,
    LocalEventsService,
    EventsUploaderService
  ],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(CasesController)
    consumer.apply(HttpMiddleware).forRoutes(SchedulingController)
    consumer.apply(HttpMiddleware).forRoutes(ScheduleNotesController)
  }
}
