import { test } from './fixtures/insurances.fixture'

test.describe('anagraphics - insurances', () => {
  test('Add a new insurances public version', async ({ insurancesPage, data }) => {
    await insurancesPage.switchToPublicInsurancesButton.click()

    await insurancesPage.duplicateKeysInCreateVersionTest(data)
    await insurancesPage.addNewVersionTest(data)
  })

  test('Add a new insurances private version', async ({ insurancesPage, data }) => {
    await insurancesPage.switchToPrivateInsurancesButton.click()

    await insurancesPage.duplicateKeysInCreateVersionTest(data)
    await insurancesPage.addNewVersionTest(data)
  })

  test('Add a new insurances bg version', async ({ insurancesPage, data }) => {
    await insurancesPage.switchToBgInsurancesButton.click()

    await insurancesPage.duplicateKeysInCreateVersionTest(data)
    await insurancesPage.addNewVersionTest(data)
  })
})
