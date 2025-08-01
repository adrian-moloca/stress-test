import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { tAsyncLocalStorage, tBodyWithDynamicChanges } from '@smambu/lib.constantsjs'
import { Observable } from 'rxjs'

@Injectable()
export class BodyToAsyncLocalStorageInterceptor implements NestInterceptor {
  intercept (context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()

    if (req.method !== 'POST')
      return next.handle()

    const payload:tBodyWithDynamicChanges = req.body

    const changesMap = payload.changesMap

    const changedKeys = Object.keys(changesMap)

    if (changedKeys.length === 0)
      return next.handle()

    const als = global.als

    const store:tAsyncLocalStorage = { dynamicChangesMap: changesMap }

    als.enterWith(store)

    return next.handle()
  }
}
