import { initSentry, linkSentry, ServiceLocator } from '@smambu/lib.commons-be'
import { ModuleRef, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'
import { json, urlencoded } from 'express'
import compression from 'compression'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/contract')
  const configService = app.get(ConfigService)

  const CONTRACT_PORT = configService.get('CONTRACT_PORT')
  const CONTRACT_SERVICE_PORT = configService.get('CONTRACT_SERVICE_PORT')
  const CONTRACT_SERVICE_LISTEN_HOST = configService.get(
    'CONTRACT_SERVICE_LISTEN_HOST', '0.0.0.0'
  ) // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: CONTRACT_SERVICE_LISTEN_HOST,
      port: CONTRACT_SERVICE_PORT,
    },
  })

  app.use(compression())
  app.use(json({ limit: '50mb' }))
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(CONTRACT_PORT)
  logger.log(`Contract application is listening at ${CONTRACT_PORT}`)
  logger.log(`Contract service is listening at ${CONTRACT_SERVICE_PORT}`)

  ServiceLocator.setModuleRef(app.get(ModuleRef))
}

bootstrap()
