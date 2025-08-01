import { expect } from '@playwright/test'

import { loginDefaultSuperUser } from './functions'
import { DefaultTestType, EditInsuranceRequestBody, GetInsurancesResponseBody, InputTestSpec, InsuranceDef, InsuranceFixture } from '../types/types'
import { today } from '../utils/today'
import { ANAGRAPHICS_ENDPOINT, INSURANCE_FIELDS, INSURANCE_TABS } from '../data/data'

export const createInsuranceFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_available_insurances: InsuranceDef[]
) => {
  if (!input_available_insurances.length)
    return test

  return test.extend<InsuranceFixture>({
    available_insurances:
      async ({ available_insurances }, use) => {
        const publicInsurances: (string | number)[] = []
        const privateInsurances: (string | number)[] = []
        const BGInsurances: (string | number)[] = []

        for (const input_insurance of input_available_insurances) {
          const { insuranceNumber, insuranceTab } = getInsuranceTab(input_insurance)
          switch (insuranceTab) {
            case INSURANCE_TABS.PUBLICINSURANCES:
              publicInsurances.push(insuranceNumber)
              break
            case INSURANCE_TABS.PRIVATEINSURANCES:
              privateInsurances.push(insuranceNumber)
              break
            case INSURANCE_TABS.BGINSURANCES:
              BGInsurances.push(insuranceNumber)
          }
        }

        const token = await loginDefaultSuperUser()
        const versionId = await setUpInsurances(publicInsurances, INSURANCE_TABS.PUBLICINSURANCES, token)
        await setUpInsurances(privateInsurances, INSURANCE_TABS.PRIVATEINSURANCES, token)
        await setUpInsurances(BGInsurances, INSURANCE_TABS.BGINSURANCES, token)

        const inputAvailableInsurancesWithVersionId =
          input_available_insurances.map(insurance => ({ ...insurance, version_id: versionId }))

        await use([...available_insurances, ...inputAvailableInsurancesWithVersionId])
      }
  })
}

const getInsuranceTab =
  (input_insurance: InsuranceDef): { insuranceNumber: string, insuranceTab: INSURANCE_TABS } => {
    if ('public_insurance_name' in input_insurance)
      return { insuranceNumber: input_insurance.public_insurance_name, insuranceTab: INSURANCE_TABS.PUBLICINSURANCES }
    if ('private_insurance_name' in input_insurance)
      return { insuranceNumber: input_insurance.private_insurance_name, insuranceTab: INSURANCE_TABS.PRIVATEINSURANCES }
    if ('bg_insurance_name' in input_insurance)
      return { insuranceNumber: input_insurance.bg_insurance_name, insuranceTab: INSURANCE_TABS.BGINSURANCES }
    throw new Error('Unknown insurance type')
  }

const makeEmptyRow = (insuranceNumber: number | string, insuranceTab: INSURANCE_TABS, date: string) => {
  const row = Array(Object.keys(INSURANCE_FIELDS[insuranceTab]).length).fill(null)
  row[INSURANCE_FIELDS[insuranceTab].nummer] = insuranceNumber
  row[INSURANCE_FIELDS[insuranceTab].dateAdded] = date
  row[INSURANCE_FIELDS[insuranceTab].dateModified] = date
  return row
}

const getInsurancesInActiveVersionViaApi = async (
  insuranceTab: INSURANCE_TABS,
  date: string,
  token?: string
) => {
  if (!token)
    token = await loginDefaultSuperUser()
  const getVersionInUseResponse = await fetch(
    `${ANAGRAPHICS_ENDPOINT}/activeVersion/insurances/${insuranceTab}/${date}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    },
  )
  expect(getVersionInUseResponse.ok).toBeTruthy()
  const versionInUse = await getVersionInUseResponse.json() as GetInsurancesResponseBody
  return versionInUse
}

const insertInsurancesInVersionViaApi = async (
  insuranceTab: INSURANCE_TABS,
  rows: string[][],
  versionDateIsoString: string,
  versionId?: string,
  token?: string
) => {
  if (!token)
    token = await loginDefaultSuperUser()

  const body: EditInsuranceRequestBody = {
    _id: versionId,
    fromDate: versionDateIsoString,
    anagraphicFields: Object.keys(INSURANCE_FIELDS[insuranceTab]),
    rows
  }

  const editVersionResponse = await fetch(
    `${ANAGRAPHICS_ENDPOINT}/insurances/${insuranceTab}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body)
    }
  )
  expect(editVersionResponse.ok).toBeTruthy()
}

export const setUpInsurances = async (
  insuranceNumbers: (string | number)[],
  insuranceTab: INSURANCE_TABS,
  token?: string
) => {
  if (!token)
    token = await loginDefaultSuperUser()

  const { date, dateIsoString } = today()
  const versionInUse = await getInsurancesInActiveVersionViaApi(insuranceTab, date, token)

  const rows: string[][] = []
  if (versionInUse.rows) {
    rows.push(...versionInUse.rows)
    insuranceNumbers.forEach(number => {
      if (!versionInUse.rows?.some(row => (row[INSURANCE_FIELDS[insuranceTab].nummer] === String(number))))
        rows.push(makeEmptyRow(number, insuranceTab, dateIsoString))
    })
  } else {
    insuranceNumbers.forEach(number => {
      rows.push(makeEmptyRow(number, insuranceTab, dateIsoString))
    })
  }

  await insertInsurancesInVersionViaApi(insuranceTab, rows, dateIsoString, versionInUse._id, token)
  return versionInUse._id
}
