import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import schema from '../schemas'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { backendConfiguration, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import { AlsModule, ClientProxyWithTenantId, getRedisSentinelConfig, RedisModule } from '@smambu/lib.commons-be'
import { BullModule } from '@nestjs/bullmq'
import { ScheduleModule } from '@nestjs/schedule'
import { RedisOptions } from 'bullmq'

const ENV = process.env.NODE_ENV

export default [
  ConfigModule.forRoot({
    envFilePath: !ENV ? '../../.env' : `../../.env.${ENV}`,
    isGlobal: true,
    load: [backendConfiguration],
  }),
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
      name: 'ROLE_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('ROLE_SERVICE_HOST'),
          port: configService.get('ROLE_SERVICE_PORT'),
          name: 'ROLE_CLIENT',
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
      name: 'NOTIFICATIONS_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('NOTIFICATIONS_SERVICE_HOST'),
          port: configService.get('NOTIFICATIONS_SERVICE_PORT'),
          name: 'NOTIFICATIONS_CLIENT',
        },
        customClass: ClientProxyWithTenantId,
      }),
      inject: [ConfigService],
    },
  ]),
  ClientsModule.registerAsync([
    {
      name: 'TENANTS_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('TENANTS_SERVICE_HOST'),
          port: configService.get('TENANTS_SERVICE_PORT'),
        },
        customClass: ClientProxyWithTenantId,
      }),
      inject: [ConfigService],
    },
  ]),
  ClientsModule.registerAsync([
    {
      name: 'UR_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('UR_SERVICE_HOST'),
          port: configService.get('UR_SERVICE_PORT'),
          name: 'UR_CLIENT',
        },
        customClass: ClientProxyWithTenantId,
      }),
      inject: [ConfigService],
    },
  ]),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('mongodb_uri_users'),
    }),
    inject: [ConfigService],
  }),
  JwtModule.registerAsync({
    useFactory: (config: ConfigService) => {
      return {
        secret: config.get<string>('JWT_SECRET'),
      }
    },
    inject: [ConfigService],
  }),
  MongooseModule.forFeature(schema),
  AlsModule,
  RedisModule,
  BullModule.registerQueueAsync(
    {
      imports: [ConfigModule],
      name: QUEUE_NAMES.LocalEventsUserQueue,
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }
  ),
  ScheduleModule.forRoot()
]
