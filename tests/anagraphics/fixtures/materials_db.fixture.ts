import { test as base, expect } from '@playwright/test'
import { MaterialsDbPage } from '../pages/materials_db.page'
import { materialsDbData } from '../data/data'
import { MaterialsDbFixtureProps } from '../types/types'

const test = base.extend<MaterialsDbFixtureProps>({
  mdbPage: async ({ page, baseURL }, use) => {
    const mdbPage = new MaterialsDbPage(
      page,
      baseURL,
    )
    await mdbPage.goto()
    await expect(mdbPage.pageHeader).toBeVisible()
    await use(mdbPage)
  },
  data: materialsDbData,
})

export { test, expect }
