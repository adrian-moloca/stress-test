import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'
import compression from 'compression'

const logger = new Logger('Billing Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/billing')
  const configService = app.get(ConfigService)

  const BILLING_PORT = configService.get('BILLING_PORT')
  const BILLING_SERVICE_PORT = configService.get('BILLING_SERVICE_PORT')
  const BILLING_SERVICE_LISTEN_HOST = configService.get(
    'BILLING_SERVICE_LISTEN_HOST', '0.0.0.0'
  ) // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: BILLING_SERVICE_LISTEN_HOST,
      port: BILLING_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(BILLING_PORT)
  logger.log(
    `Billing application is listening at ${BILLING_PORT}`,
  )
}
bootstrap()
