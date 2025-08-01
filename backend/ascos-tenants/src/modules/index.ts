import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import schemas from '../schemas'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { backendConfiguration } from '@smambu/lib.constantsjs'
import { BullModule } from '@nestjs/bull'
import { NAMES } from 'src/utilities/constants'
import { getRedisSentinelConfig } from '@smambu/lib.commons-be'

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
        },
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
        },
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
        },
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
        },
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
      }),
      inject: [ConfigService],
    },
  ]),
  ClientsModule.registerAsync([
    {
      name: 'CONTRACTS_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('CONTRACT_SERVICE_HOST'),
          port: configService.get('CONTRACT_SERVICE_PORT'),
          name: 'CONTRACTS_CLIENT',
        },
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
        },
      }),
      inject: [ConfigService],
    },
  ]),
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      uri: configService.get<string>('mongodb_uri_tenants'),
    }),
    inject: [ConfigService],
  }),
  MongooseModule.forFeature(schemas),
  JwtModule.register({ secret: 'jwt_secret_key' }),
  BullModule.registerQueueAsync({
    name: NAMES.CopierQueue,
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      redis: getRedisSentinelConfig(configService)
    }),
    inject: [ConfigService],
  })
]
