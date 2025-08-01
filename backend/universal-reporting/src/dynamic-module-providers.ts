import { getConnectionToken, getModelToken } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { dynamicEntityRWPlugin, ServiceLocator } from '@smambu/lib.commons-be'
import schemas from './schemas'
import { JsonConfigsService } from './services/json-config.service'
import { URConfigs, VERSIONS_NAMES, RW_PLUGIN_TAG } from '@smambu/lib.constantsjs'

export const dynamicModelProviders = schemas.map(({ name, schema }) => ({
  provide: getModelToken(name),
  useFactory: (conn: Connection) => {
    // @ts-expect-error ref 1434
    schema.plugin(dynamicEntityRWPlugin, {
      tags: [RW_PLUGIN_TAG],
      getConfigurationJSON: async () => {
        const jsonSvc = ServiceLocator.get<JsonConfigsService>(JsonConfigsService)

        return jsonSvc.getTargetConfig(
          VERSIONS_NAMES.LATEST,
          URConfigs.BILLING_CONFIG
        )
      },
    })

    return conn.model(name, schema)
  },
  inject: [getConnectionToken()],
}))
