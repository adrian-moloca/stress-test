import { Module } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'

@Module({
  providers: [
    {
      provide: AsyncLocalStorage<{ tenantId: string }>,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
