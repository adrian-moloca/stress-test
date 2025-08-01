import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/tenant')
  const configService = app.get(ConfigService)

  const TENANTS_PORT = configService.get('TENANTS_PORT')
  const TENANTS_SERVICE_PORT = configService.get('TENANTS_SERVICE_PORT')
  const TENANTS_SERVICE_LISTEN_HOST = configService.get('TENANTS_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: TENANTS_SERVICE_LISTEN_HOST,
      port: TENANTS_SERVICE_PORT,
    },
  })

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(TENANTS_PORT)
  logger.log(`Tenants application is listening at ${TENANTS_PORT}`)
}
bootstrap()
