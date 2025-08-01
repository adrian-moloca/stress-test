import {
  Case, IBillObj, ICasePosition, IGeneralData,
  IGeneratedInvoices, InvoiceType, OPSCategories, PDF_THEME_DETAILS,
  TranslatorLanguages, getBookkeepingDate,
  formatCurrency, supplierCodeThreshold,
  getFullName
} from '@smambu/lib.constantsjs'
import Translator from '@smambu/lib.constantsjs/lib/translator'
import drawTable, { PdfTableColumn } from '@smambu/lib.constantsjs/lib/pdf_table'
import { format } from 'date-fns'
const PDFDocument = require('pdfkit')

const pageMarginLeft = 60
const pageMarginRight = 30
const pageMarginTop = 20
const x0 = pageMarginLeft
const secondColumnX = 427.5
const spaceBetweenLines = 13
const innerBodyX = 77.1

// if the content that you want to put on the page is bigger than the page, the function adds a new page and returns the new intiali y
// it's important to use this function every time that we want to appen a new content in the pdf, because the library has a bug and it's not able to handle
// contents across multiple pages
const addNewPageIfNeeded = (doc, initialY, heightOfContent, yMargin) => {
  if (initialY + heightOfContent > doc.page.height) {
    doc.addPage()
    return yMargin
  }
  return initialY
}

const generateHeader = (translator:Translator, generalData: IGeneralData, doc) => {
  const {
    companyName,
    surgeryCenterName,
    phoneNumber,
    fax
  } = generalData

  doc
    .fontSize(8.57)
    .fillColor(PDF_THEME_DETAILS.FILL_COLOR)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .text(surgeryCenterName, x0, pageMarginTop)
    .fontSize(14.28)
    .text(companyName, x0, pageMarginTop + 18)
    .fontSize(8.57)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .text(`${translator.fromLabel('invoicePdfField_tel')}: ${phoneNumber ?? ''} ${translator.fromLabel('invoicePdfField_fax')}: ${fax ?? ''}`, x0, pageMarginTop + 37.14)
}

const generateGeneralInformation = (
  translator: Translator,
  doc,
  generatedInvoice: IGeneratedInvoices,
  language: string,
  generalData: IGeneralData,
  cases: Case[]
) => {
  const isCreditNote = generatedInvoice.type === InvoiceType.CREDIT_NOTE
  const debtorGeneralDataTop = 180
  const invoiceGeneralDataTop = 148.6
  const cityAndDateSectionTop = 195.5
  const invoiceTitleY = 297.1
  const amountToPayY = invoiceTitleY + 34.3

  const formattedDueDate = format(new Date(generatedInvoice.dueDate), translator.fromLabel('dateTime_date_string'))
  const {
    companyName,
    companyStreet,
    companyHouseNumber,
    companyPostalCode,
    companyCity
  } = generalData
  const compantDataString = `${companyName}, ${companyStreet}, ${companyHouseNumber}, ${companyPostalCode} ${companyCity}`
  const roundedTotal = Number(generatedInvoice.totalOwed).toLocaleString(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const bookkeepingDate = format(getBookkeepingDate(cases), translator.fromLabel('dateTime_date_string'))

  doc
    .fillColor(PDF_THEME_DETAILS.FILL_COLOR)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM_SMALL)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .text(compantDataString, x0, 134.5, {
      underline: true
    })

  if (generatedInvoice.debtor.isDoctor && generatedInvoice.debtor.practiceName !== '')
    doc
      .font(PDF_THEME_DETAILS.FONT_NORMAL)
      .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
      .text(
        generatedInvoice.debtor.practiceName, x0, debtorGeneralDataTop - (spaceBetweenLines + 2)
      )

  doc
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(getFullName(generatedInvoice.debtor, true), x0, debtorGeneralDataTop)
    .text(`${generatedInvoice.debtor.street}, ${generatedInvoice.debtor.houseNumber}`, x0, debtorGeneralDataTop + spaceBetweenLines)
    .text(`${generatedInvoice.debtor.postalCode}, ${generatedInvoice.debtor.city}`, x0, debtorGeneralDataTop + (spaceBetweenLines * 2))
    .text(generatedInvoice.debtor.country, x0, debtorGeneralDataTop + (spaceBetweenLines * 3))

  doc
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(`${translator.fromLabel('invoicePdfFields_invoiceNumberLabel')}: ${generatedInvoice.invoiceNumber}`, secondColumnX, invoiceGeneralDataTop)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .text(`${translator.fromLabel('invoicePdfField_debtorNumber')}: ${generatedInvoice.debtor.debtorNumber}`, secondColumnX, invoiceGeneralDataTop + spaceBetweenLines)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM_SMALL)
    .text(`${translator.fromLabel('invoicePdfField_bookkeepingDate')}: ${bookkeepingDate}`, secondColumnX, invoiceGeneralDataTop + (spaceBetweenLines * 2))

  if (isCreditNote)
    doc
      .font(PDF_THEME_DETAILS.FONT_NORMAL)
      .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM_SMALL)
      .text(`${translator.fromLabel('invoicePdfField_originalInvoiceNumber')}: ${generatedInvoice.originalInvoiceNumber}`, secondColumnX, invoiceGeneralDataTop + (spaceBetweenLines * 2.75))

  doc
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(translator.fromLabel('invoicePdfField_original'), secondColumnX, cityAndDateSectionTop)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .text(generalData.companyCity, secondColumnX, cityAndDateSectionTop + 28.5)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .text(format(new Date(), translator.fromLabel('dateTime_date_string')), secondColumnX, cityAndDateSectionTop + 42.7)

  doc
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(translator.fromLabel(isCreditNote ? 'invoicePdfField_creditNote' : 'invoicePdfField_invoice'), innerBodyX, invoiceTitleY)

  doc
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(`${translator.fromLabel('invoicePdfField_currency_abbreviation')} ${isCreditNote ? '-' : ''}${roundedTotal}`, innerBodyX, amountToPayY, { align: 'center' })

  doc
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(translator.fromLabel('invoiceDataFirstTextLabel', { date: formattedDueDate }), innerBodyX, amountToPayY + 25.7)
    .moveDown()
}

