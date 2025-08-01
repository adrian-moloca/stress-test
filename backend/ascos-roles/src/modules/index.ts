import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import schemas from '../schemas'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { backendConfiguration, QUEUE_NAMES } from '@smambu/lib.constantsjs'
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
      uri: configService.get<string>('mongodb_uri_roles'),
      socketTimeoutMS: configService.get<number>('mongodb_socket_timeout_ms', 30000),
      connectionFactory: connection => {
        connection.on('reconnected', () => {
          console.warn('MongoDB connection reconnected!')
        })
        connection.on('disconnected', () => {
          console.error('MongoDB connection disconnected!')
        })
        connection.on('error', error => {
          console.error('MongoDB connection error! [1]', error)
          return error
        })
        return connection
      },
      connectionErrorFactory: error => {
        console.error('MongoDB connection error! [2]', error)
        return error
      }
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
      name: QUEUE_NAMES.LocalEventsRolesQueue,
      useFactory: (configService: ConfigService) => ({
        connection: getRedisSentinelConfig(configService) as RedisOptions,
      }),
      inject: [ConfigService],
    }
  ),
  ScheduleModule.forRoot()
]
