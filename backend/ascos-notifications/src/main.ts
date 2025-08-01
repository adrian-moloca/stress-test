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

  app.setGlobalPrefix('/api/notifications')
  const configService = app.get(ConfigService)

  const NOTIFICATIONS_PORT = configService.get('NOTIFICATIONS_PORT')
  const NOTIFICATIONS_SERVICE_PORT = configService.get('NOTIFICATIONS_SERVICE_PORT')
  const NOTIFICATIONS_SERVICE_LISTEN_HOST = configService.get('NOTIFICATIONS_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: NOTIFICATIONS_SERVICE_LISTEN_HOST,
      port: NOTIFICATIONS_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(NOTIFICATIONS_PORT)
  logger.log(`Notifications application is listening at ${NOTIFICATIONS_PORT}`)
  logger.log(`Notifications service is listening at ${NOTIFICATIONS_SERVICE_PORT}`)
}
bootstrap()