const generateCases = (
  translator: Translator,
  doc,
  generatedInvoice: IGeneratedInvoices,
  cases: Case[],
  billObjs: IBillObj[],
  currencySymbol: string
) => {
  for (const caseId of generatedInvoice.casesRef) {
    const targetCase = cases.find(c => c.caseId === caseId)
    generateCaseSection(translator, doc, generatedInvoice, targetCase, billObjs, currencySymbol)
  }
}

const generateCaseSection = (
  translator: Translator,
  doc,
  generatedInvoice: IGeneratedInvoices,
  caseItem: Case,
  billObjs: IBillObj[],
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

  let initialY: number

  initialY = doc.y
  initialY = addNewPageIfNeeded(doc, initialY, 315, pageMarginTop)

  const originalInvoiceType = generatedInvoice.originalInvoiceType
  const invoiceType = generatedInvoice.type
  const isSachkosten = originalInvoiceType === InvoiceType.SACHKOSTEN ||
   invoiceType === InvoiceType.SACHKOSTEN
  const isMaterialPrivate = originalInvoiceType === InvoiceType.MATERIAL_PRIVATE ||
    invoiceType === InvoiceType.MATERIAL_PRIVATE
  const filteredBillObjs = billObjs.filter(billObj => generatedInvoice.billObjRefs
    .includes(billObj.billObjId) && billObj.caseId === caseItem.caseId)

  const caseTotal = filteredBillObjs.reduce((acc, curr) => acc + curr.totalSum, 0)
  const caseTotalOwed = filteredBillObjs.reduce((acc, curr) => acc + curr.totalOwed, 0)
  const positions = filteredBillObjs.reduce((acc, curr) => {
    const billObjPositions = curr.positions
    const isCreditNote = invoiceType === InvoiceType.CREDIT_NOTE

    const parsePositions = (billObjPositions as ICasePosition[])
      .map(position => ({
        positionDateLabel: position.vatPosition ? '-' : format(new Date(position.date), translator.fromLabel('dateTime_date_string')),
        Number: position.materialId ?? '-',
        positionDescritionLabel: position.description,
        positionAmountLabel: position.vatPosition ? '-' : position.amount,
        positionPriceLabel: position.vatPosition ? '-' : formatCurrency(position.price, currencySymbol, language, isCreditNote),
        positionPriceTotalLabel: formatCurrency(position.priceTotal,
          currencySymbol,
          language,
          isCreditNote),
        supplierNumber: (isSachkosten ||
          (isMaterialPrivate && position.price > supplierCodeThreshold))
          ? position.supplierNumber
          : null
      }))
    return [...acc, ...parsePositions]
  }, [])

  doc
    .fillColor(PDF_THEME_DETAILS.FILL_COLOR)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .text(`${translator.fromLabel('invoicePdfField_case_reference')}:  `, innerBodyX, initialY + 40, { continued: true })
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .text(caseItem.caseNumber)

  // For legal reasons, sachkosten bills cannot show patient data
  if (!isSachkosten)
    doc.font(PDF_THEME_DETAILS.FONT_NORMAL)
      .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
      .text(`${translator.fromLabel('invoicePdfField_for')}:  `, innerBodyX, initialY + 65, { continued: true })
      .text(`${caseItem.bookingPatient.name ?? ''} ${caseItem.bookingPatient.surname ?? ''}, ${format(new Date(caseItem.bookingPatient.birthDate), translator.fromLabel('dateTime_date_string')) ?? ''}`)

  doc.font(PDF_THEME_DETAILS.FONT_NORMAL)
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .text(`${translator.fromLabel('invoicePdfField_surgeon')}:  `, innerBodyX, initialY + 65 + spaceBetweenLines, { continued: true })
    .text(getFullName(caseItem.associatedDoctor, true))

  // @ts-expect-error DYNAMIC DATA IS BROKEN
  if (!isSachkosten && OPSCategories.includes(caseItem.billingSection.billingCategory))
    doc.font(PDF_THEME_DETAILS.FONT_NORMAL)
      .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
      // @ts-expect-error DYNAMIC DATA IS BROKEN
      .text(`${translator.fromLabel('invoicePdfField_ops_code')}:  ${caseItem?.billingSection?.opsCode ?? ''}`, innerBodyX, initialY + 65 + (spaceBetweenLines * 2))

  const columns: PdfTableColumn[] = [
    { label: translator.fromLabel('positionDateLabel'), property: 'positionDateLabel', colWidth: 60 },
    { label: translator.fromLabel('positionNumberLabel'), property: 'Number', colWidth: 45.7, align: 'right' },
    { label: translator.fromLabel('positionDescritionLabel'), property: 'positionDescritionLabel', colWidth: isSachkosten || isMaterialPrivate ? 150 : 200 },
    { label: translator.fromLabel('positionAmountLabel'), property: 'positionAmountLabel', colWidth: 45.7, align: 'right' },
    { label: translator.fromLabel('positionPriceLabel'), property: 'positionPriceLabel', align: 'right' },
    { label: translator.fromLabel('positionPriceTotalLabel'), property: 'positionPriceTotalLabel', align: 'right' },
    ...(isSachkosten || isMaterialPrivate) ? [{ label: translator.fromLabel('supplierNumberLabel'), property: 'supplierNumber', colWidth: 63, align: 'right' as any }] : []
  ]

  const sumOfCustomWidths = columns.reduce((acc, curr) => {
    return curr.colWidth ? acc + curr.colWidth : acc
  }, 0)
  const columsWithoutWidth = columns.filter(c => c.colWidth === undefined)
  const margins = pageMarginLeft + pageMarginRight + 30
  const defaultColWidth = (doc.page.width - margins - sumOfCustomWidths) / columsWithoutWidth.length
  const padding = 4

  drawTable(doc, columns, positions, initialY + 135, innerBodyX, {
    defaultColWidth,
    padding,
    pageMarginTop,
  })

  doc
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .text(`${translator.fromLabel('invoicePdfField_case_total')}:  ${formatCurrency(caseTotal, currencySymbol, language, generatedInvoice.type === InvoiceType.CREDIT_NOTE)}`, innerBodyX, doc.y + 40)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)

    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .text(`${translator.fromLabel('invoicePdfField_case_total_owed')}:  ${formatCurrency(caseTotalOwed, currencySymbol, language, generatedInvoice.type === InvoiceType.CREDIT_NOTE)}`, innerBodyX, doc.y + 5)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
}

