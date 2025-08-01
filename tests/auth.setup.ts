import { test as setup, expect } from '@playwright/test'
import { login } from './setup/functions'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page, baseURL }) => {
  await page.goto(baseURL as string)
  await login(
    page,
    process.env.TEST_USER_NAME as string,
    process.env.TEST_USER_PASSWORD as string
  )

  await expect(page.getByText(process.env.TEST_TENANT as string)).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(process.env.TEST_TENANT as string, 'i') }).getByRole('cell', { name: 'Active' })).toBeVisible()
  await page.getByRole('row', { name: new RegExp(process.env.TEST_TENANT as string, 'i') }).getByRole('button', { name: 'Login' })
    .click()
  await expect(
    page.getByRole('heading', { name: `Login to ${process.env.TEST_TENANT}` })
  ).toBeVisible()
  await page.getByRole('button').nth(1)
    .click()
  await expect(await page.getByLabel('open drawer').nth(1)).toBeVisible()
  await page.context().storageState({ path: authFile })
})
