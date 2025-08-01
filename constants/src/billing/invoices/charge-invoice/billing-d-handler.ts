import { MissingInfo, RecipientType } from '../../../enums'
import Translator from '../../../translator'
import { IBillObj, ICaseOPItem, ICasePosition, IUser } from '../../../types'
import { billPatientFromPatient, debtorFromSurgeon } from '../../debtor-utilities'
import { checkMissingInfo, toDecimalsPlace } from '../../generic-utilities'

export const billingDHandler = (
  translator: Translator,
  billObj: IBillObj,
  missingData: string[],
  missingItems: string[],
  surgeon: IUser,
  patient: any, // Replaced Patient with any to prevent type errors
  contract: any, // Removed Contract type to avoid type errors without changing the whole file
  opStandardId: string,
  caseOPItems: ICaseOPItem[],
  bookingDate: Date,
) => {
  let overrideInsurances
  let billTotal = 0

  const positions: ICasePosition[] = []
  billObj.debtor = debtorFromSurgeon(surgeon, missingData, missingItems)
  billObj.recipient = RecipientType.DOCTOR

  billObj.patient = billPatientFromPatient(patient, missingData, missingItems)

  const billingDOverride =
    checkMissingInfo(
      contract.billingD?.opstandardOverrides,
      MissingInfo.contract.billingD.overrides,
      missingData,
      missingItems,
    ) ?? []

  const opStandardOverride = checkMissingInfo(
    billingDOverride.find((current: any) => current.opStandardId === opStandardId),
    MissingInfo.contract.billingD.opstandardOverride(opStandardId),
    missingData,
    missingItems,
  )

  const singleFeePosition = <ICasePosition>{ date: bookingDate }

  singleFeePosition.description = translator.fromLabel('abgabe_label')
  singleFeePosition.amount = 1
  singleFeePosition.price =
    checkMissingInfo(opStandardOverride?.charge,
      MissingInfo.contract.override.charge,
      missingData,
      missingItems,
      [
        NaN,
      ]) ?? 0
  singleFeePosition.priceTotal = opStandardOverride?.charge ?? 0

  billTotal += singleFeePosition.priceTotal

  positions.push(singleFeePosition)

  caseOPItems
    .filter(current => !current.isSammelArticle)
    .forEach(current => {
      // definitions
      // overwriteItem: retrieved from surgeon.contract.catD.{case.opStandard}.materialPrices,
      // searching the current item
      // NOTE: the overwriteItem is found only if surgeon.contract.catD.{case.opStandard}.insurances
      // includes case.insurance
      // NOTE: if no overwriteItem is found, the current item is skipped
      overrideInsurances =
        checkMissingInfo(
          opStandardOverride?.insurances,
          MissingInfo.contract.override.insurances,
          missingData,
          missingItems,
        ) ?? []
      checkMissingInfo(
        patient.germanInsuranceId,
        MissingInfo.bookingPatient.germanInsuranceId,
        missingData,
        missingItems,
        [''],
      )

      const insuranceIncluded = overrideInsurances.find(({ nummer }: any) => `${nummer}` === patient.germanInsuranceId)

      const overrideMaterialPrices = checkMissingInfo(
        opStandardOverride?.materialPrices,
        MissingInfo.contract.override.materialPrices,
        missingData,
        missingItems,
      )

      const overwriteItem = overrideMaterialPrices?.find((item: any) => item.id === current.id)
      const currentPosition = <ICasePosition>{}
      if (overwriteItem && insuranceIncluded) {
        currentPosition.date = bookingDate
        const positionDefaultLabel = `${current.id} - ${translator.fromLabel('opStandardTable_missing_material')}`
        currentPosition.description =
          checkMissingInfo(
            current.name,
            MissingInfo.materialsDatabase.material.name(current.id),
            missingData,
            missingItems,
            [''],
          ) ?? positionDefaultLabel

        const amount = current.amount ?? 0
        const price =
          checkMissingInfo(
            overwriteItem.price,
            MissingInfo.contract.billingD.materialPrice(overwriteItem.id),
            missingData,
            missingItems,
            [NaN],
          ) ?? 0

        currentPosition.amount = amount

        currentPosition.price = toDecimalsPlace(price, 2)
        currentPosition.priceTotal =
          toDecimalsPlace(currentPosition.amount * currentPosition.price, 2)

        billTotal += currentPosition.priceTotal
        currentPosition.materialId = current.id
        positions.push(currentPosition)
      }
    })

  billObj.positions = positions

  billObj.totalSum = billTotal
  billObj.totalOwed = billTotal
}