const generateFooter = (
  translator: Translator,
  doc,
  docPosition: number,
  generalData: IGeneralData,
  generatedInvoice: IGeneratedInvoices
) => {
  const {
    companyName,
    companyStreet,
    companyHouseNumber,
    companyPostalCode,
    companyCity,
    bankAccount,
    companyTaxNumber,
    companySalesTaxNumber,
    companySeat,
    managingDirectors,
    tradeRegisterNumber
  } = generalData

  const debtorNumber = generatedInvoice.debtor.debtorNumber
  const invoiceNumber = generatedInvoice.invoiceNumber

  let initialY = docPosition + 100
  initialY = addNewPageIfNeeded(doc, initialY, 200, pageMarginTop)

  const isVatIncluded = generatedInvoice.type === InvoiceType.PLASTIC_SURGERY_VAT

  doc
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .text(translator.fromLabel('invoiceFooterText', { companyAccount: bankAccount, invoiceNumber, debtorNumber }), innerBodyX, initialY)

  if (!isVatIncluded)
    doc
      .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
      .font(PDF_THEME_DETAILS.FONT_NORMAL)
      .moveDown(1)
      .text(translator.fromLabel('invoiceFooterFreeDisclaimer'))

  doc
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
    .font(PDF_THEME_DETAILS.FONT_NORMAL)
    .moveDown(1)
    .text(`${companyName} ${companyStreet} ${companyHouseNumber} ${companyPostalCode} ${companyCity}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_bankAccount')}: ${bankAccount}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_tax_number')}: ${companyTaxNumber}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_sales_tax_number')}: ${companySalesTaxNumber}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_company_seat')}: ${companySeat}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_managing_directors')}: ${managingDirectors}`)
    .moveDown(1)
    .text(`${translator.fromLabel('invoicePdfField_trade_register_number')}: ${tradeRegisterNumber}`)
    .moveDown(1)
}

