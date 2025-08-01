import { expect, Locator, Page } from '@playwright/test'
import { AnagraphicsPage } from './abstract/anagraphics.page'
import { SampleData } from '../types/types'
import { sleep } from '@smambu/lib.constantsjs'

const insurancesColumns = {
  number: { label: /Nummer/i, options: { unique: true } },
  name: { label: /Langtext/i },
} as const

export class InsurancesPage extends AnagraphicsPage<typeof insurancesColumns> {
  readonly tablistButtonLabels = {
    publicInsurances: /Public insurances/i,
    privateInsurances: /Private insurances/i,
    bgInsurances: /BG insurances/i
  }

  readonly switchToPublicInsurancesButton: Locator
  readonly switchToPrivateInsurancesButton: Locator
  readonly switchToBgInsurancesButton: Locator

  constructor (page: Page, baseURL: string = 'http://localhost:3000') {
    super(
      page,
      baseURL,
      '/insurances',
      /Insurances/i,
      insurancesColumns,
    )

    this.switchToPublicInsurancesButton =
      page.getByRole('tablist').getByRole(
        'tab',
        { name: this.tablistButtonLabels.publicInsurances }
      )
    this.switchToPrivateInsurancesButton =
      page.getByRole('tablist').getByRole(
        'tab',
        { name: this.tablistButtonLabels.privateInsurances }
      )
    this.switchToBgInsurancesButton =
      page.getByRole('tablist').getByRole(
        'tab',
        { name: this.tablistButtonLabels.bgInsurances }
      )
  }

  async duplicateKeysInCreateVersionTest (data: SampleData) {
    await this.createNewVersionButton.click()

    await this.expectSetVersionDateInputToHaveTodaysDate()

    await expect(this.tableRows).toHaveCount(1) // only the header row is visible
    await expect(this.saveVersionButton).toBeVisible()
    await expect(this.saveVersionButton).not.toBeDisabled()

    await this.addRowsWithData(data, 2, true)
    await expect(this.tableRows).toHaveCount(1 + 2) // two rows added

    const firstRowCell = await this.getTableCellByColumnLabel(1, this.columns.number.label)
    const secondRowCell =
      await this.getTableCellByColumnLabel(2, this.columns.number.label)

    await this.expectDuplicateKeyError(firstRowCell)
    await this.expectDuplicateKeyError(secondRowCell)

    const deleteSecondRowButton = this.getDeleteRowButton(2)
    await deleteSecondRowButton.click()
    await expect(this.tableRows).toHaveCount(2) // the second row is deleted

    await this.clearAllButton.click()
    await expect(this.tableRows).toHaveCount(1) // the first row is deleted, as well
  }

  async addNewVersionTest (data: SampleData) {
    await expect(this.tableRows).toHaveCount(1) // only headers row is visible

    await this.addRowsWithData(data, 3)

    await expect(this.saveVersionButton).not.toBeDisabled()
    await this.saveVersionButton.click()
    await sleep(500) // await for page reloading before update cell locators
    // this sleep command should not be removed

    await expect(this.tableRows).toHaveCount(1 + 3) // the rows are saved
    await this.expectRowsToHaveData(data)
  }
}
