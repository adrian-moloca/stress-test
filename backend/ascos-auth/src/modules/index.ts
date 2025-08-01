import { AlsModule, ClientProxyWithTenantId } from '@smambu/lib.commons-be'
import { backendConfiguration } from '@smambu/lib.constantsjs'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ClientsModule, Transport } from '@nestjs/microservices'

const ENV = process.env.NODE_ENV

export default [
  ConfigModule.forRoot({
    envFilePath: !ENV ? '../../.env' : `../../.env.${ENV}`,
    isGlobal: true,
    load: [backendConfiguration],
  }),
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
      name: 'ROLE_CLIENT',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('ROLE_SERVICE_HOST'),
          port: configService.get('ROLE_SERVICE_PORT'),
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
          port: configService.get('TENANTS_SERVICE_PORT')
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
          port: configService.get('TENANTS_SERVICE_PORT')
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
        },
      }),
      inject: [ConfigService],
    },
  ]),
  JwtModule.registerAsync({
    useFactory: (config: ConfigService) => {
      return {
        secret: config.get<string>('JWT_SECRET'),
      }
    },
    inject: [ConfigService],
  }),
  AlsModule,
]
