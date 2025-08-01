import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { BodyToAsyncLocalStorageInterceptor } from '../middlewares/dynamic-changes-map.interceptor'

export function BodyToAsyncLocalStorageDecorator () {
  return applyDecorators(
    UseInterceptors(BodyToAsyncLocalStorageInterceptor),
  )
}
