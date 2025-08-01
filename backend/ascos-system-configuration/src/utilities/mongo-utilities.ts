import { Model } from 'mongoose'

export const createNumberingDocumentIfNotExists = async (
  model: Model<any>,
  filter: any = {},
  data: any = {},
) => {
  let document: any = null
  const currentReceiptNumber = await model.findOne(filter)
  if (!currentReceiptNumber) {
    const newReceipt = await model.create(data)
    document = newReceipt
  } else {
    document = currentReceiptNumber
  }

  return document
}

export const updateNumberingDocument = async (
  model: Model<any>,
  filter: any = {},
  data: any = {},
) => {
  let document = null
  document = await model.findOneAndUpdate(filter, data, { new: true })
  return document
}
