import { UpdateCaseDTO, UpdateCasePayload, formatCaseForm } from '@smambu/lib.constantsjs'
import { PipeTransform, Injectable } from '@nestjs/common'
import { isValid } from 'date-fns'
import { toDate } from 'date-fns-tz'

@Injectable()
export class ParseUpdateCase implements PipeTransform<UpdateCaseDTO, UpdateCasePayload> {
  transform (value: UpdateCaseDTO): UpdateCasePayload {
    const originalCase = value.caseData

    const newCase = formatCaseForm(originalCase)

    newCase.bookingSection.date = new Date(newCase.bookingSection.date)

    const birthdate = toDate(originalCase?.bookingPatient?.birthDate, {
      timeZone: 'UTC',
    })

    if (isValid(birthdate))
      newCase.bookingPatient.birthDate = birthdate

    delete newCase.associatedPatient

    const originalEditTS = value.caseLoadedAtTS
    const parsedEditTS = toDate(originalEditTS, { timeZone: 'UTC' })

    return {
      ...value,
      caseData: newCase,
      caseLoadedAtTS: parsedEditTS,
    }
  }
}
