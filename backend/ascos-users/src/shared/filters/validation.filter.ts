import { ErrorDto, ValidationException } from '@smambu/lib.constantsjs'
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch (exception: ValidationException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()

    const resp: ErrorDto = {
      message: exception.message,
      errors: exception.validationErrors,
    }

    response.status(status).json(resp)
  }
}
