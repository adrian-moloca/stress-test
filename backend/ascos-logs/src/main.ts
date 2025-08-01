import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'
import compression from 'compression'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/log')
  const configService = app.get(ConfigService)

  const LOGS_PORT = configService.get('LOGS_PORT')
  const LOGS_SERVICE_PORT = configService.get('LOGS_SERVICE_PORT')
  const LOGS_SERVICE_LISTEN_HOST = configService.get(
    'LOGS_SERVICE_LISTEN_HOST', '0.0.0.0'
  )

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: LOGS_SERVICE_LISTEN_HOST,
      port: LOGS_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(LOGS_PORT)
  logger.log(`Logs application is listening at ${LOGS_PORT}`)
  logger.log(`Logs service is listening at ${LOGS_SERVICE_PORT}`)
}
bootstrap()
