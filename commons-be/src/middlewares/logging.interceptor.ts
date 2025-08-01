import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

const ids = {} as Record<string, number>
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept (context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = (context as any).contextType
    const constructorName = (context as any).constructorRef.name
    const handlerName = (context as any).handler.name

    if (!ids[constructorName]) ids[constructorName] = 0

    const id = ids[constructorName]++
    const tag = `interceptor ${contextType} ${constructorName} - ${handlerName} ${id}`

    if (!process.env.DISABLE_INTERCEPTOR_LOGS)
      // eslint-disable-next-line no-console
      console.log(`Start ${tag} at ${new Date().toISOString()}`)

    const now = Date.now()
    return next.handle().pipe(
      tap(() => {
        if (!process.env.DISABLE_INTERCEPTOR_LOGS)
          // eslint-disable-next-line no-console
          console.log(`End ${tag} at ${new Date().toISOString()} in ${Date.now() - now}ms`)
      }),
    )
  }
}
