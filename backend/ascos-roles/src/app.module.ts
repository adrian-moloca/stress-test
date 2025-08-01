import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as services from './services'
import { CapabilitiesController, HealthController, RoleAssociationController, RolesController } from './controllers'
import { convertObjectToArray } from '@smambu/lib.constantsjs'
import modules from './modules'
import { EventsUploaderService, HttpMiddleware, LocalEventsService, LoggingService } from '@smambu/lib.commons-be'

@Module({
  imports: modules,
  controllers: [
    RolesController,
    RoleAssociationController,
    CapabilitiesController,
    HealthController
  ],
  providers: [...convertObjectToArray(services),
    LoggingService,
    LocalEventsService,
    EventsUploaderService
  ],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes(RolesController, RoleAssociationController, CapabilitiesController)
  }
}
