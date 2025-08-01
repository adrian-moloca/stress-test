import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { backendConfiguration, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import { ScheduleModule } from '@nestjs/schedule'
import * as urServices from './services'
import * as urConsumers from './consumers'
import * as urControllers from './controllers'
import * as urAdminControllers from './admin-controllers'
import {
  AlsModule, ClientProxyWithTenantId,
  EnvConfigsService,
  getRedisSentinelConfig, HealthController, HttpMiddleware,
  LocalEventsService, LoggingService, RedisModule, SuperAdminHttpMiddleware
} from '@smambu/lib.commons-be'
import { MongooseModule } from '@nestjs/mongoose'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { BullModule } from '@nestjs/bullmq'
import { RedisOptions } from 'bullmq'
import { dynamicModelProviders } from './dynamic-module-providers'

const ENV = process.env.NODE_ENV
const customEnvSuffix = ENV == null || ENV === '' ? '' : `.${ENV}`
// TODO: this needs a better approach (i.e. it needs to break when the env is not
// provided, instead of having all undefined values).
// This might be tricky to do with the gcp and docker envs
const basePath = '../../.env'

const envFilePath = `${basePath}${customEnvSuffix}`

const controllers = Object.values(urControllers)
const adminControllers = Object.values(urAdminControllers)
const services = Object.values(urServices)
const consumers = Object.values(urConsumers)

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
      load: [backendConfiguration],
    }),
    ClientsModule.registerAsync([
      {
        name: 'ANAGRAPHICS_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('ANAGRAPHICS_SERVICE_HOST'),
            port: configService.get('ANAGRAPHICS_SERVICE_PORT'),
            name: 'ANAGRAPHICS_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_SERVICE_HOST'),
            port: configService.get('AUTH_SERVICE_PORT'),
            name: 'AUTH_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'CASES_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('SCHEDULING_CASES_SERVICE_HOST'),
            port: configService.get('SCHEDULING_CASES_SERVICE_PORT'),
            name: 'CASES_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'CONTRACT_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CONTRACT_SERVICE_HOST'),
            port: configService.get('CONTRACT_SERVICE_PORT'),
            name: 'CONTRACT_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'LOGS_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('LOGS_SERVICE_HOST'),
            port: configService.get('LOGS_SERVICE_PORT'),
            name: 'LOGS_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'OR_MANAGEMENT_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('OR_MANAGEMENT_SERVICE_HOST'),
            port: configService.get('OR_MANAGEMENT_SERVICE_PORT'),
            name: 'OR_MANAGEMENT_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'PATIENTS_ANAGRAPHICS_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PATIENTS_ANAGRAPHICS_SERVICE_HOST'),
            port: configService.get('PATIENTS_ANAGRAPHICS_SERVICE_PORT'),
            name: 'PATIENTS_ANAGRAPHICS_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'SYSTEM_CONFIGURATION_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('SYSTEM_CONFIGURATION_SERVICE_HOST'),
            port: configService.get('SYSTEM_CONFIGURATION_SERVICE_PORT'),
            name: 'SYSTEM_CONFIGURATION_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'USERS_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('USER_SERVICE_HOST'),
            port: configService.get('USER_SERVICE_PORT'),
            name: 'USERS_CLIENT',
          },
          customClass: ClientProxyWithTenantId,
        }),
        inject: [ConfigService],
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb_uri_ur'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AlsModule,
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.URTriggerEvents,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }, {
      name: QUEUE_NAMES.LocalEventsURQueue,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }, {
      name: QUEUE_NAMES.GraphFieldsQueue,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }, {
      name: QUEUE_NAMES.DepenenciesGraphQueue,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [...controllers, ...adminControllers, HealthController],
  providers: [...services,
    ...consumers,
    ...dynamicModelProviders,
    EnvConfigsService,
    LoggingService,
    LocalEventsService],
})

export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes(...controllers)

    consumer
      .apply(SuperAdminHttpMiddleware)
      .forRoutes(...adminControllers)
  }
}
