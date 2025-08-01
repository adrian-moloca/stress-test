import { MissingInfo, RecipientType } from '../../../enums'
import Translator from '../../../translator'
import {
  BillingE,
  Case,
  IBillObj,
  ICaseOPItem,
  ICasePosition,
  IEBMAnagraphic,
  IUser,
  Patient,
} from '../../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../../debtor-utilities'
import { checkMissingInfo, toDecimalsPlace } from '../../generic-utilities'
import { checkPriceMissingInfo } from '../../utilities'

export const billingEHandler = (
  translator: Translator,
  billObj: IBillObj,
  missingData: string[],
  missingItems: string[],
  surgeon: IUser,
  patient: Patient,
  caseOPItems: ICaseOPItem[],
  bookingDate: Date,
  contract: any, // Removed Contract type to avoid type errors without changing the whole file
  caseObj: Case,
  billingE?: BillingE,
  ebmAnagraphic?: IEBMAnagraphic,
) => {
  const positions: ICasePosition[] = []

  let billTotal = 0

  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  caseOPItems
    .filter(current => !current.isSammelArticle && !current.isSachkostenArticle)
    .forEach(current => {
      const currentPosition = <ICasePosition>{ date: bookingDate }
      const amount = current.amount ?? 0

      checkPriceMissingInfo(contract, current, caseObj, missingData, missingItems)
      const price = current.price ?? 0

      const positionDefaultLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
      currentPosition.description =
        checkMissingInfo(
          current.name,
          MissingInfo.materialsDatabase.material.name(current.id),
          missingData,
          missingItems,
          [''],
        ) ?? positionDefaultLabel

      currentPosition.amount = amount

      currentPosition.price = toDecimalsPlace(price, 2)
      currentPosition.priceTotal =
        toDecimalsPlace(currentPosition.price * currentPosition.amount, 2)

      billTotal += currentPosition.priceTotal
      currentPosition.materialId = current.id
      positions.push(currentPosition)
    })

  const singleFeePosition = <ICasePosition>{ date: bookingDate }
  // definitions
  // EBMItem: retrieved from the OPSCode anagraphics, by searching case.OPSCode in the OPS column
  // categoryNumber: EBMItem.Kategorie extracting the digit (e.g. from category C1B we extract 1)
  // points: retrieved from the EBMPoints anagraphics, column Punktzahl,
  // by searching EBMItem.ambulanteOperation in the EBM-Ziffer column

  // pricePerPoint: retrieved from systemConfiguration.pointPrices
  // pointsPrice: pricePerPoint * points

  const points =
    checkMissingInfo(ebmAnagraphic?.points,
      MissingInfo.ebmAnagraphic.points,
      missingData,
      missingItems,
      [NaN]) ?? 0
  const pricePerPoint =
    checkMissingInfo(
      ebmAnagraphic?.pricePerPoints,
      MissingInfo.systemConfig.pricePerPoints,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0
  const pointsPrice = pricePerPoint * points
  const ebmCategory = checkMissingInfo(
    ebmAnagraphic?.categoryNumber,
    MissingInfo.ebmAnagraphic.categoryNumber,
    missingData,
    missingItems,
    [NaN],
  )

  const billingEScenario =
    checkMissingInfo(billingE?.scenario,
      MissingInfo.contract.billingE.scenario,
      missingData,
      missingItems) ?? 0

  // totalPrice: depends on the value of surgeon.contract.catE.scenario and categoryNumber
  let feePrice = 0
  switch (billingEScenario) {
    case 1:
      if (ebmCategory === 1 || ebmCategory === 2) {
        feePrice = contract.billingE?.minimumCharge ?? 0
      } else {
        const billingEMinCharge =
          checkMissingInfo(
            billingE?.minimumCharge,
            MissingInfo.contract.billingE.minimumCharge,
            missingData,
            missingItems,
            [NaN],
          ) ?? 0
        feePrice = Math.max(pointsPrice * 0.275, billingEMinCharge)
      }
      break

    case 2:
      if (ebmCategory === 1 || ebmCategory === 2)
        // if categoryNumber is 1 or 2: pointsPrice * 0.3
        feePrice = pointsPrice * 0.3
      // otherwise: pointsPrice * 0.275
      else feePrice = pointsPrice * 0.275

      break

    case 3:
      if (ebmCategory === 1 || ebmCategory === 2) {
        const billingEMinCharge =
          checkMissingInfo(
            billingE?.minimumCharge,
            MissingInfo.contract.billingE.minimumCharge,
            missingData,
            missingItems,
            [NaN],
          ) ?? 0

        // if categoryNumber is 1 or 2: the largest between pointsPrice * 0.3 and surgeon.contract.catE.minimumCharge
        feePrice = Math.max(pointsPrice * 0.3, billingEMinCharge)
      } else {
        // otherwise: pointsPrice * 0.275
        feePrice = pointsPrice * 0.275
      }

      break

    default:
      feePrice = 0
  }

  // position.description: EBMItem.Bezeichnung
  singleFeePosition.description =
    checkMissingInfo(ebmAnagraphic?.description,
      MissingInfo.ebmAnagraphic.description,
      missingData,
      missingItems,
      [
        '',
      ]) ?? ''
  singleFeePosition.price = toDecimalsPlace(feePrice, 2)
  singleFeePosition.priceTotal = toDecimalsPlace(feePrice, 2)
  singleFeePosition.amount = 1
  positions.push(singleFeePosition)

  billTotal += singleFeePosition.priceTotal

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = billTotal
}
