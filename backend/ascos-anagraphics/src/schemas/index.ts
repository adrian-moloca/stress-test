import { anagraphicsTypes } from '@smambu/lib.constantsjs'
import { AnagraphicDataSchema } from './anagraphics.schema'
import { BgDebtorNumberSchema } from './bgDebtorNumber.schema'
import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
import { DynamicAnagraphicsSetups, DynamicAnagraphicsSetupsSchema } from './dynamic-anagraphics-setups.schema'

const anagraphicTypesKeys = Object.keys(anagraphicsTypes) as Array<keyof typeof anagraphicsTypes>

const anagraphicsTypesSchema = anagraphicTypesKeys
  .map(key => ({
    name: anagraphicsTypes[key],
    schema: AnagraphicDataSchema,
  }))

export default [
  ...anagraphicsTypesSchema,
  {
    name: 'BgDebtorNumber',
    schema: BgDebtorNumberSchema,
  },
  {
    name: 'DynamicAnagraphics',
    schema: AnagraphicDataSchema,
  },
  {
    name: DynamicAnagraphicsSetups.name,
    schema: DynamicAnagraphicsSetupsSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
