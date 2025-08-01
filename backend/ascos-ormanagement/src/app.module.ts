import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { HealthController, OrManagementController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService } from '@smambu/lib.commons-be'
import { OrSchedulingController } from './controllers/orScheduling.controller'

@Module({
  imports: modules,
  controllers: [OrManagementController, OrSchedulingController, HealthController],
  providers: [...convertObjectToArray(services),
    LoggingService,
    LocalEventsService,
    EventsUploaderService
  ],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(OrManagementController, OrSchedulingController)
  }
}
