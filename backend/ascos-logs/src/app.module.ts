import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { AuditTrailController, HealthController, LogsController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { HttpMiddleware } from '@smambu/lib.commons-be'

@Module({
  imports: modules,
  controllers: [AuditTrailController, LogsController, HealthController],
  providers: convertObjectToArray(services),
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(AuditTrailController, LogsController)
  }
}
