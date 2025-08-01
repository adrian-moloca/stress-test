import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import modules from './modules'
import * as services from './services'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import { HealthController } from './health.controller'
import { HttpMiddleware, LoggingService } from '@smambu/lib.commons-be'

@Module({
  imports: modules,
  controllers: [AppController, HealthController],
  providers: [...convertObjectToArray(services), LoggingService],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(AppController)
  }
}
