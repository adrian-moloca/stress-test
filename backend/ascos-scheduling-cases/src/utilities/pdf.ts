import {
  CostEstimate, IGeneralData, PDF_THEME_DETAILS, Receipt, ReceiptType,
  TranslatorLanguages,
  computeCostEstimateTotal, formatCurrency
} from '@smambu/lib.constantsjs'
import Translator from '@smambu/lib.constantsjs/lib/translator'
import { format } from 'date-fns'
const PDFDocument = require('pdfkit-table')
const numberToText = require('number-to-text')
require('number-to-text/converters/en-us')
require('number-to-text/converters/de')

const convertNumberToWords = (translator:Translator, value: number, language: string): string => {
  const stringValue = value.toString()
  const splittedNumber = stringValue.split('.')
  const integerPart = splittedNumber[0]
  const decimalPart = splittedNumber[1]

  const isDecimal = decimalPart != null

  const integerInWords = numberToText.convertToText(integerPart, { language })

  if (!isDecimal) return integerInWords

  const decimalPartInWords = numberToText.convertToText(decimalPart, { language })

  return `${integerInWords} ${translator.fromLabel('receipt_decimal_separator')} ${decimalPartInWords}`
}

const getAdditionalMargin = (text: string, doc, width: number, bottomCorrection: number) => {
  const textWidth = doc.widthOfString(text, { width })
  const textHeight = doc.heightOfString(text, { width })

  if (textWidth <= width)
    return 0

  return textHeight - bottomCorrection
}

const generateHeader = (generalData: IGeneralData, doc) => {
  const {
    companyName,
    surgeryCenterName,
    companyStreet,
    companyHouseNumber,
    companyPostalCode,
    companyCity,
    phoneNumber,
    fax
  } = generalData

  doc
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_BIG)
    .text(companyName, 110, 61, { align: 'right' })
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(surgeryCenterName, 200, 50, { align: 'right' })
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(`tel: ${phoneNumber ?? ''} Fax: ${fax ?? ''}`, 200, 84, { align: 'right' })
    .text(`${companyStreet} ${companyHouseNumber} ${companyPostalCode} ${companyCity}`, 200, 98, { align: 'right' })
    .moveDown()
}

