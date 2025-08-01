import { tAsyncLocalStorage } from '@smambu/lib.constantsjs'
import { AsyncLocalStorage } from 'async_hooks'

export * from './controllers'
export * from './middlewares'
export * from './modules'
export * from './services'
export * from './schemas'
export * from './utilities'
export * from './utilities/redis-utils'
export * from './utilities/redlock'
export * from './types'
export * from './misc'
export * from './decorators'

declare global {
  // eslint-disable-next-line no-var
  var als: AsyncLocalStorage<tAsyncLocalStorage>
}
