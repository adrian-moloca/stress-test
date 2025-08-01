import { backendConfiguration, QUEUE_NAMES } from '@smambu/lib.constantsjs'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import schemas from '../schemas'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AlsModule, ClientProxyWithTenantId, getRedisSentinelConfig, RedisModule } from '@smambu/lib.commons-be'
import { BullModule } from '@nestjs/bullmq'
import { RedisOptions } from 'bullmq'
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
      name: 'SCHEDULING_CASES_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('SCHEDULING_CASES_SERVICE_HOST'),
          port: configService.get('SCHEDULING_CASES_SERVICE_PORT'),
          name: 'SCHEDULING_CASES_CLIENT',
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
      uri: configService.get<string>('mongodb_uri_ormanagement'),
    }),
    inject: [ConfigService],
  }),
  MongooseModule.forFeature(schemas),
  JwtModule.register({ secret: 'jwt_secret_key' }),
  AlsModule,
  RedisModule,
  BullModule.registerQueueAsync(
    {
      imports: [ConfigModule],
      name: QUEUE_NAMES.LocalEventsORMangementQueue,
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }
  ),
  ScheduleModule.forRoot()
]
