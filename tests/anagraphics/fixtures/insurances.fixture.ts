import { test as base, expect } from '@playwright/test'
import { InsurancesFixtureProps } from '../types/types'
import { insurancesData } from '../data/data'
import { InsurancesPage } from '../pages/insurances.page'

const test = base.extend<InsurancesFixtureProps>({
  insurancesPage: async ({ page, baseURL }, use) => {
    const insurancesPage = new InsurancesPage(
      page,
      baseURL,
    )
    await insurancesPage.goto()
    await expect(insurancesPage.pageHeader).toBeVisible()
    await use(insurancesPage)
  },
  data: insurancesData
})

export { test, expect }
