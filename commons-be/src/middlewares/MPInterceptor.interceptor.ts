import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class MPInterceptor implements NestInterceptor {
  constructor () {}
  intercept (context: ExecutionContext, next: CallHandler): Observable<any> {
    const { tenantId, bypassTenant } = context.switchToHttp().getRequest()

    const als = global.als

    const store = {
      ...(tenantId && { tenantId }),
      ...(tenantId == null && bypassTenant && { bypassTenant }),
    }
    als.enterWith(store)

    return next.handle()
  }
}