const generateTotalSection = (translator: Translator,
  doc,
  generatedInvoice: IGeneratedInvoices,
  currencySymbol: string,
  language: string) => {
  let initialY = doc.y + 50
  initialY = addNewPageIfNeeded(doc, initialY, 150, pageMarginTop)

  doc
    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fillColor(PDF_THEME_DETAILS.FILL_COLOR)
    .text(`${translator.fromLabel('invoicePdfField_invoice_total')}:  ${formatCurrency(generatedInvoice.total, currencySymbol, language, generatedInvoice.type === InvoiceType.CREDIT_NOTE)}`, x0, initialY, { align: 'right' })

    .fontSize(PDF_THEME_DETAILS.FONT_SIZE_MEDIUM)
    .font(PDF_THEME_DETAILS.FONT_BOLD)
    .fillColor(PDF_THEME_DETAILS.FILL_COLOR)
    .text(`${translator.fromLabel('invoicePdfField_invoice_total_owed')}:  ${formatCurrency(generatedInvoice.totalOwed, currencySymbol, language, generatedInvoice.type === InvoiceType.CREDIT_NOTE)}`, x0, initialY + 20, { align: 'right' })
    .moveDown()
}

export const generateInvoicePdf = (
  translator: Translator,
  generalData: IGeneralData,
  generatedInvoice: IGeneratedInvoices,
  bills: IBillObj[],
  cases: Case[],
  currencySymbol: string
): Promise<string> => {
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

  return new Promise((resolve, reject) => {
    const buffers = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: pageMarginTop,
        left: pageMarginLeft,
        right: pageMarginRight
      }
    })

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const finalBuffer = Buffer.concat(buffers)
      const encoded = finalBuffer.toString('base64')

      resolve(encoded)
    })

    doc.on('error', e => {
      reject(e)
    })

    generateHeader(translator, generalData, doc)
    generateGeneralInformation(translator, doc, generatedInvoice, language, generalData, cases)
    generateCases(translator, doc, generatedInvoice, cases, bills, currencySymbol)
    generateTotalSection(translator, doc, generatedInvoice, currencySymbol, language)
    generateFooter(translator, doc, doc.y, generalData, generatedInvoice)
    doc.end()
  })
}
