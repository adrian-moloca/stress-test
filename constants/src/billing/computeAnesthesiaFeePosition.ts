import { AnesthesiologistPresence, MissingInfo } from '../enums'
import Translator from '../translator'
import { Case, ICasePosition } from '../types'
import { getAutoAnesthesiologistPresence } from '../utils'
import { checkMissingInfo, minutesBetween } from './generic-utilities'

export const computeAnesthesiaFeePosition = (
  translator: Translator,
  bookingDate: Date,
  timeStamps: Case['timestamps'],
  anesthesiaSection: Case['anesthesiaSection'],
  prices: any, // Contract['billingC1'] | Contract['billingG'],
  missingData: string[],
  missingItems: string[],
) => {
  const singleFeePosition = <ICasePosition>{ date: bookingDate }
  // definitions:
  // durationMinutes: case.intraOp.timeEndOfSurgicalMeasures - case.intraOp.timeReleasedForSurgery
  const anesthesiologistPresence = checkMissingInfo(
    anesthesiaSection.anesthesiologistPresence,
    MissingInfo.billingSection.effectiveAnesthesia,
    missingData,
    missingItems,
  )
  const autoAnesthesiologistPresence = getAutoAnesthesiologistPresence(anesthesiaSection
    .anesthesiaList)

  let isWithAnesthesiologist
  switch (anesthesiologistPresence) {
    case AnesthesiologistPresence.AUTO:
      isWithAnesthesiologist =
        autoAnesthesiologistPresence === AnesthesiologistPresence.WITH_ANESTHESIOLOGIST
      break

    case AnesthesiologistPresence.WITH_ANESTHESIOLOGIST:
      isWithAnesthesiologist = true
      break

    case AnesthesiologistPresence.NO_ANESTHESIOLOGIST:
    default:
      isWithAnesthesiologist = false
      break
  }

  let initialTS
  let finishTS

  if (isWithAnesthesiologist) {
    initialTS = checkMissingInfo(
      timeStamps.releaseForSurgeryTimestap,
      MissingInfo.timestamps.releaseForSurgeryTimestap,
      missingData,
      missingItems,
    )
    finishTS = checkMissingInfo(
      timeStamps.endOfSurgicalMeasuresTimestamp,
      MissingInfo.timestamps.endOfSurgicalMeasuresTimestamp,
      missingData,
      missingItems,
    )
  } else {
    initialTS = checkMissingInfo(
      timeStamps.roomEnterTimestamp,
      MissingInfo.timestamps.roomEnterTimestamp,
      missingData,
      missingItems,
    )
    finishTS = checkMissingInfo(
      timeStamps.roomExitTimestmap,
      MissingInfo.timestamps.roomExitTimestmap,
      missingData,
      missingItems,
    )
  }

  const rawMinutes = minutesBetween(initialTS, finishTS, true)
  const durationMinutes = rawMinutes == null || isNaN(rawMinutes) ? 0 : rawMinutes
  // anesthesiaFeeFirsthour and anesthesiaFeePerMinute: calculated depending on case.intraOp.anesthesia.anesthesiologistPresence
  // if anesthesiologistPresence is WITH_ANESTHESIOLOGIST, we use surgeon.contract.catC1.FeeFirstHourFullAnesthesia and
  // surgeon.contract.catC1.FeePerMinuteFullAnesthesia
  // otherwise surgeon.contract.catC1.FeePerMinuteLocalAnesthesia

  const priceWithAnesthesiologistFirstHour =
    checkMissingInfo(
      prices?.firstHourWithAnesthesiologistFee,
      MissingInfo.contract.prices.firstHourWithAnesthesiologistFee,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0
  const priceWithAnesthesiologistMinute =
    checkMissingInfo(
      prices?.withAnesthesiologistFeePerMinute,
      MissingInfo.contract.prices.withAnesthesiologistFeePerMinute,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0
  const priceNoAnesthesiologistMinute =
    checkMissingInfo(
      prices?.noAnesthesiologistFeePerMinute,
      MissingInfo.contract.prices.noAnesthesiologistFeePerMinute,
      missingData,
      missingItems,
      [NaN],
    ) ?? 0

  let totalFee = 0
  let feeDescription = ''

  if (isWithAnesthesiologist) {
    // excessMinutes: durationMinutes - 60 (or 0 if durationMinutes < 60)
    const excessMinutes = Math.max(durationMinutes - 60, 0)
    const priceExcessMinutes = priceWithAnesthesiologistMinute * excessMinutes
    totalFee = priceWithAnesthesiologistFirstHour + priceExcessMinutes

    const excessDescription = excessMinutes
      ? translator.fromLabel('anestesia_excess_minutes', { excessMinutes: `${excessMinutes}` })
      : ''
    feeDescription = translator.fromLabel('anesthesia_withAnesthesiologist_fee_label', { excessDescription })
  } else {
    totalFee = priceNoAnesthesiologistMinute * durationMinutes
    feeDescription = translator.fromLabel('anesthesia_withoutAnesthesiologist_fee_label')
  }

  singleFeePosition.description = feeDescription
  singleFeePosition.price = totalFee
  singleFeePosition.priceTotal = totalFee
  singleFeePosition.amount = 1
  return singleFeePosition
}
