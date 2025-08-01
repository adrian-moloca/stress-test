import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { AnesthesiologistOPStandardController, ContractsController, HealthController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { EnvConfigsService, EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService, SendgridService } from '@smambu/lib.commons-be'
import { dynamicModelProviders } from './dynamic-module-providers'

const servicesArray = convertObjectToArray(services)
@Module({
  imports: modules,
  controllers: [ContractsController, AnesthesiologistOPStandardController, HealthController],
  providers: [...servicesArray,
    ...dynamicModelProviders,
    EnvConfigsService,
    LoggingService,
    SendgridService,
    LocalEventsService,
    EventsUploaderService],
})

export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes(AnesthesiologistOPStandardController, ContractsController)
  }
}
