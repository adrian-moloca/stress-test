import { expect } from '@playwright/test'
import {
  Contract,
  ISerializedUser,
  OpStandard,
} from '@smambu/lib.constantsjs'
import { loginDefaultSuperUser } from './functions'
import { ContractFixture, DefaultTestType, InputContract, InputTestSpec } from '../types/types'

type CreateContract = Omit<InputContract, 'opStandards' | 'details'> & {
  opStandards: Contract['opStandards'];
  details: Contract['details'];
};

export const createContractFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_contracts: InputContract[]
) => {
  input_contracts.forEach(input_contract => {
    const contract_name = input_contract.details.contractName
    test = test.extend<ContractFixture>({
      contracts:
        async ({ browser, opStandards, contracts, users }, use) => {
          const page = await browser.newPage()
          await page.goto(process.env.APP_URL as string)

          const contractExists = await checkIfContractExistsViaApi(
            contract_name
          )
          let result: Contract

          if (!contractExists)
            result = await createContractViaApi(
              substituteOpStandardNameWithOpStandardAndUser(
                input_contract,
                opStandards,
                users
              )
            )
          else result = contractExists

          await use([...contracts, result])
        },
    })
  })
  return test
}

const substituteOpStandardNameWithOpStandardAndUser = (
  contract: InputContract,
  opStandards: OpStandard[],
  users: ISerializedUser[]
): CreateContract => {
  const doctorId = users.find(
    user =>
      user.firstName === contract.details.doctorId.firstName &&
      user.lastName === contract.details.doctorId.lastName
  )
  if (!doctorId)
    throw new Error(
      `Doctor with name ${contract.details.doctorId.firstName} ${contract.details.doctorId.lastName} not found in fixture users`
    )

  return {
    ...contract,
    opStandards: contract.opStandards.reduce(
      (acc: Record<string, OpStandard>, curr: string) => {
        const opStand = opStandards.find(
          opStandard => opStandard.name === curr
        )
        if (!opStand) throw new Error(`OpStandard with name ${curr} not found`)
        acc[opStand.opStandardId] = opStand
        return acc
      },
      {}
    ),
    details: {
      ...contract.details,
      doctorId: doctorId._id
    },
  }
}

const checkIfContractExistsViaApi = async (name: string) => {
  const token = await loginDefaultSuperUser()

  const contractSearchUrl = new URL(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_CONTRACT_SERVICE_HOST}:${process.env.CONTRACT_PORT}/api/contract/contracts`
  )
  const searchParams = new URLSearchParams({ search: name, page: '0', status: 'all' })
  contractSearchUrl.search = searchParams.toString()

  const response = await fetch(contractSearchUrl.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok).toBeTruthy()

  const contract = await response.json()
  if (contract.results.length > 1)
    throw new Error(
      `Found zero or more than one contract with the same name ${name}`
    )
  return contract.results.length === 1 ? contract.results[0] : null
}

const createContractViaApi = async (contract: CreateContract) => {
  const token = await loginDefaultSuperUser()
  const response = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_CONTRACT_SERVICE_HOST}:${process.env.CONTRACT_PORT}/api/contract/contracts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contract),
    }
  )

  expect(response.ok).toBeTruthy()

  const result = await response.json()
  return result
}
