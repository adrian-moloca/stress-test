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

  app.setGlobalPrefix('/api/user')
  const configService = app.get(ConfigService)

  const USER_PORT = configService.get('USER_PORT')
  const USER_SERVICE_PORT = configService.get('USER_SERVICE_PORT')
  const USER_SERVICE_LISTEN_HOST = configService.get('USER_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: USER_SERVICE_LISTEN_HOST,
      port: USER_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()

  await app.startAllMicroservices()
  await app.listen(USER_PORT)
  logger.log(`User application is listening at ${USER_PORT}`)
  logger.log(`User service is listening at ${USER_SERVICE_PORT}`)
}
bootstrap()
