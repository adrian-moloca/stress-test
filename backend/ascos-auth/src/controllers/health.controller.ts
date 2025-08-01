import { Response } from 'express'
import { Controller, Get, Res, HttpStatus, UseInterceptors } from '@nestjs/common'
import { LoggingInterceptor } from '@smambu/lib.commons-be'

@UseInterceptors(LoggingInterceptor)
@Controller()
export class HealthController {
  @Get('/healthz')
  healthz (@Res() res: Response) {
    res.status(HttpStatus.OK).json({ health: 'ok' })
  }
}
