import { expect } from '@playwright/test'
import { Address, CaseFixture, InputTestSpec, InputTestCase, DefaultTestType, AnagraphicsForApi, Insurance } from '../types/types'
import { Case, CaseFormDTO, Contract, formatCaseForm, InsuranceStatus, ISerializedUser, OpStandardPosition_Name, RecipientType } from '@smambu/lib.constantsjs'
import { SCHEDULING_CASES_ENDPOINT } from '../data/data'
import { loginDefaultSuperUser } from './functions'
import { today } from '../utils/today'

export const createCaseFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_cases: InputTestCase[]
) => {
  input_cases.forEach(input_case => {
    test = test.extend<CaseFixture>({
      cases: async (
        { browser, cases, users, contracts, opStandards, available_insurances },
        use
      ) => {
        const page = await browser.newPage()
        await page.goto(process.env.APP_URL as string)
        const doctorUser = findUser(input_case.bookingTab.doctorName, users)
        const insuranceVersionId = available_insurances[0].version_id
        const insurance = { ...input_case.patientTab.insurance, versionId: insuranceVersionId }
        const newCase =
          await createCaseViaApi(
            doctorUser,
            contracts[0],
            input_case.patientTab.anagraphics,
            input_case.patientTab.address,
            insurance
          )
        await use([...cases, newCase])
      },
    })
  })
  return test
}

const createCaseViaApi = async (
  doctor: ISerializedUser,
  contract: Contract,
  anagraphics: AnagraphicsForApi,
  address: Address,
  insurance: Insurance,
  token?: string
) => {
  if (!token)
    token = await loginDefaultSuperUser()
  const { dateIsoString } = today()
  if (!contract.opStandards)
    throw new Error(`contract ${contract.contractId} has no opStandards`)

  const opStandardId = Object.keys(contract.opStandards)[0]
  const bookingValues: CaseFormDTO = formatCaseForm({})
  bookingValues.bookingPatient = {
    ...bookingValues.bookingPatient,
    ...anagraphics,
    germanInsuranceStatus: insurance.insuranceStatus,
    address: {
      ...bookingValues.bookingPatient.address,
      ...address
    }
  }
  if (insurance.insuranceStatus !== InsuranceStatus.NONE)
    bookingValues.bookingPatient = {
      ...bookingValues.bookingPatient,
      cardInsuranceNumber: insurance.cardInsuranceNumber,
      germanInsuranceId: insurance.insurance,
      insuranceVersionId: insurance.versionId ?? ''
    }

  bookingValues.bookingSection = {
    ...bookingValues.bookingSection,
    doctorId: doctor._id,
    contractId: contract.contractId,
    opStandardId,
    date: new Date(dateIsoString),
  }

  if (insurance.insuranceStatus !== InsuranceStatus.NONE)
    bookingValues.bookingSection = {
      ...bookingValues.bookingSection,
      // TODO: get this value from input and refactor insuranceDef type
      bgId: 'bg_insurance',
      // TODO: understand why this property is not typed
      bg: true
    }

  bookingValues.billingSection = {
    ...bookingValues.billingSection,
    billingContact: RecipientType.DOCTOR
  }
  bookingValues.surgerySection = {
    ...bookingValues.surgerySection,
    positions: [
      OpStandardPosition_Name.SUPINE_POSITION
    ]
  }
  const response = await fetch(
    `${SCHEDULING_CASES_ENDPOINT}/cases`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingValues)
    }
  )
  expect(response.ok).toBeTruthy()
  return await response.json() as Case
}

const findUser = (name: string, users: ISerializedUser[]): ISerializedUser => {
  const result = users.find(user => `${user.firstName} ${user.lastName}` === name)
  if (!result) throw new Error(`User ${name} not found`)
  return result
}
