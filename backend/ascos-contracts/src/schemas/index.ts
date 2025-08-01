import { Contract, ContractSchema } from './contracts.schema'
import { SurgerySlot, SurgerySlotSchema } from './surgerySlots.schema'
import { AnesthesiologistOpStandardSchema, AnesthesiologistOpStandard } from './anesthesiologistOPStandard.schema'
import { OpStandard, OpStandardSchema } from './opStandard.schema'
import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'

export default [
  {
    name: Contract.name,
    schema: ContractSchema,
  },
  {
    name: SurgerySlot.name,
    schema: SurgerySlotSchema,
  },
  {
    name: AnesthesiologistOpStandard.name,
    schema: AnesthesiologistOpStandardSchema,
  },
  {
    name: OpStandard.name,
    schema: OpStandardSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
