import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
import { Patient, PatientSchema } from './patient.schema'

export default [
  {
    name: Patient.name,
    schema: PatientSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  }
]
