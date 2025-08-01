import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import modules from './modules'
import * as services from './services'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import { HealthController } from './health.controller'
import { EnvConfigsService, HttpMiddleware, LoggingService, EventsUploaderService, LocalEventsService } from '@smambu/lib.commons-be'
import { DynamicAnagraphicsSetupsService } from './services/dynamic-anagraphics-setups.service'

const providers = [...convertObjectToArray(services),
  LoggingService,
  EnvConfigsService,
  LocalEventsService,
  EventsUploaderService,
  DynamicAnagraphicsSetupsService
]

@Module({
  imports: modules,
  controllers: [AppController, HealthController],
  providers,
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(AppController)
  }
}
