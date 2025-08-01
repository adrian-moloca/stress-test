import { expect, type Locator, type Page } from '@playwright/test'
import { getTodayDate } from '../../utils/today'
import { AbstractColumns, SampleData } from '../../types/types'
import { sleep } from '@smambu/lib.constantsjs'

export abstract class AnagraphicsPage<Columns extends AbstractColumns> {
  readonly today = getTodayDate()

  versionBarLabel = /The current version is valid from/i

  readonly commonButtonLabels = {
    createNewVersion: /create new version/i,
    editVersion: /edit/i,
    switchToPreviousVersion: /Previous version/i,
    switchToNextVersion: /Next version/i,
    clearAll: /clear all/i,
    saveVersion: /save/i,
    addNewRow: /new row/i,
    cancel: /cancel/i
  } as const

  readonly inputLabels = {
    setVersionDate: /^new version date$/i
  } as const

  readonly errorLabels = {
    duplicateKey: /duplicate key error/i
  } as const

  readonly pageHeader: Locator
  readonly versionBarHeader: Locator

  readonly tableHeaders: Locator
  readonly tableRows: Locator

  readonly createNewVersionButton: Locator
  readonly editVersionButton: Locator
  readonly switchToPreviousVersionButton: Locator
  readonly switchToNextVersionButton: Locator
  readonly saveVersionButton: Locator
  readonly cancelButton: Locator
  readonly addNewRowButton: Locator
  readonly clearAllButton: Locator

  readonly setVersionDateInput: Locator

  constructor (
    public readonly page: Page,
    private baseURL: string = 'http://localhost:3000',
    public relativeURL: string,
    public pageName: string | RegExp,
    public columns: Columns,
  ) {
    this.pageHeader = this.page.getByRole('heading', { name: pageName })
    this.versionBarHeader = this.page.getByText(this.versionBarLabel)

    this.createNewVersionButton = this.page.getByRole('button', {
      name: this.commonButtonLabels.createNewVersion,
    })
    this.editVersionButton = this.page.getByRole('button', {
      name: this.commonButtonLabels.editVersion,
    })
    this.switchToPreviousVersionButton = this.page.getByRole('button', {
      name: this.commonButtonLabels.switchToPreviousVersion,
    })
    this.switchToNextVersionButton = this.page.getByRole('button', {
      name: this.commonButtonLabels.switchToNextVersion,
    })
    this.clearAllButton = this.page.getByRole('button', {
      name: this.commonButtonLabels.clearAll,
    })
    this.saveVersionButton =
      this.page.getByRole('button', { name: this.commonButtonLabels.saveVersion })
    this.cancelButton =
      this.page.getByRole('button', { name: this.commonButtonLabels.cancel })
    this.addNewRowButton =
      this.page.getByRole('button', { name: this.commonButtonLabels.addNewRow })

    this.setVersionDateInput =
      this.page.locator('div').filter({ hasText: this.inputLabels.setVersionDate })
        .getByRole('textbox')

    this.tableRows = this.page.getByRole('grid').first()
      .getByRole('row')
    this.tableHeaders = this.tableRows.first().getByRole('columnheader')
  }

  async goto () {
    const url = `${this.baseURL}${this.relativeURL}`
    await this.page.goto(url)
  }

  async getTableCellByColumnLabel (rowNumber: number, columnLabel: string | RegExp) {
    const row = this.tableRows.nth(rowNumber)
    const columnHeader = this.tableHeaders.filter({ hasText: columnLabel }).first()
    await expect(columnHeader).toHaveAttribute('aria-colindex')
    const colindex = await columnHeader.getAttribute('aria-colindex')

    const rowCells = row.getByRole('cell')
    const tableCell = rowCells.nth(parseInt(colindex!, 10) - 1)
    await expect(tableCell).toBeVisible()

    return tableCell
  }

  expectToBeTodaysDate (dateString: string) { // dateString format: dd/mm/yyyy
    const [day, month, year] = dateString.split('/')
    const date = new Date(`${year}-${month}-${day}`)
    expect(date.toDateString()).toBe(this.today.toDateString())
  }

  async expectSetVersionDateInputToHaveTodaysDate () {
    await expect(this.setVersionDateInput).toBeVisible()
    const dateString = await this.setVersionDateInput.inputValue()

    const [day, month, year] = dateString.split('/')
    const date = new Date(`${year}-${month}-${day}`)
    expect(date.toDateString()).toBe(this.today.toDateString())
  }

  async getVersionDate (): Promise<Date> {
    await expect(this.versionBarHeader).toBeVisible()
    const versionBarText = await this.versionBarHeader.textContent()
    expect(versionBarText).not.toBeNull()

    const [, versionDateString] = versionBarText!.split(this.versionBarLabel)
    expect(versionDateString).toBeDefined()

    return new Date(versionDateString)
  }

  async fillCell (
    rowNumber: number, columnLabel: string | RegExp,
    data: string,
    keepFocus: boolean = false
  ) {
    const cell = await this.getTableCellByColumnLabel(
      rowNumber,
      columnLabel
    )
    await cell.getByRole('textbox').fill(data)

    if (!keepFocus)
      await this.pageHeader.click() // remove focus

    return cell
  }

  async expectDuplicateKeyError (cell: Locator) {
    await expect(this.saveVersionButton).toBeDisabled()
    const errorMessage = cell.getByText(this.errorLabels.duplicateKey)
    await expect(errorMessage).toBeVisible()
  }

  getDeleteRowButton (rowNumber: number) {
    const rowCells = this.tableRows.nth(rowNumber).getByRole('cell')
    const deleteRowButton = rowCells.getByRole('button') // it works if no other buttons are added
    return deleteRowButton
  }

  async addRowsWithData (
    data: SampleData,
    quantity: number = 1,
    ignoreUniqueConstraints: boolean = false
  ) {
    const rowsNumber = await this.tableRows.count()
    for (let i = 0; i < quantity; i++) {
      await this.addNewRowButton.click()

      for (const key in data) {
        let value: string

        if (!ignoreUniqueConstraints &&
          this.columns[key].options?.unique &&
          (quantity > 1 || rowsNumber > 1))
          value = `${rowsNumber + i}_${data[key]}`
        else
          value = data[key]

        await this.fillCell(
          rowsNumber + i,
          this.columns[key].label,
          value
        )
        await sleep(500) // TODO: remove this sleep command when source bug is fixed
      }
    }
  }

  async expectRowsToHaveData (data: SampleData, offset: number = 1) { // default: don't count headers row
    const rowsNumber = await this.tableRows.count()
    for (let i = offset; i < rowsNumber; i++)
      for (const key in data) {
        const cell = await this.getTableCellByColumnLabel(
          i,
          this.columns[key].label,
        )
        await expect(cell.getByRole('textbox')).toHaveValue(new RegExp(data[key]))
      }
  }
}
