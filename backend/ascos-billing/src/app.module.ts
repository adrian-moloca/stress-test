import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import * as services from './services'
import { BillingController, HealthController, InvoicesController, PdfArchiveController, PcMaterialsController, PrescriptionsController } from './controllers'
import { convertObjectToArray, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import modules from './modules'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { NAMES } from './utilities/constants'
import { EnvConfigsService, getRedisSentinelConfig, HttpMiddleware, LoggingService } from '@smambu/lib.commons-be'

@Module({
  imports: [...modules,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.registerQueueAsync({
      name: NAMES.BillsQueue,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: getRedisSentinelConfig(configService)
      }),
      inject: [ConfigService],
    }, {
      name: NAMES.NormalizerQueue,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: getRedisSentinelConfig(configService)
      }),
      inject: [ConfigService],
    }, {
      name: NAMES.PDFArchivesQueue,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: getRedisSentinelConfig(configService)
      }),
      inject: [ConfigService],
    }, {
      name: NAMES.PDFArchivesToDelete,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: getRedisSentinelConfig(configService)
      }),
      inject: [ConfigService],
    }, {
      name: QUEUE_NAMES.PrescriptionsGeneration,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: getRedisSentinelConfig(configService)
      }),
      inject: [ConfigService],
    })],
  controllers: [
    BillingController,
    InvoicesController,
    PcMaterialsController,
    PrescriptionsController,
    PdfArchiveController,
    HealthController,
  ],
  providers: [...convertObjectToArray(services), EnvConfigsService, LoggingService],
})

export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes(BillingController)
    consumer.apply(HttpMiddleware).forRoutes(InvoicesController)
    consumer.apply(HttpMiddleware).forRoutes(PcMaterialsController)
    consumer.apply(HttpMiddleware).forRoutes(PrescriptionsController)
    consumer.apply(HttpMiddleware).forRoutes(PdfArchiveController)
  }
}
