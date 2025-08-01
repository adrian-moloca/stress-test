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

  app.setGlobalPrefix('/api/role')
  const configService = app.get(ConfigService)

  const ROLE_PORT = configService.get('ROLE_PORT')
  const ROLE_SERVICE_PORT = configService.get('ROLE_SERVICE_PORT')
  const ROLE_SERVICE_LISTEN_HOST = configService.get('ROLE_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: ROLE_SERVICE_LISTEN_HOST,
      port: ROLE_SERVICE_PORT,
    },
  })

  app.use(compression())
  app.enableShutdownHooks()

  await app.startAllMicroservices()
  await app.listen(ROLE_PORT)
  logger.log(`Role application is listening at ${ROLE_PORT}`)
  logger.log(`Role service is listening at ${ROLE_SERVICE_PORT}`)
}
bootstrap()
