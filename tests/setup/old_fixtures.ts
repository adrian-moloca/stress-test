import { sleep } from '@smambu/lib.constantsjs'
import { Page } from '@playwright/test'
import { DefaultTestType, InputTestSpec } from '../types/types'
import { logout } from './functions'

interface RoomDef {
    name: string;
  }

const checkIfRoleExists = async (page: Page, name: string) => {
  await page.goto(`${process.env.APP_URL as string}/roles`)
  await page.getByLabel('Search').click()
  await page.getByLabel('Search').fill(name)
  await sleep(500)
  return (await page.getByTitle(name).count()) > 0
}

const createRole = async (page: Page, name: string) => {
  await page.goto(`${process.env.APP_URL as string}/roles`)

  await page.getByRole('button', { name: 'Create new role' }).click()

  await page.getByLabel('Role name').fill('test-admin')
  await page.locator('[id="Can\\ access\\ data\\ of"]').first()
    .click()
  await page.getByRole('option', { name: 'All data' }).click()

  // formatCapabilities(Capabilities).forEach(async capability => {
  //   await page.locator('li').filter({ hasText: `${capability.name} ${capability.permission}` }).getByTestId('AddIcon').click()
  // })

  while (
    (await page
      .locator('li')
      .filter({ has: page.getByTestId('AddIcon') })
      .count()) > 0
  ) {
    await await page
      .locator('li')
      .filter({ has: page.getByTestId('AddIcon') })
      .first()
      .getByTestId('AddIcon')
      .click()
    await sleep(500)
  }

  await page.getByRole('button', { name: 'Save' }).click()
  await sleep(200)
}

const checkIfRoomExists = async (page: Page, name: string) => {
  await page.goto(`${process.env.APP_URL as string}/ormanagement`)
  await page.getByRole('combobox').click()
  return (await page.getByRole('option', { name }).count()) > 0
}

const createRoom = async (page: Page, name: string) => {
  await page.goto(`${process.env.APP_URL as string}/ormanagement`)

  await page.getByRole('button', { name: 'Create new OR' }).click()
  await page.getByLabel('Name *').click()
  await page.getByLabel('Name *').fill(name)
  await page.getByLabel('Name *').press('Tab')
  await page.getByLabel('Room id *').fill(name)
  await page.getByLabel('', { exact: true }).click()
  await page.getByRole('option', { name: 'Available', exact: true }).click()
  await page.getByRole('button', { name: 'Save' }).isEnabled()
  await page.getByRole('button', { name: 'Save' }).click()
  await sleep(2000)
}

// Old Create Insurance Fixture
interface PublicInsuranceDef {
  public_insurance_name: string
}
interface PrivateInsuranceDef {
  private_insurance_name: string
}

interface BGInsuranceDef {
  bg_insurance_name: string
}

type InsuranceDef = PublicInsuranceDef | PrivateInsuranceDef | BGInsuranceDef

interface InsuranceFixture {
  available_insurances: InsuranceDef[]
}

const createInsuranceFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_available_insurances: InsuranceDef[]
) => {
  if (!input_available_insurances.length)
    return test

  return test.extend<{}, InsuranceFixture>({
    available_insurances: [
      async ({ browser, available_insurances }, use) => {
        const page = await browser.newPage()
        await page.goto(`${process.env.APP_URL as string}/insurances`)

        for (const input_insurance of input_available_insurances) {
          const { insurance_name, insurance_type } = getInsuranceDesc(input_insurance)
          await createIfNotExistsInsurance(page, insurance_name, insurance_type)
        }

        await logout(page)
        await page.close()
        await use([...available_insurances, ...input_available_insurances])
      },
      { scope: 'test' },
    ],
  })
}

const checkIfInsuranceExists = async (page: Page, name: string) => {
  // await page.goto(`${process.env.APP_URL as string}/insurances`)
  await page.getByLabel('Search').click()
  await page.getByLabel('Search').fill(name)
  const result = (await page.getByRole('cell', { name }).getByRole('textbox')
    .count()) > 0
  await page.locator('.MuiInputAdornment-root > .MuiButtonBase-root').click()
  return result
}

const createInsurance = async (page: Page, name: string, tab: string) => {
  // await page.goto(`${process.env.APP_URL as string}/insurances`)

  await page.getByRole('tab', { name: tab }).click()

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: 'New row' }).click()
  await page.getByRole('cell', { name: 'Required' }).getByRole('textbox')
    .click()
  await page.getByRole('cell', { name: 'Required' }).getByRole('textbox')
    .fill(name)
  await page.getByRole('tab', { name: tab }).click() // just a click outside the input field
  await page.getByRole('button', { name: 'Save' }).click()
}

const getInsuranceDesc = (input_insurance: InsuranceDef):
{ insurance_name: string, insurance_type: string } => {
  if ('public_insurance_name' in input_insurance)
    return { insurance_name: input_insurance.public_insurance_name, insurance_type: 'Public insurances' }
  if ('private_insurance_name' in input_insurance)
    return { insurance_name: input_insurance.private_insurance_name, insurance_type: 'Private insurances' }
  if ('bg_insurance_name' in input_insurance)
    return { insurance_name: input_insurance.bg_insurance_name, insurance_type: 'BG insurances' }
  throw new Error('Unknown insurance type')
}

const checkIfVersionExists = async (page: Page, tab: string) => {
  await page.getByRole('tab', { name: tab }).click()
  return await page.getByText('The current version is valid').count() > 0
}

const createNewVersion = async (page: Page, tab: string) => {
  await page.getByRole('tab', { name: tab }).click()
  await page.getByRole('button', { name: 'Create new version' }).click()
  await page.getByRole('button', { name: 'Save' }).click()
}

const createIfNotExistsInsurance = async (page: Page, insurance: string, tab: string) => {
  if (!(await checkIfVersionExists(page, tab)))
    await createNewVersion(page, tab)

  const insuranceExists = await checkIfInsuranceExists(page, insurance)

  if (!insuranceExists)
    await createInsurance(page, insurance, tab)
}
