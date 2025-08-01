import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { urlencoded, json } from 'express'
import compression from 'compression'

const logger = new Logger('Microservice')

async function bootstrap () {
  const sentryInitizalized = await initSentry()

  const app = await NestFactory.create(AppModule, { cors: true })

  if (sentryInitizalized)
    await linkSentry(app)

  app.setGlobalPrefix('/api/anagraphics')
  const configService = app.get(ConfigService)

  const ANAGRAPHICS_PORT = configService.get('ANAGRAPHICS_PORT')
  const ANAGRAPHICS_SERVICE_PORT = configService.get('ANAGRAPHICS_SERVICE_PORT')
  const ANAGRAPHICS_SERVICE_LISTEN_HOST = configService.get('ANAGRAPHICS_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: ANAGRAPHICS_SERVICE_LISTEN_HOST,
      port: ANAGRAPHICS_SERVICE_PORT,
    },
  })

  app.use(json({ limit: '50mb' }))
  app.use(compression())
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(ANAGRAPHICS_PORT)
  logger.log(`Anagraphics application is listening at ${ANAGRAPHICS_PORT}`)
  logger.log(`Anagraphics service is listening at ${ANAGRAPHICS_SERVICE_PORT}`)
}
bootstrap()