const genereCostEstimateBody = async (
  translator: Translator,
  doc,
  x0,
  costEstimate: CostEstimate,
  currencySymbol: string
) => {
  const currentLocale = translator.getLanguageString()

  let language

  switch (currentLocale) {
    case TranslatorLanguages.en:
      language = 'en-us'
      break

    case TranslatorLanguages.de:
      language = 'de'
      break

    default:
      language = 'en-us'
  }

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_BIG)
  doc.text(translator.fromLabel('cost_estimate_title'), x0, doc.y + 40, {
    align: 'center',
  })
  const materialsSum = costEstimate?.materialsPrices
    ?.reduce?.((acc, curr) => acc + (curr.price * curr.amount), 0) ?? 0
  const infoTable = {
    options: {
      separation: true,
      hideHeader: true,
      width: 400,
      height: 500,
      padding: 30,
      prepareRow: (_row, _indexColumn, indexRow, rectRow) => {
        doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
        if (indexRow % 2 === 0)
          doc.addBackground(rectRow, '#E5E5E5', 0.5)
      },
      x: (doc.page.width / 2) - 200,
      y: doc.y + 50,
    },
    headers: [
      { label: '', property: 'item' },
      { label: '', property: 'value' },
    ],
    datas: [

    ],
    rows: [
      [translator.fromLabel('cost_estimate_name'), `${costEstimate.patient.name} ${costEstimate.patient.surname}`],
      [translator.fromLabel('cost_estimate_birth_date'), format(new Date(costEstimate.patient.birthDate), translator.fromLabel('dateTime_date_string'))],
      [translator.fromLabel('cost_estimate_op_name'), costEstimate.surgery.opstandardName],
      [translator.fromLabel('cost_estimate_surgery_date'), format(new Date(costEstimate.surgery.bookingDate), translator.fromLabel('dateTime_date_time_string'))],
      [translator.fromLabel('cost_estimate_doctor_name'), costEstimate.surgery.doctorName],
    ],
  }

  const roundedOpvPrice = formatCurrency(costEstimate.opvPrice, currencySymbol, language)
  const roundedStandByPrice = formatCurrency(costEstimate.standByPrice, currencySymbol, language)
  const roundedAnesthesiaPrice = formatCurrency(costEstimate.generalAnesthesiaPrice,
    currencySymbol,
    language)
  const roundedMaterialsPrices = formatCurrency(materialsSum, currencySymbol, language)
  const roundedUseAndCarePrice = formatCurrency(costEstimate.useAndCarePrice,
    currencySymbol,
    language)
  const costEstimateTotal = computeCostEstimateTotal(costEstimate)
  const roundedCostEstimate = formatCurrency(costEstimateTotal, currencySymbol, language)

  const pricesTable = {
    options: {
      separation: true,
      hideHeader: true,
      width: 400,
      height: 500,
      padding: 30,
      prepareRow: (_row, _indexColumn, indexRow, rectRow) => {
        doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
        if (indexRow % 2 === 0)
          doc.addBackground(rectRow, '#E5E5E5', 0.5)
      },
      x: (doc.page.width / 2) - 200,
      y: doc.y + 220,
    },
    headers: [
      { label: '', property: 'item' },
      { label: '', property: 'price', align: 'right' },
    ],
    datas: [

    ],
    rows: [
      [translator.fromLabel('cost_estimate_opv_price'), roundedOpvPrice],
      [translator.fromLabel('cost_estimate_stand_by_price'), roundedStandByPrice],
      [translator.fromLabel('cost_estimate_general_anesthesia_price'), roundedAnesthesiaPrice],
      [translator.fromLabel('cost_estimate_materials_prices'), roundedMaterialsPrices],
      [translator.fromLabel('cost_estimate_use_and_care'), roundedUseAndCarePrice],
      [translator.fromLabel('cost_estimate_total'), roundedCostEstimate],
    ],
  }
  await doc.table(infoTable)
  await doc.table(pricesTable)
}

