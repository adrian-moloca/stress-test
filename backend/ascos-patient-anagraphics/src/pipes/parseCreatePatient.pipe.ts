import { Patient, SerializedPatient } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
import { toDate } from 'date-fns-tz'

@Injectable()
export class ParseCreatePatient
implements PipeTransform<SerializedPatient, Patient> {
  transform (value: SerializedPatient): Patient {
    const newPatient: Patient = {
      ...value,
      ...(value.birthDate && {
        birthDate: toDate(value.birthDate, {
          timeZone: 'UTC',
        }),
      }),
    }
    return newPatient
  }
}
