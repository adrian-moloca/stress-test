import { Type } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'

export class ServiceLocator {
  private static moduleRef: ModuleRef

  static setModuleRef (ref: ModuleRef) {
    ServiceLocator.moduleRef = ref
  }

  static get<T>(type: Type<T>, options = { strict: false }): T {
    if (!ServiceLocator.moduleRef)
      throw new Error('ServiceLocator was not initialized')

    return ServiceLocator.moduleRef.get(type, options)
  }
}
