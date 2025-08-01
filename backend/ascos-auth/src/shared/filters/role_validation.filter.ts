import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { RpcException } from '@nestjs/microservices'

@Catch(RpcException)
export class ValidationFilter implements RpcExceptionFilter<RpcException> {
  catch (exception: RpcException, _host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError())
  }
}
