import { expect, test } from './fixtures/materials_db.fixture'
import { sleep } from '@smambu/lib.constantsjs'

test.describe('anagraphics - material\'s DB', () => {
  test('duplicate keys give an error in create mode', async ({ mdbPage, data }) => {
    await mdbPage.createNewVersionButton.click()

    await mdbPage.expectSetVersionDateInputToHaveTodaysDate()

    await expect(mdbPage.tableRows).toHaveCount(1) // only the header row is visible
    await expect(mdbPage.saveVersionButton).toBeVisible()
    await expect(mdbPage.saveVersionButton).not.toBeDisabled()

    await mdbPage.addRowsWithData(data, 2, true)
    await expect(mdbPage.tableRows).toHaveCount(1 + 2) // two rows added

    const firstRowCell = await mdbPage.getTableCellByColumnLabel(1, mdbPage.columns.articleNumber.label)
    const secondRowCell =
      await mdbPage.getTableCellByColumnLabel(2, mdbPage.columns.articleNumber.label)

    await mdbPage.expectDuplicateKeyError(firstRowCell)
    await mdbPage.expectDuplicateKeyError(secondRowCell)

    const deleteSecondRowButton = mdbPage.getDeleteRowButton(2)
    await deleteSecondRowButton.click()
    await expect(mdbPage.tableRows).toHaveCount(2) // the second row is deleted

    await mdbPage.clearAllButton.click()
    await expect(mdbPage.tableRows).toHaveCount(1) // the first row is deleted, as well
  })

  test('Add new version', async ({ mdbPage, data }) => {
    await mdbPage.createNewVersionButton.click()

    await expect(mdbPage.tableRows).toHaveCount(1) // only headers row is visible

    await mdbPage.addRowsWithData(data, 3)

    await expect(mdbPage.saveVersionButton).not.toBeDisabled()
    await mdbPage.saveVersionButton.click()
    await sleep(500) // await for page reloading before update cell locators
    // this sleep command should not be removed

    await expect(mdbPage.tableRows).toHaveCount(1 + 3) // the rows are saved
    await mdbPage.expectRowsToHaveData(data)
  })

  test('Duplicate keys give an error in edit mode', async ({ mdbPage }) => {
    await expect(mdbPage.tableRows).not.toHaveCount(3)

    await mdbPage.editVersionButton.click()

    expect(mdbPage.switchToPreviousVersionButton).not.toBeVisible()
    expect(mdbPage.switchToNextVersionButton).not.toBeVisible()

    const deleteRowButton = mdbPage.getDeleteRowButton(1)
    await expect(deleteRowButton).not.toBeVisible()
    await expect(mdbPage.clearAllButton).not.toBeVisible()
    await expect(mdbPage.setVersionDateInput).not.toBeVisible()

    const firstRowCell = await mdbPage.getTableCellByColumnLabel(
      1,
      mdbPage.columns.articleNumber.label
    )

    const validValue = await firstRowCell.getByRole('textbox').inputValue()

    await firstRowCell.getByRole('textbox').fill('')
    await expect(mdbPage.saveVersionButton).toBeDisabled()

    const secondRowCell = await mdbPage.getTableCellByColumnLabel(
      2,
      mdbPage.columns.articleNumber.label
    )

    const forbiddenValue = await secondRowCell.getByRole('textbox').inputValue()

    await firstRowCell.getByRole('textbox').fill(forbiddenValue)
    await mdbPage.pageHeader.click()

    await expect(mdbPage.saveVersionButton).toBeDisabled()
    await mdbPage.expectDuplicateKeyError(firstRowCell)
    await mdbPage.expectDuplicateKeyError(secondRowCell)

    await firstRowCell.getByRole('textbox').fill(validValue)
    await mdbPage.pageHeader.click()
    await expect(mdbPage.saveVersionButton).not.toBeDisabled()
  })

  test('Edit version', async ({ mdbPage, data }) => {
    await mdbPage.editVersionButton.click()
    const rowsNumber = await mdbPage.tableRows.count()
    await mdbPage.addRowsWithData(data, 1)
    await mdbPage.cancelButton.click()
    await expect(mdbPage.tableRows).toHaveCount(rowsNumber)
    await mdbPage.editVersionButton.click()
    await mdbPage.addRowsWithData(data, 1)
    await mdbPage.saveVersionButton.click()
    await sleep(500) // await for page reloading before update cell locators
    // this sleep command should not be removed
    await expect(mdbPage.tableRows).toHaveCount(rowsNumber + 1)
    await mdbPage.expectRowsToHaveData(data, rowsNumber)
  })
})