export const generateReceiptBody = (
  translator: Translator,
  doc,
  receipt: Receipt,
  generalData: IGeneralData,
  currencySymbol: string
) => {
  const currentLocale = translator.getLanguageString()

  let language

  switch (currentLocale) {
    case TranslatorLanguages.en:
      language = 'en-us'
      break

    case TranslatorLanguages.de:
      language = 'de'
      break

    default:
      language = 'en-us'
  }

  const totalInWords = convertNumberToWords(translator, receipt.amount, language)

  const cardWidth = 400
  const cardHeight = 300
  const x0 = (doc.page.width / 2) - (cardWidth / 2)
  const y0 = 165
  const rowXo = (doc.page.width / 2) - ((cardWidth / 2) - 10)
  const rowX1 = (doc.page.width / 2) + ((cardWidth / 2) - 10)
  const rowLeftPadding = 4

  const isRefund = receipt.type === ReceiptType.REFUND

  const patientName = `${receipt.patient.name} ${receipt.patient.surname}`

  const receiptFrom = isRefund ? generalData.companyName : patientName
  const receiptTo = isRefund ? patientName : generalData.companyName

  doc.font('Times-Bold')
  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_BIGGER)
  doc.text(translator.fromLabel('receipt_title'), rowXo, y0 + 15)

  doc.font('Times-Roman')
  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
  doc.text('N. ', rowXo, y0 + 55, {
    continued: true,
  })
  doc.text(receipt?.number)

  const additionalMargin = getAdditionalMargin(totalInWords, doc, 300, 15)

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 115)
    .lineTo(rowX1 - 80, y0 + additionalMargin + 115)
    .stroke()

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
  doc.text(totalInWords, rowXo + rowLeftPadding, y0 + 100, { width: 300 })

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
  doc.text(translator.fromLabel('receipt_total_in_words'), rowX1 - 70, y0 + additionalMargin + 107)

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 135)
    .lineTo(rowX1, y0 + additionalMargin + 135)
    .stroke()

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
  doc.text(translator.fromLabel('receipt_from'), rowXo + rowLeftPadding, y0 + additionalMargin + 125, {
    continued: true,
  })
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(receiptFrom, doc.x + 20, doc.y - 5)

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 155)
    .lineTo(rowX1, y0 + additionalMargin + 155)
    .stroke()

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
  doc.text(translator.fromLabel('receipt_to'), rowXo + rowLeftPadding, y0 + additionalMargin + 145, {
    continued: true,
  })
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(receiptTo, doc.x + 20, doc.y - 5)

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 175)
    .lineTo(rowX1, y0 + additionalMargin + 175)
    .stroke()
  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
  doc.text(translator.fromLabel('receipt_for'), rowXo + rowLeftPadding, y0 + additionalMargin + 165, {
    continued: true,
  })
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(translator.fromLabel(receipt.type), doc.x + 20, doc.y - 5)

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 195)
    .lineTo(rowX1, y0 + additionalMargin + 195)
    .stroke()

  doc.lineWidth(1)
    .moveTo(rowXo, y0 + additionalMargin + 235)
    .lineTo(rowX1, y0 + additionalMargin + 235)
    .stroke()
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(`${generalData.companyCity}, `, rowXo + rowLeftPadding, y0 + additionalMargin + 220, {
      continued: true,
    })
    .text(format(new Date(receipt.dateOfGeneration), translator.fromLabel('dateTime_date_string')), {
    })

  doc.lineWidth(1)
    .moveTo((cardWidth / 2) + x0, y0 + additionalMargin + 235)
    .lineTo((cardWidth / 2) + x0, y0 + additionalMargin + 299)
    .stroke()

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(translator.fromLabel('receipt_booking_notes'), rowXo + rowLeftPadding, y0 + additionalMargin + 240)
    .text(translator.fromLabel('receipt_signature'), (cardWidth / 2) + x0 + 5, y0 + additionalMargin + 240)

  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
  doc.text(`${translator.fromLabel('receipt_total')}  `, (cardWidth / 2) + x0 + 57, y0 + additionalMargin + 15, {
    continued: true,
  })

  const roundedAmount = formatCurrency(receipt.amount, currencySymbol, language)
  doc.text(roundedAmount, {
  })
  doc.lineWidth(1)
    .moveTo((cardWidth / 2) + x0 + 95, y0 + additionalMargin + 30)
    .lineTo(rowX1, y0 + additionalMargin + 30)
    .stroke()

  doc.rect(x0, y0, cardWidth, cardHeight + additionalMargin).stroke()
}

export const generateCostEstimatePdf = (
  translator: Translator,
  costEstimate: CostEstimate,
  generalData: IGeneralData,
  currencySymbol: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const buffers = []
    const doc = new PDFDocument({
      margin: 50,
    })

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const finalBuffer = Buffer.concat(buffers)
      const encoded = finalBuffer.toString('base64')

      resolve(encoded)
    })

    doc.on('error', e => reject(e))

    const x0 = 50
    generateHeader(generalData, doc)
    genereCostEstimateBody(translator, doc, x0, costEstimate, currencySymbol).then(() => {
      doc.end()
    })
      .catch(err => {
        reject(err)
      })
  })
}

export const generateReceiptPdf = (
  translator: Translator,
  receipt: Receipt,
  generalData: IGeneralData,
  currencySymbol: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const buffers = []
    const doc = new PDFDocument({
      margin: 50,
    })

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const finalBuffer = Buffer.concat(buffers)
      const encoded = finalBuffer.toString('base64')

      resolve(encoded)
    })

    doc.on('error', e => reject(e))

    generateHeader(generalData, doc)
    generateReceiptBody(translator, doc, receipt, generalData, currencySymbol)

    doc.end()
  })
}
