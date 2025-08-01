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

  app.setGlobalPrefix('/api/patientAnagraphics')
  const configService = app.get(ConfigService)

  const PATIENTS_ANAGRAPHICS_PORT = configService.get(
    'PATIENTS_ANAGRAPHICS_PORT',
  )
  const PATIENTS_ANAGRAPHICS_SERVICE_PORT = configService.get(
    'PATIENTS_ANAGRAPHICS_SERVICE_PORT',
  )
  const PATIENTS_ANAGRAPHICS_SERVICE_LISTEN_HOST = configService.get(
    'PATIENTS_ANAGRAPHICS_SERVICE_LISTEN_HOST', '0.0.0.0'
  ) // Defaults to undefined to get the legacy behaviour

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: PATIENTS_ANAGRAPHICS_SERVICE_LISTEN_HOST,
      port: PATIENTS_ANAGRAPHICS_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(PATIENTS_ANAGRAPHICS_PORT)
  logger.log(`Bucket application is listening at ${PATIENTS_ANAGRAPHICS_PORT}`)
}
bootstrap()
