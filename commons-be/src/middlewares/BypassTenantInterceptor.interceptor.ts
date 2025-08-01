import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class BypassTenantInterceptor implements NestInterceptor {
  constructor () {}
  intercept (context: ExecutionContext, next: CallHandler): Observable<any> {
    const data = context.switchToHttp().getRequest()

    if (data.tenantId) throw new Error('Cannot use the tenantId in this MP')

    const als = global.als
    const store = { bypassTenant: true }
    als.enterWith(store)

    return next.handle()
  }
}
