import { MissingInfo } from '../enums'
import { IDebtor, IParsedBG, IUser, Patient, ThirdPartyBillingContact } from '../types'
import { checkMissingInfo } from './generic-utilities'

export const billPatientFromPatient = (
  patient: Patient,
  missingData: string[],
  missingItems: string[],
): Partial<Patient> => ({
  name: checkMissingInfo(patient.name, MissingInfo.bookingPatient.name, missingData, missingItems, ['']),
  surname: checkMissingInfo(patient.surname, MissingInfo.bookingPatient.surname, missingData, missingItems, ['']),
  birthDate: checkMissingInfo(patient.birthDate,
    MissingInfo.bookingPatient.birthDate,
    missingData,
    missingItems),
  patientId: checkMissingInfo(patient.patientId, MissingInfo.bookingPatient.patientId, missingData, missingItems, ['']),
})

export const debtorFromSurgeon = (surgeon: IUser,
  missingData: string[],
  missingItems: string[]): IDebtor => {
  const debtor = <IDebtor>{
    debtorNumber: checkMissingInfo(
      `${surgeon.debtorNumber}`,
      MissingInfo.surgeon.debtorNumber,
      missingData,
      missingItems,
      [''],
    ),
    title: surgeon.title,
    firstName: checkMissingInfo(surgeon.firstName, MissingInfo.surgeon.firstName, missingData, missingItems, ['']),
    lastName: checkMissingInfo(surgeon.lastName, MissingInfo.surgeon.lastName, missingData, missingItems, ['']),
    street: checkMissingInfo(surgeon.address.street,
      MissingInfo.surgeon.address.street,
      missingData,
      missingItems,
      [
        '',
      ]),
    houseNumber: checkMissingInfo(
      surgeon.address.houseNumber,
      MissingInfo.surgeon.address.houseNumber,
      missingData,
      missingItems,
      [''],
    ),
    postalCode: checkMissingInfo(
      surgeon.address.postalCode,
      MissingInfo.surgeon.address.postalCode,
      missingData,
      missingItems,
      [''],
    ),
    city: checkMissingInfo(surgeon.address.city, MissingInfo.surgeon.address.city, missingData, missingItems, ['']),
    country: checkMissingInfo(surgeon.address.country,
      MissingInfo.surgeon.address.country,
      missingData,
      missingItems,
      [
        '',
      ]),
    isDoctor: true,
    practiceName: surgeon.practiceName,
  }

  return debtor
}

export const debtorFromPatient = (patient: Patient,
  missingData: string[],
  missingItems: string[]): IDebtor => {
  const debtor = <IDebtor>{
    debtorNumber: checkMissingInfo(
      patient.debtorNumber,
      MissingInfo.bookingPatient.debtorNumber,
      missingData,
      missingItems,
      [''],
    ),
    title: patient.title,
    firstName: checkMissingInfo(patient.name, MissingInfo.bookingPatient.name, missingData, missingItems, ['']),
    lastName: checkMissingInfo(patient.surname, MissingInfo.bookingPatient.surname, missingData, missingItems, ['']),
    street: checkMissingInfo(
      patient.address.street,
      MissingInfo.bookingPatient.address.street,
      missingData,
      missingItems,
      [''],
    ),
    houseNumber: checkMissingInfo(
      patient.address.houseNumber,
      MissingInfo.bookingPatient.address.houseNumber,
      missingData,
      missingItems,
      [''],
    ),
    postalCode: checkMissingInfo(
      patient.address.postalCode,
      MissingInfo.bookingPatient.address.postalCode,
      missingData,
      missingItems,
      [''],
    ),
    city: checkMissingInfo(patient.address.city,
      MissingInfo.bookingPatient.address.city,
      missingData,
      missingItems,
      [
        '',
      ]),
    country: checkMissingInfo(
      patient.address.country,
      MissingInfo.bookingPatient.address.country,
      missingData,
      missingItems,
      [''],
    ),
  }

  return debtor
}

export const debtorFromBG = (bg: IParsedBG | undefined,
  missingData: string[],
  missingItems: string[]): IDebtor => {
  const debtor = <IDebtor>{
    debtorNumber: checkMissingInfo(
      bg?.debtorNumber,
      MissingInfo.bg.debtorNumber,
      missingData,
      missingItems,
      [''],
    ),
    firstName: checkMissingInfo(bg?.firstName, MissingInfo.bg.firstName, missingData, missingItems, ['']),
    lastName: checkMissingInfo(bg?.lastName, MissingInfo.bg.lastName, missingData, missingItems, ['']),
    street: checkMissingInfo(bg?.address.street,
      MissingInfo.bg.address.street,
      missingData,
      missingItems,
      [
        '',
      ]),
    houseNumber: checkMissingInfo(
      bg?.address.houseNumber,
      MissingInfo.bg.address.houseNumber,
      missingData,
      missingItems,
      [''],
    ),
    postalCode: checkMissingInfo(
      bg?.address.postalCode,
      MissingInfo.bg.address.postalCode,
      missingData,
      missingItems,
      [''],
    ),
    city: checkMissingInfo(bg?.address.city, MissingInfo.bg.address.city, missingData, missingItems, ['']),
    country: checkMissingInfo(
      bg?.address.country,
      MissingInfo.bg.address.country,
      missingData,
      missingItems,
      [''],
    ),
  }
  return debtor
}

export const debtorFromThirdParty = (
  thirdParty: ThirdPartyBillingContact | null,
  missingData: string[],
  missingItems: string[],
): IDebtor => {
  const debtor = <IDebtor>{
    debtorNumber: checkMissingInfo(
      thirdParty?.thirdPartyDebtorNumber,
      MissingInfo.billingSection.thirdPartyBillingContact.debtorNumber,
      missingData,
      missingItems,
      [''],
    ),
    firstName: checkMissingInfo(
      thirdParty?.name,
      MissingInfo.billingSection.thirdPartyBillingContact.name,
      missingData,
      missingItems,
      [''],
    ),
    lastName: checkMissingInfo(
      thirdParty?.surname,
      MissingInfo.billingSection.thirdPartyBillingContact.surname,
      missingData,
      missingItems,
      [''],
    ),
    street: checkMissingInfo(
      thirdParty?.address.street,
      MissingInfo.billingSection.thirdPartyBillingContact.address.street,
      missingData,
      missingItems,
      [''],
    ),
    houseNumber: checkMissingInfo(
      thirdParty?.address.houseNumber,
      MissingInfo.billingSection.thirdPartyBillingContact.address.houseNumber,
      missingData,
      missingItems,
      [''],
    ),
    postalCode: checkMissingInfo(
      thirdParty?.address.postalCode,
      MissingInfo.billingSection.thirdPartyBillingContact.address.postalCode,
      missingData,
      missingItems,
      [''],
    ),
    city: checkMissingInfo(
      thirdParty?.address.city,
      MissingInfo.billingSection.thirdPartyBillingContact.address.city,
      missingData,
      missingItems,
      [''],
    ),
    country: checkMissingInfo(
      thirdParty?.address.country,
      MissingInfo.billingSection.thirdPartyBillingContact.address.country,
      missingData,
      missingItems,
      [''],
    ),
  }

  return debtor
}
