import { IArticleConsumption, IBillObj, IPcMaterial, ISammelCheckpoint, ISammelPosition } from '../types'

export const computeSammelCheckpoint = (
  billObjs: IBillObj[] | IPcMaterial[],
  previousConsumption: IArticleConsumption[],
  doctorId: string,
) => {
  const checkpoint = <ISammelCheckpoint>{ createdAt: new Date(), doctorId }

  const consumptions: IArticleConsumption[] = previousConsumption.map(current => ({ ...current }))

  // reset everything except for description and remainder
  // this way we don't re-order already ordered stuff without losing
  // new items

  consumptions.forEach(current => {
    current.totalAmount = 0
    current.totalAmountWithPrevious = 0
    current.billingAmount = 0
    current.usedAmount = 0
  })

  // the new checkpoint is going to contain both the previous items and
  // the new ones

  const aggregatedPositions: ISammelPosition[] = []

  billObjs.forEach(billObj => {
    const sammelPositions = billObj.positions as ISammelPosition[]

    sammelPositions.forEach((position: ISammelPosition) => {
      const found = aggregatedPositions.find(item => item.itemCode === position.itemCode)

      if (found) found.amount += position.amount
      else aggregatedPositions.push({ ...position })
    })
  })

  aggregatedPositions.forEach(current => {
    const found = consumptions.find(item => item.itemCode === current.itemCode)

    if (found) {
      found.totalAmount += current.amount
      found.totalAmountWithPrevious = found.totalAmount + found.remainder
      found.billingAmount =
        found.totalAmountWithPrevious < 0
          ? 0
          : Math.floor(found.totalAmountWithPrevious / current.sammelFactor)
      found.usedAmount = found.billingAmount * current.sammelFactor
      found.remainder = found.totalAmountWithPrevious - found.usedAmount

      return
    }

    // if it's a new one, we'll add it to the checkpoin
    const billingAmount = Math.floor(current.amount / current.sammelFactor)
    const usedAmount = billingAmount * current.sammelFactor
    const remainder = current.amount - usedAmount

    const newConsumption = <IArticleConsumption>{
      totalAmount: current.amount,
      totalAmountWithPrevious: current.amount,
      billingAmount,
      usedAmount,
      remainder,
      description: current.description,
      itemCode: current.itemCode,
    }

    consumptions.push(newConsumption)
  })

  checkpoint.consumptions = consumptions

  return checkpoint
}
