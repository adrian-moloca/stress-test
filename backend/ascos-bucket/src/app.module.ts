import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { FilesController, HealthController, SuperAdminFilesController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { HttpMiddleware, LoggingService, SuperAdminHttpMiddleware, EnvConfigsService } from '@smambu/lib.commons-be'

const providers = [...convertObjectToArray(services), LoggingService, EnvConfigsService]
@Module({
  imports: modules,
  controllers: [FilesController, HealthController, SuperAdminFilesController],
  providers,
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(FilesController)
    consumer.apply(SuperAdminHttpMiddleware).forRoutes(SuperAdminFilesController)
  }
}
