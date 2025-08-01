import { ModuleRef, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { linkSentry, ServiceLocator } from '@smambu/lib.commons-be'
import { ConfigService } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import compression from 'compression'
import { Logger } from '@nestjs/common'

const logger = new Logger('UR Microservice')

async function bootstrap () {
  const app = await NestFactory.create(AppModule, { cors: true })

  await linkSentry(app)

  app.setGlobalPrefix('/api/ur')
  const configService = app.get(ConfigService)

  const UR_PORT = configService.get('UR_PORT')
  const UR_SERVICE_PORT = configService.get('UR_SERVICE_PORT')
  const UR_SERVICE_LISTEN_HOST = configService.get(
    'UR_SERVICE_LISTEN_HOST', '0.0.0.0'
  )

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: UR_SERVICE_LISTEN_HOST,
      port: UR_SERVICE_PORT,
    },
  })

  app.use(compression())

  app.enableShutdownHooks()
  await app.startAllMicroservices()
  await app.listen(UR_PORT)
  logger.log(
    `Universal Reporting application is listening at ${UR_PORT}`,
  )

  ServiceLocator.setModuleRef(app.get(ModuleRef))
}

bootstrap()
