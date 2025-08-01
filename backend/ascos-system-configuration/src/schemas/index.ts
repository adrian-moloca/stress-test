import { systemConfigurationSections } from '@smambu/lib.constantsjs'
import { SystemConfigurationDataSchema } from './systemConfiguration.schema'
import { ReceiptNumbersSchema } from './ReceiptNumbers'
import { NumberingSystemSchema } from './numberingSystem.schema'
import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'

const systemConfigurationSectionsSchema = (
  Object.keys(systemConfigurationSections) as Array<keyof typeof systemConfigurationSections>
).map(key => ({
  name: systemConfigurationSections[key],
  schema: SystemConfigurationDataSchema,
}))

export default [
  ...systemConfigurationSectionsSchema,
  {
    name: 'ReceiptNumbers',
    schema: ReceiptNumbersSchema,
  },
  {
    name: 'NumberingSystem',
    schema: NumberingSystemSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
