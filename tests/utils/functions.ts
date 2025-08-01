import {
  Address,
  Contract,
  InsuranceStatus,
  ISerializedUser,
  OperatingRoom,
  OpStandard,
  sleep,
} from '@smambu/lib.constants'
import { Page, expect } from '@playwright/test'
import {
  Anagraphics,
  Insurance,
  InsuranceDef,
  PrivateInsuranceDef,
  PublicInsuranceDef,
  BGInsuranceDef,
} from '../types/types'

export const findOpStandardInContractByName = (contract: Contract, name: string): OpStandard => {
  if (!contract.opStandards) throw new Error('No opStandards in contract')

  const opStandard = Object.values(contract.opStandards).find(
    opStandard => opStandard.name === name
  )
  if (!opStandard)
    throw new Error(`OpStandard ${name} not found in contract ${contract.details.contractName}`)
  return opStandard
}

export const findContractByName = (contracts: Contract[], name: string): Contract => {
  const contract = contracts.find(contract => contract.details.contractName === name)
  if (!contract) throw new Error(`Contract ${name} not found`)
  return contract
}

export const findOpStandardInContractsByName = (
  contracts: Contract[],
  contractName: string,
  opStandardName: string
): OpStandard => {
  return findOpStandardInContractByName(findContractByName(contracts, contractName), opStandardName)
}

export const scheduleCase = async (page: Page, name: string) => {
  await page.getByLabel('open drawer').nth(1).click()
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()

  while (
    await page
      .locator('div:nth-child(5) > div:nth-child(2) > div > div')
      .filter({ hasText: name })
      .count()
  ) {
    const row = await page
      .locator('div:nth-child(5) > div:nth-child(2) > div > div')
      .filter({ hasText: name })
      .first()
    await row.hover()
    await sleep(500)
    await page.mouse.down()
    await sleep(500)
    await page.locator('div:nth-child(2) > div:nth-child(8)').hover()
    await sleep(500)
    await page.mouse.up()
    await sleep(500)
    while (await page.getByRole('alert').count()) await sleep(200)
  }
}

export const findRoomByName = (rooms: OperatingRoom[], name: string) => {
  const result = rooms.find(room => room.name === name)
  if (!result) throw new Error(`Room with name ${name} not found`)

  return result
}

export const findUserByName = (users: ISerializedUser[], name: string) => {
  const result = users.find(user => user.firstName === name)
  if (!result) throw new Error(`User with name ${name} not found`)

  return result
}

export const createCase = async (
  baseURL: string,
  page: Page,
  user: ISerializedUser,
  anagraphics: Anagraphics,
  address: Address,
  opStandard: OpStandard,
  insurance: Insurance,
  availableInsurances: InsuranceDef[]
) => {
  await page.goto(`${baseURL}/bookings/new`)
  await page.getByLabel('Title').fill(anagraphics.title)
  await page.getByLabel('Name', { exact: true }).fill(anagraphics.name)
  await page.getByLabel('Surname').fill(anagraphics.surname)
  await page.getByPlaceholder('dd/mm/yyyy').fill(anagraphics.dateOfBirth)
  await page.getByLabel('Gender', { exact: true }).click()
  await page.getByRole('option', { name: anagraphics.gender, exact: true }).click()
  await page.getByLabel('Gender at birth').click()
  await page.getByRole('option', { name: anagraphics.genderAtBirth, exact: true }).click()
  await page.getByLabel('Nationality').fill(anagraphics.nationality)
  await page.getByLabel('Insurance Status').click()
  await page.getByRole('option', { name: insurance.insuranceStatus }).click()
  if (insurance.insuranceStatus !== InsuranceStatus.NONE) {
    await page.getByLabel('Card Insurance Number').click()
    await page.getByLabel('Card Insurance Number').fill(insurance.cardInsuranceNumber)
    await page.getByLabel('Insurance', { exact: true }).click()

    let availableInsurancesToCheck: string[] = []
    if (insurance.insuranceStatus === InsuranceStatus.PRIVATE)
      availableInsurancesToCheck = availableInsurances
        .map(ins => (ins as PrivateInsuranceDef).private_insurance_name)
        .filter(a => a)

    if (insurance.insuranceStatus === InsuranceStatus.PUBLIC)
      availableInsurancesToCheck = availableInsurances
        .map(ins => (ins as PublicInsuranceDef).public_insurance_name)
        .filter(a => a)

    for (const insuranceToCheck of availableInsurancesToCheck)
      await expect(page.getByRole('option', { name: insuranceToCheck, exact: true })).toBeVisible()

    await page.getByRole('option', { name: insurance.insurance, exact: true }).click()
  }
  await page.getByLabel('Street').fill(address.street)
  await page.getByLabel('House Number').fill(address.houseNumber)
  await page.getByLabel('Postal Code').fill(address.postalCode)
  await page.getByLabel('City').fill(address.city)
  await page.getByLabel('Country').fill(address.country)
  await page.getByRole('tab', { name: 'Booking' }).click()

  const canSelectDoctor = await page
    .locator('div')
    .filter({ hasText: /^Doctor$/ })
    .locator('input')
    .isEnabled()
  if (canSelectDoctor) {
    await page.getByLabel('Doctor').click()
    await page.getByLabel('OP Standard').fill(`${user.firstName} ${user.lastName}`)
    await page
      .getByRole('option', { name: `${user.firstName} ${user.lastName}` })
      .first()
      .click()
  }

  await page.getByRole('gridcell', { name: `${new Date().getDate()}`, exact: true }).click()

  await page.locator('input[name="bookingSection\\.opStandardId"]').click()

  await page.locator('input[name="bookingSection\\.opStandardId"]').fill(`${opStandard.name}`)
  await page.getByRole('option', { name: `${opStandard.name}` }).click()

  if (insurance.insuranceStatus === InsuranceStatus.NONE) {
    await page.getByLabel('Recipient Type').click()
    await page.getByRole('option', { name: 'Doctor' }).click()
  } else {
    await page.getByLabel('Work Related').check()
    await page.getByLabel('BG', { exact: true }).click()

    for (const bg_insurance of availableInsurances.filter(
      ins => (ins as BGInsuranceDef).bg_insurance_name
    ))
      await expect(
        page.getByRole('option', {
          name: (bg_insurance as BGInsuranceDef).bg_insurance_name,
          exact: true,
        })
      ).toBeVisible()
    await page
      .getByRole('option', {
        name: (
          availableInsurances.filter(
            ins => (ins as BGInsuranceDef).bg_insurance_name
          )[0] as BGInsuranceDef
        ).bg_insurance_name,
        exact: true,
      })
      .click()
  }

  await page.getByRole('tab', { name: 'Surgery' }).click()
  await page.getByLabel('Position').click()
  await page.getByRole('option', { name: 'Supine Position' }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('button', { name: 'Save and go to details' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.getByLabel('open drawer').nth(1).click()
}
