import { linkSentry, initSentry } from '@smambu/lib.commons-be'
import compression from 'compression'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'

import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/auth')
  const configService = app.get(ConfigService)

  const AUTH_PORT = configService.get('AUTH_PORT')
  const AUTH_SERVICE_PORT = configService.get('AUTH_SERVICE_PORT')
  const AUTH_SERVICE_LISTEN_HOST = configService.get('AUTH_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: AUTH_SERVICE_LISTEN_HOST,
      port: AUTH_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(AUTH_PORT)
  logger.log(`Auth application is listening at ${AUTH_PORT}`)
  logger.log(`Auth service is listening at ${AUTH_SERVICE_PORT}`)
}
bootstrap()
