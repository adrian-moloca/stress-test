import { CaseForm, CaseFormDTO, formatCaseForm } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
import { isValid } from 'date-fns'
import { toDate } from 'date-fns-tz'

@Injectable()
export class ParseCreateCase implements PipeTransform<CaseFormDTO, CaseForm> {
  transform (value: CaseFormDTO): CaseForm {
    const newCase = formatCaseForm(value)

    newCase.bookingSection.date = new Date(newCase.bookingSection.date)
    const birthdate = toDate(value?.bookingPatient?.birthDate, {
      timeZone: 'UTC',
    })

    if (isValid(birthdate))
      newCase.bookingPatient.birthDate = birthdate

    delete newCase.associatedPatient

    return newCase
  }
}
