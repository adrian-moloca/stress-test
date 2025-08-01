import { initSentry, linkSentry } from '@smambu/lib.commons-be'
import { NestFactory } from '@nestjs/core'
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

  app.setGlobalPrefix('/api/bucket')
  const configService = app.get(ConfigService)

  const BUCKET_PORT = configService.get('BUCKET_PORT')
  const BUCKET_SERVICE_PORT = configService.get('BUCKET_SERVICE_PORT')
  const BUCKET_SERVICE_LISTEN_HOST = configService.get('BUCKET_SERVICE_LISTEN_HOST', '0.0.0.0') // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: BUCKET_SERVICE_LISTEN_HOST,
      port: BUCKET_SERVICE_PORT,
    },
  })

  app.use(json({ limit: '50mb' }))
  app.use(compression())
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(BUCKET_PORT)
  logger.log(`Bucket application is listening at ${BUCKET_PORT}`)
}
bootstrap()
