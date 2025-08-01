import {
  sleep,
} from '@smambu/lib.constantsjs'
import { Page } from '@playwright/test'
import { prepareTest } from './setup/compile_test'

const userName = 'user-list-filter-test-name'
const userSurname = 'user-list-filter-test-surname'

prepareTest({
  available_insurances: [],
  cases: [],
  rooms: [],
  users: [
    {
      lastName: userSurname,
      title: '',
      firstName: userName,
      email: 'user_list_filter_test@bytes.black',
      phoneNumber: '123',
      birthDate: '11/11/1111',
      address: {
        city: '',
        country: '',
        houseNumber: '',
        postalCode: '',
        street: '',
      },
      role_names: [],
    },
  ],
  contracts: [],
  opStandards: [],
  roles: [],
})(
  'user list filter',
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
    await checkIfUserExists(page, userName)
  }
)

const checkIfUserExists = async (page: Page, name: string) => {
  await page.goto(`${process.env.APP_URL as string}/users`)
  await page.getByLabel('Search').click()
  await page.getByLabel('Search').fill(name)
  await sleep(200)
  return (await page.getByTitle(name).count()) > 0
}
