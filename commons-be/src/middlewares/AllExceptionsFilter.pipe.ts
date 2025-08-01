import { IGenericError, parseErrorMessage } from '@smambu/lib.constantsjs'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import * as Sentry from '@sentry/node'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor (private readonly httpAdapterHost: HttpAdapterHost) { }

  catch (exception: IGenericError, host: ArgumentsHost): void {
    console.error('Error catched\n', exception)
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    const httpStatus =
      exception instanceof HttpException && exception.getStatus() in HttpStatus
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message = parseErrorMessage(exception)

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: { message },
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)

    Sentry.captureException(exception)
  }
}
