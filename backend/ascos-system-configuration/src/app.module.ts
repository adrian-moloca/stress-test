import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { SystemConfigurationController } from './controllers'
import modules from './modules'
import * as services from './services'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import { HealthController } from './health.controller'
import { EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService } from '@smambu/lib.commons-be'

@Module({
  imports: modules,
  controllers: [
    SystemConfigurationController,
    HealthController
  ],
  providers: [...convertObjectToArray(services),
    LoggingService,
    LocalEventsService,
    EventsUploaderService],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(SystemConfigurationController)
  }
}
