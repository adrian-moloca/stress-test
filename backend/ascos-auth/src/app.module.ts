import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import modules from './modules'
import { AuthService } from './services'
import { AuthController, HealthController } from './controllers'
import { AsyncLocalStorage } from 'async_hooks'
import { tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import { EnvConfigsService, LoggingService, SendgridService } from '@smambu/lib.commons-be'

declare global {
  namespace NodeJS {
    interface Global {
      als: AsyncLocalStorage<tAsyncLocalStorage>;
    }
  }
}

@Module({
  imports: modules,
  controllers: [AuthController, HealthController],
  providers: [AuthService, EnvConfigsService, SendgridService, LoggingService],
})
export class AppModule implements NestModule {
  constructor (
    private readonly authService: AuthService,
    private readonly als: AsyncLocalStorage<tAsyncLocalStorage>,
  ) {
    global.als = this.als
  }

  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(async (req, _res, next) => {
        await this.authService.validateTokenWithoutTenant(req.headers.authorization)
        return next()
      })
      .forRoutes('/api/auth/auth/loginToTenant')
  }
}
