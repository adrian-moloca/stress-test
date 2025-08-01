import { Response } from 'express'
import { Controller, Get, Res, HttpStatus, UseInterceptors } from '@nestjs/common'
import { Connection } from 'mongoose'
import { InjectConnection } from '@nestjs/mongoose'
import { LoggingInterceptor } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class HealthController {
  constructor (@InjectConnection() private readonly connection: Connection) { }

  @Get('/healthz')
  healthz (@Res() res: Response) {
    const connectionOk = this.connection.readyState === 1

    if (!connectionOk)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ health: 'ko' })

    res.status(HttpStatus.OK).json({ health: 'ok' })
  }
}
