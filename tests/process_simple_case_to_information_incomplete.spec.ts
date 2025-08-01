import { expect } from '@playwright/test'
import { simpleAddress, noneInsurance, ALL_PERMISSIONS_ROLE, SIMPLE_OP_STANDARD, simpleAnagraphicForApi, SIMPLE_AVAILABLE_ROOM } from './data/data'
import { prepareTest } from './setup/compile_test'

const contractDateStart = new Date()
contractDateStart.setHours(0, 0, 0, 0)

const contractDateEnd = new Date()
contractDateEnd.setDate(contractDateEnd.getDate() + 1)
contractDateEnd.setHours(0, 0, 0, 0)

const contractName = 'process-no-insurance-case-test-1-day-contract'
const doctorName = 'process-no-insurance-case-test-doctor-name'
const doctorSurname = 'process-no-insurance-case-test-doctor-surname'
const roleName = 'process-no-insurance-case-test-role-admin'
const opStandardName = 'process-no-insurance-case-test-opStandard'
const roomName = 'process-no-insurance-case-test-room'

prepareTest(
  {
    available_insurances: [
      {
        public_insurance_name: 'public_insurance',
      },
      {
        private_insurance_name: 'private_insurance',
      },
      {
        bg_insurance_name: 'bg_insurance',
      },
      {
        public_insurance_name: 'public_insurance2',
      },
      {
        private_insurance_name: 'private_insurance2',
      },
      {
        bg_insurance_name: 'bg_insurance2',
      },
    ],
    cases: [{
      patientTab: {
        anagraphics: simpleAnagraphicForApi,
        address: simpleAddress,
        insurance: noneInsurance,
      },
      bookingTab: {
        date: new Date(),
        doctorName: `${doctorName} ${doctorSurname}`,
        opStandardName,
      }
    }],
    rooms: [SIMPLE_AVAILABLE_ROOM(roomName)],
    users: [
      {
        lastName: doctorSurname,
        title: '',
        firstName: doctorName,
        email: 'process-no-insurance-case-test@bytes.black',
        phoneNumber: '123',
        birthDate: '11/11/1111',
        address: {
          city: '',
          country: '',
          houseNumber: '',
          postalCode: '',
          street: '',
        },
        role_names: [`${roleName}`],
      },
    ],
    contracts: [
      {
        details: {
          contractName,
          doctorId: { firstName: doctorName, lastName: doctorSurname },
          kassenzulassung: false,
          validFrom: contractDateStart.getTime(),
          validUntil: contractDateEnd.getTime(),
        },
        opStandards: [opStandardName],

      },
    ],
    opStandards: [
      SIMPLE_OP_STANDARD(opStandardName, [roomName]),
    ],
    roles: [
      ALL_PERMISSIONS_ROLE(`${roleName}`),
    ],
  }
)('process no insurance case to information incomplete', async ({ page, baseURL, available_insurances, rooms, users, contracts, opStandards, roles, cases }) => {
  await page.goto(`${baseURL}/cases/${cases[0]._id}`)
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('tab', { name: 'Checkin' }).click()
  await page.getByRole('tab', { name: 'Patient' }).click()
  await page.getByRole('button', { name: 'New patient' }).click()
  await page.getByRole('tab', { name: 'Checkin' }).click()
  expect(
    await page.getByLabel('First you have to assign a room to this case')
  ).toBeHidden()
  await page.getByRole('button', { name: 'Set Patient Arrival' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.getByRole('tab', { name: 'Anesthesia' }).click()
  await page.getByRole('button', { name: 'Patient' }).click()
  await page.getByRole('button', { name: 'Set room enter time' }).click()
  await page
    .getByRole('button', { name: 'Set ready for recovery time' })
    .click()
  await page.getByRole('button', { name: 'Set room exit time' }).click()
  await page.getByRole('button', { name: 'Anesthesia', exact: true }).click()
  await page
    .getByRole('button', { name: 'Set anesthesiologist on site' })
    .click()
  await page.getByRole('button', { name: 'Set Anesthesia start time' }).click()
  await page
    .getByRole('button', { name: 'Set Released for surgery time' })
    .click()
  await page.getByRole('button', { name: 'Set Cut time' }).click()
  await page
    .getByRole('button', { name: 'Set Anesthesia finish time' })
    .click()
  await page.getByRole('button', { name: 'Set Extubation time' }).click()
  await page.getByRole('button', { name: 'Set Intubation time' }).click()
  await page
    .getByRole('button', { name: 'Set End of surgical measures' })
    .click()
  expect(await page.getByRole('tab', { name: 'Pre-op' })).toBeVisible()
  await page.getByRole('tab', { name: 'Pre-op' }).click()
  await page.getByRole('button', { name: 'Set Pre-op start time' }).click()
  await page.getByRole('button', { name: 'Set Pre-op finish time' }).click()
  await page.getByRole('tab', { name: 'Intra-op' }).click()
  await page.getByRole('button', { name: 'Set Surgery start time' }).click()
  await page.getByRole('button', { name: 'Set Surgery finish time' }).click()
  await page.getByRole('tab', { name: 'Post-op' }).click()
  await page.getByRole('tab', { name: 'Checkout' }).click()
  await page.getByRole('button', { name: 'Set patient discharge' }).click()
  await page.getByRole('tab', { name: 'Post-op' }).click()
  await page.getByRole('button', { name: 'Set Post-op start time' }).click()
  await page
    .getByRole('button', { name: 'Set arrived in recovery room' })
    .click()
  await page
    .getByRole('button', { name: 'Set ready for release time' })
    .click()
  await page.getByRole('button', { name: 'Set Post-op finish time' }).click()
  await page.getByRole('tab', { name: 'Checkout' }).click()
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Information Incomplete')).toBeVisible()
  await expect(await page.getByLabel('open drawer').nth(1)).toBeVisible()
})
