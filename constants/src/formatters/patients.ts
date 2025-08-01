import { isValid } from 'date-fns'
import { formatDateNaive } from './users'
import { SerializedPatient } from '../dto'

export const serializePatient = (patient: any): SerializedPatient => ({
  ...patient,
  birthDate: isValid(patient?.birthDate) ? formatDateNaive(patient.birthDate) : undefined,
})
