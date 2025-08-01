import { ISerializedUser, OperatingRoom, sleep } from '@smambu/lib.constantsjs'
import { Page, expect } from '@playwright/test'
import { prepareTest } from './setup/compile_test'
import { ALL_PERMISSIONS_ROLE, SIMPLE_AVAILABLE_ROOM } from './data/data'
import { findUserByName, findRoomByName } from './utils/functions'

const userName = 'create-contract-test-name'
const userSurname = 'create-contract-test-surname'
const roleName = 'create-contract-test-role'
const roomName = 'create-contract-test-room'
const opStandardName = 'create-contract-test-op-standard'
const contractName = 'create-contract-test'

const contractDateStart = new Date()
contractDateStart.setHours(0, 0, 0, 0)
const contractDateEnd = new Date()
contractDateEnd.setDate(contractDateEnd.getDate() + 1)
contractDateEnd.setHours(0, 0, 0, 0)

prepareTest({
  available_insurances: [],
  cases: [],
  rooms: [SIMPLE_AVAILABLE_ROOM('create-contract-test-room')],
  users: [
    {
      lastName: userSurname,
      title: '',
      firstName: userName,
      email: 'create_contract_test@bytes.black',
      phoneNumber: '123',
      birthDate: '11/11/1111',
      address: {
        city: '',
        country: '',
        houseNumber: '',
        postalCode: '',
        street: '',
      },
      role_names: [roleName],
    },
  ],
  contracts: [],
  opStandards: [],
  roles: [ALL_PERMISSIONS_ROLE(roleName)],
})(
  'create simple contract',
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
    await createContact(
      `${baseURL}`,
      page,
      contractDateStart,
      findUserByName(users, userName),
      contractName,
      findRoomByName(rooms, roomName),
      opStandardName
    )
  }
)

const createContact = async (
  baseURL: string,
  page: Page,
  contractDate: Date,
  user: ISerializedUser,
  contractId: string,
  room: OperatingRoom,
  opStandardName: string
) => {
  await page.goto(baseURL)
  await page.getByLabel('open drawer').nth(1).click()
  await page.getByRole('button', { name: 'Contracts' }).click()
  await page.getByRole('button', { name: 'Create new contract' }).click()

  await page.getByLabel('Contract name*').fill(contractId)
  await sleep(500)
  await page.locator('input[name="details\\.doctorId"]').click()
  await page
    .getByRole('option', { name: new RegExp(user.firstName, 'i') })
    .first()
    .click()
  await sleep(500)
  await createOpStandard(page, room, opStandardName)

  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save' }).click()
}

const createOpStandard = async (page: Page, room: OperatingRoom, opStandardName: string) => {
  await page.getByRole('tab', { name: 'OP Standards' }).click()
  await page.getByRole('button', { name: 'Create new OP Standard' }).click()
  await page.getByRole('textbox', { name: 'Op standard name' }).click()
  await page.getByRole('textbox', { name: 'Op standard name' }).fill(`${opStandardName}`)
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: 'Absent' }).click()
  await page.getByLabel('Surgery duration (minutes)').click()
  await page.getByLabel('Surgery duration (minutes)').fill('60')
  await page.getByLabel(room.name).check()
  await page.getByRole('tab', { name: 'Booking' }).click()
  await page.getByRole('button', { name: 'Add position' }).click()
  await page.getByLabel('Position 1:').click()
  await page.getByRole('option', { name: 'Supine Position' }).click()
  await page.getByRole('tab', { name: 'Billing' }).click()
  await page.locator('[id="Billing\\ category"]').click()
  await page.getByRole('option', { name: 'Auto' }).click()
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save' }).click()
}
