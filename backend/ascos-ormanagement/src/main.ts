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

  app.setGlobalPrefix('/api/or-management')
  const configService = app.get(ConfigService)

  const OR_MANAGEMENT_PORT = configService.get('OR_MANAGEMENT_PORT')
  const OR_MANAGEMENT_SERVICE_PORT = configService.get(
    'OR_MANAGEMENT_SERVICE_PORT',
  )
  const OR_MANAGEMENT_SERVICE_LISTEN_HOST = configService.get(
    'OR_MANAGEMENT_SERVICE_LISTEN_HOST', '0.0.0.0'
  ) // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: OR_MANAGEMENT_SERVICE_LISTEN_HOST,
      port: OR_MANAGEMENT_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(OR_MANAGEMENT_PORT)
  logger.log(`OR management application is listening at ${OR_MANAGEMENT_PORT}`)
  logger.log(
    `OR management service is listening at ${OR_MANAGEMENT_SERVICE_PORT}`,
  )
}
bootstrap()
