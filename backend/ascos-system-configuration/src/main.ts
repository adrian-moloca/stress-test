import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import compression from 'compression'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/system-configuration')
  const configService = app.get(ConfigService)

  const SYSTEM_CONFIGURATION_PORT = configService.get('SYSTEM_CONFIGURATION_PORT')
  const SYSTEM_CONFIGURATION_SERVICE_PORT = configService.get('SYSTEM_CONFIGURATION_SERVICE_PORT')
  const SYSTEM_CONFIGURATION_SERVICE_LISTEN_HOST = configService.get('SYSTEM_CONFIGURATION_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: SYSTEM_CONFIGURATION_SERVICE_LISTEN_HOST,
      port: SYSTEM_CONFIGURATION_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(SYSTEM_CONFIGURATION_PORT)
  logger.log(`System Configuration application is listening at ${SYSTEM_CONFIGURATION_PORT}`)
  logger.log(`System Configuration service is listening at ${SYSTEM_CONFIGURATION_SERVICE_PORT}`)
}
bootstrap()
