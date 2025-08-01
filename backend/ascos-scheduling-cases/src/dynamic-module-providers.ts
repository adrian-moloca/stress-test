import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { dynamicEntityRWPlugin, ServiceLocator } from '@smambu/lib.commons-be'
import schemas from './schemas'
import { RW_PLUGIN_TAG } from '@smambu/lib.constantsjs'
import { CasesService } from './services'

export const dynamicModelProviders = schemas.map(({ name, schema }) => ({
  provide: getModelToken(name),
  useFactory: (conn: Connection) => {
    // @ts-expect-error ref 1434
    schema.plugin(dynamicEntityRWPlugin, {
      tags: [RW_PLUGIN_TAG],
      getConfigurationJSON: async () => {
        const casesSvc = ServiceLocator.get<CasesService>(CasesService)

        return casesSvc.getDynamicData()
      },
    })

    return conn.model(name, schema)
  },
  inject: [getConnectionToken()],
}))
