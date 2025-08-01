import { loginDefaultSuperUser } from './functions'
import { OperatingRoom, OpStandard } from '@smambu/lib.constantsjs'
import { expect } from '@playwright/test'
import { InputTestSpec, InputOpStandard, OpStandardFixture, DefaultTestType } from '../types/types'

export const createOpStandardFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_opStandards: InputOpStandard[]
) => {
  input_opStandards.forEach(input_opStandard => {
    const opStandard_name = input_opStandard.name
    test = test.extend<OpStandardFixture>({
      opStandards:
        async ({ browser, opStandards, rooms }, use) => {
          const page = await browser.newPage()
          await page.goto(process.env.APP_URL as string)

          const opStandardExists = await checkIfOpStandardExistsViaApi(
            opStandard_name
          )
          let result: OpStandard
          if (!opStandardExists)
            result = await createOpStandardViaApi(substituteRoomNameWithRoomId(input_opStandard, rooms))
          else result = opStandardExists

          await use([...opStandards, result])
        }
    })
  })
  return test
}

const substituteRoomNameWithRoomId = (
  input: InputOpStandard,
  rooms: OperatingRoom[]
): InputOpStandard => {
  const operatingRoomIds = input.operatingRoomIds
    .map(
      operatingRoomName =>
        rooms.find(room => room.name === operatingRoomName)?.operatingRoomId
    )
    .filter(room => room)

  if (operatingRoomIds.length !== input.operatingRoomIds.length)
    throw new Error('Some rooms were not found')

  return {
    ...input,
    operatingRoomIds: operatingRoomIds as string[],
  }
}

const checkIfOpStandardExistsViaApi = async (name: string) => {
  const token = await loginDefaultSuperUser()

  const opStandardSearchUrl = new URL(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_CONTRACT_SERVICE_HOST}:${process.env.CONTRACT_PORT}/api/contract/contracts/op-standards`
  )
  const searchParams = new URLSearchParams({ search: name })
  opStandardSearchUrl.search = searchParams.toString()

  const response = await fetch(opStandardSearchUrl.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const opStandard = await response.json()
  if (opStandard.length > 1)
    throw new Error(
      `Found zero or more than one opStandard with the same name ${name}`
    )
  return opStandard[0]
}

const createOpStandardViaApi = async (opStandard: InputOpStandard) => {
  const token = await loginDefaultSuperUser()
  const response = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_CONTRACT_SERVICE_HOST}:${process.env.CONTRACT_PORT}/api/contract/contracts/op-standards`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(opStandard),
    }
  )

  expect(response.ok).toBeTruthy()

  return await response.json()
}
