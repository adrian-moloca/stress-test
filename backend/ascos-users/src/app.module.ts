import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { UsersController } from './app.controller'
import modules from './modules'
import * as services from './services'
import { convertObjectToArray, tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import { HealthController } from './health.controller'
import { EnvConfigsService, EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService, SendgridService } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'

declare global {
  namespace NodeJS {
    interface Global {
      als: AsyncLocalStorage<tAsyncLocalStorage>;
    }
  }
}

const servicesArray = convertObjectToArray(services)
@Module({
  imports: modules,
  controllers: [UsersController, HealthController],
  providers: [...servicesArray,
    EnvConfigsService,
    LoggingService,
    SendgridService,
    LocalEventsService,
    EventsUploaderService],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(UsersController)
  }
}
