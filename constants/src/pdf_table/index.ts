/* eslint-disable @stylistic/no-mixed-operators */
import { PDF_THEME_DETAILS } from '../billing/pdf-theme'
import PDFDocument from 'pdfkit'

export interface PdfTableColumn {
  property: string
  label: string
  colWidth?: number
  align?: 'center' | 'right' | 'left' | 'justify'
}

type PdfTableRow = {
  [key: string]: Number | string
}

type TableOPtions = {
  padding: number
  defaultColWidth: number
  pageMarginTop: number
}

type TPDFDocument = typeof PDFDocument

function drawHeaders (
  columns: PdfTableColumn[],
  doc: TPDFDocument,
  tableTop: number,
  defaultColWidth: number,
  padding: number,
  initialX: number,
) {
  doc.font('Helvetica-Bold')
  doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)
  columns.forEach((col, idx) => {
    const sumOfPreviousColumsWidths = sumPreviousColumsWidths(columns, defaultColWidth, idx)
    doc.text(col.label, sumOfPreviousColumsWidths + initialX + padding, tableTop + padding, {
      width: col.colWidth ?? defaultColWidth,
      align: 'center',
    })
  })
}

function sumColumsWidths (columns: PdfTableColumn[], defaultColWidth: number) {
  const width = columns.reduce((acc, curr) => {
    return acc + (curr.colWidth ?? defaultColWidth)
  }, 0)
  return width
}

function sumPreviousColumsWidths (columns: PdfTableColumn[],
  defaultColWidth: number,
  currentIndex: number) {
  if (currentIndex > 0) return sumColumsWidths(columns.slice(0, currentIndex), defaultColWidth)
  else return 0
}

function drawTable (
  doc: TPDFDocument,
  columns: PdfTableColumn[],
  data: PdfTableRow[],
  initialY: number,
  initialX: number,
  options: TableOPtions,
) {
  const { padding, defaultColWidth, pageMarginTop } = options
  const tableWidth = sumColumsWidths(columns, defaultColWidth)
  let tableTop = initialY

  drawHeaders(columns, doc, tableTop, defaultColWidth, padding, initialX)

  tableTop += 30 // tables top plus header height

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    let cellHeight = 0

    // Verifica l'altezza del testo per ogni cella
    columns.forEach(col => {
      const colWidth = col.colWidth ?? defaultColWidth
      const textHeight = doc.heightOfString(item[col.property]?.toString?.() ?? '', { width: colWidth - 2 * padding })
      const totalHeight = textHeight + 2 * padding
      if (totalHeight > cellHeight) cellHeight = totalHeight
    })

    // if we are next to page footer we have to add a new page (this fix pdfkit-table bug)
    if (tableTop + cellHeight > doc.page.height - 100) {
      doc.addPage()
      tableTop = pageMarginTop
      doc.y = pageMarginTop
      drawHeaders(columns, doc, tableTop, defaultColWidth, padding, initialX)
      tableTop += 30
    }

    doc.font('Helvetica')
    doc.fontSize(PDF_THEME_DETAILS.FONT_SIZE_NORMAL)

    if (i % 2 === 1) doc.save().rect(initialX, tableTop, tableWidth, cellHeight)
      .fill('#F5F5F5')
      .restore()

    columns.forEach((col, idx) => {
      const colWidth = col.colWidth ?? defaultColWidth
      const sumOfPreviousColumsWidths = sumPreviousColumsWidths(columns, defaultColWidth, idx)
      const textHeight = doc.heightOfString(item[col.property]?.toString?.() ?? '', { width: colWidth - 2 * padding })
      const textTop = tableTop + (cellHeight - textHeight) / 2
      doc.text(item[col.property]?.toString?.() ?? '', sumOfPreviousColumsWidths + initialX + padding, textTop, {
        width: colWidth - 2 * padding,
        ...(col.align && {
          align: col.align,
        }),
      })
    })

    tableTop += cellHeight

    // draw row separation line
    doc
      .moveTo(initialX, tableTop)
      .lineTo(initialX + tableWidth, tableTop)
      .stroke()
  }
}

export default drawTable
