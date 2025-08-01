import { Page, expect } from '@playwright/test'

export const login = async (page: Page, username: string, password: string) => {
  await page.getByLabel('Email').click()
  await page.getByLabel('Email').fill(username)
  await page.getByLabel('Email').press('Tab')
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Password').press('Enter')
}

export const logout = async (page: Page) => {
  await page.getByRole('banner').getByLabel('open drawer')
    .click()
}

const loginViaApi = async (email: string, password: string, tenant: string): Promise<string> => {
  const login = await fetch(`${process.env.BACKEND_PROTOCOL}://${process.env.VITE_AUTH_SERVICE_HOST}:${process.env.AUTH_PORT}/api/auth/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  expect(login.ok).toBeTruthy()

  const responseJson = await login.json()

  const tenantId = responseJson.tenants.find((t: { name: string }) => t.name === tenant)._id

  const loginToTenant = await fetch(`${process.env.BACKEND_PROTOCOL}://${process.env.VITE_AUTH_SERVICE_HOST}:${process.env.AUTH_PORT}/api/auth/auth/loginToTenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, tenantId }),
  })

  const loginToTenantJson = await loginToTenant.json()

  return loginToTenantJson.tokenWithTenant
}

export const loginDefaultSuperUser = async () => {
  return await loginViaApi(`${process.env.TEST_USER_NAME}`, `${process.env.TEST_USER_PASSWORD}`, `${process.env.TEST_TENANT}`)
}
