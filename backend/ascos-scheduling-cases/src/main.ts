import { initSentry, linkSentry, ServiceLocator } from '@smambu/lib.commons-be'
import { ModuleRef, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { Logger } from '@nestjs/common'
import { urlencoded, json } from 'express'
import compression from 'compression'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/schedulingcases')
  const configService = app.get(ConfigService)

  const SCHEDULING_CASES_PORT = configService.get('SCHEDULING_CASES_PORT')
  const SCHEDULING_CASES_SERVICE_PORT = configService.get(
    'SCHEDULING_CASES_SERVICE_PORT',
  )
  const SCHEDULING_CASES_SERVICE_LISTEN_HOST = configService.get(
    'SCHEDULING_CASES_SERVICE_LISTEN_HOST', '0.0.0.0'
  ) // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: SCHEDULING_CASES_SERVICE_LISTEN_HOST,
      port: SCHEDULING_CASES_SERVICE_PORT,
    },
  })

  app.use(json({ limit: '50mb' }))
  app.use(compression())
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(SCHEDULING_CASES_PORT)
  logger.log(
    `Scheduling cases application is listening at ${SCHEDULING_CASES_PORT}`,
  )

  ServiceLocator.setModuleRef(app.get(ModuleRef))
}

bootstrap()
