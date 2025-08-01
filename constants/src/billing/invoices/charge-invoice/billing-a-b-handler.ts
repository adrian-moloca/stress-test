import { MissingInfo, RecipientType } from '../../../enums'
import Translator from '../../../translator'
import { GOAAnagraphic, IBillObj, ICasePosition, IUser, Patient } from '../../../types'
import { isValidNumber } from '../../../utils'
import { billPatientFromPatient, debtorFromSurgeon } from '../../debtor-utilities'
import { checkMissingInfo } from '../../generic-utilities'

export const billingABHandler = (
  translator: Translator,
  billObj: IBillObj,
  missingData: string[],
  missingItems: string[],
  surgeon: IUser,
  patient: Patient,
  position: ICasePosition,
  billingCat: string,
  scenario?: number,
  minimumCharge?: number,
  goaAnagraphic?: GOAAnagraphic,
) => {
  let goaPrice
  let goaNumber
  let deliveryFee = 0

  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const billingScenario = checkMissingInfo(
    scenario,
    MissingInfo.contract.billingAB.scenario(billingCat),
    missingData,
    missingItems,
  )

  switch (billingScenario) {
    case 1:
      position.description = translator.fromLabel('no_delivery_fee')
      position.price = 0
      position.priceTotal = 0
      position.amount = 1
      break

    case 2:
      // definitions
      // deliveryFee: case.opStandard.GOA is searched in the GOACategoryA anagraphic, in the Number column, and then the price column is used
      goaPrice = checkMissingInfo(goaAnagraphic?.price,
        MissingInfo.goaAnagraphic.price,
        missingData,
        missingItems,
        [
          NaN,
        ])
      goaNumber = checkMissingInfo(
        goaAnagraphic?.goaNumber,
        MissingInfo.goaAnagraphic.number,
        missingData,
        missingItems,
        [''],
      )
      deliveryFee = goaPrice ?? 0
      position.description = goaAnagraphic?.description || goaNumber || ''
      position.price = deliveryFee
      position.priceTotal = deliveryFee
      position.amount = 1
      break

    case 3:
      // definitions
      // deliveryFee: case.opStandard.GOA <--- goanumber is searched in the GOACategoryA anagraphic, in the Number column, and then the price column is used
      goaPrice = checkMissingInfo(goaAnagraphic?.price,
        MissingInfo.goaAnagraphic.price,
        missingData,
        missingItems,
        [
          NaN,
        ])
      const billingMinCharge =
        checkMissingInfo(
          minimumCharge,
          MissingInfo.contract.billingAB.minimumCharge(billingCat),
          missingData,
          missingItems,
          [NaN],
        ) ?? 0
      deliveryFee = goaPrice ?? 0

      goaNumber = checkMissingInfo(
        goaAnagraphic?.goaNumber,
        MissingInfo.goaAnagraphic.number,
        missingData,
        missingItems,
        [''],
      )
      position.description = goaAnagraphic?.description || goaNumber || ''
      // position.price: the largest between deliveryFee and surgeon.contract.catA.minimumCharge
      position.price = Math.max(deliveryFee, billingMinCharge)
      // position.priceTotal: the largest between deliveryFee and surgeon.contract.catA.minimumCharge
      position.priceTotal = Math.max(deliveryFee, billingMinCharge)
      position.amount = 1
      break

    // there is no default because a contract an exists without a specific scenario set
    // e.g. when a surgeon knows that he won't do B operations
    // if the scenario is needed at some point it will pop up in the missing section
  }

  billObj.positions = [position]
  billObj.totalSum = isNaN(position.priceTotal) ? 0 : position.priceTotal
  billObj.totalOwed = isValidNumber(position.priceTotal) ? position.priceTotal : 0
}
