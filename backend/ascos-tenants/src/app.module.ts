import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { TenantsController, HealthController } from './controllers'
import { convertObjectToArray, tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import modules from './modules'
import { LoggingService, SuperAdminHttpMiddleware } from '@smambu/lib.commons-be'
import { AsyncLocalStorage } from 'async_hooks'

@Module({
  imports: modules,
  controllers: [TenantsController, HealthController],
  providers: [...convertObjectToArray(services), LoggingService, AsyncLocalStorage],
})
export class AppModule implements NestModule {
  constructor (
    private readonly als: AsyncLocalStorage<tAsyncLocalStorage>,
  ) {
    (global as any).als = this.als
  }

  configure (consumer: MiddlewareConsumer) {
    consumer.apply(SuperAdminHttpMiddleware).forRoutes(TenantsController)
  }
}
