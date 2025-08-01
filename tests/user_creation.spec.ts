import {
  sleep,
} from '@smambu/lib.constantsjs'
import { Page, expect } from '@playwright/test'
import { prepareTest } from './setup/compile_test'
import { ALL_PERMISSIONS_ROLE } from './data/data'

const userName = 'user-list-filter-test-name'
const userSurname = 'user-list-filter-test-surname'
const email = 'user_creation_test@bytes.black'
const roleName = 'user-creation-test-role'

prepareTest({
  available_insurances: [],
  cases: [],
  rooms: [],
  users: [],
  contracts: [],
  opStandards: [],
  roles: [ALL_PERMISSIONS_ROLE(roleName)],
})(
  'user creation',
  async ({
    page,
    baseURL,
    available_insurances,
    rooms,
    users,
    contracts,
    opStandards,
    roles,
    cases,
  }) => {
    await createUser(page, email, userName, userSurname, roleName)
  }
)

const createUser = async (
  page: Page,
  email: string,
  name: string,
  surname: string,
  role_name: string
) => {
  await page.goto(`${process.env.APP_URL as string}/users`)

  await page.getByRole('button', { name: 'Create new user' }).click()
  await page.getByLabel('Name*', { exact: true }).click()
  await page.getByLabel('Name*', { exact: true }).fill(name)
  await page.getByLabel('Surname*').click()
  await page.getByLabel('Surname*').fill(surname)
  await page.getByLabel('Email*').click()
  await page.getByLabel('Email*').fill(email)
  await page
    .getByRole('button', { name: 'Add another role to the user' })
    .click()
  await page.getByLabel('Role').click()
  await page.getByRole('option', { name: role_name, exact: true }).click()
  await page.getByRole('button', { name: 'Create and activate' }).click()
  await sleep(200)
  await expect(
    page.locator('div').filter({ hasText: 'User created successfully' })
      .nth(2)
  ).toBeVisible()
  await sleep(200)
}
