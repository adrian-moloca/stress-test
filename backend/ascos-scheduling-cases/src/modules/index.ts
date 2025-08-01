import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import schemas from '../schemas'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { backendConfiguration, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import { AlsModule, ClientProxyWithTenantId, getRedisSentinelConfig, RedisModule } from '@smambu/lib.commons-be'
import { BullModule } from '@nestjs/bullmq'
import { RedisOptions } from 'ioredis'
import { ScheduleModule } from '@nestjs/schedule'

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
      name: 'BILLING_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('BILLING_SERVICE_HOST'),
          port: configService.get('BILLING_SERVICE_PORT'),
          name: 'BILLING_CLIENT',
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
      name: 'BUCKET_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('BUCKET_SERVICE_HOST'),
          port: configService.get('BUCKET_SERVICE_PORT'),
          name: 'BUCKET_CLIENT',
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
      uri: configService.get<string>('mongodb_uri_scheduling_cases'),
    }),
    inject: [ConfigService],
  }),
  MongooseModule.forFeature(schemas),
  JwtModule.register({ secret: 'jwt_secret_key' }),
  RedisModule,
  AlsModule,
  BullModule.registerQueueAsync(
    {
      imports: [ConfigModule],
      name: QUEUE_NAMES.LocalEventsSchedulingCasesQueue,
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }
  ),
  ScheduleModule.forRoot(),
]
