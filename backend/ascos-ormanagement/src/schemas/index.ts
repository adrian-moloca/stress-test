import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
import { OperatingRoomClass, OperatingRoomSchema } from './orManagement.schema'
import { OrSchedulingClass, OrSchedulingSchema } from './orScheduling.schema'

export default [
  {
    name: OperatingRoomClass.name,
    schema: OperatingRoomSchema,
  }, {
    name: OrSchedulingClass.name,
    schema: OrSchedulingSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
