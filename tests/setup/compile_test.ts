import { test as defaultTest } from '@playwright/test'
import { InputTestSpec, TestSpec, TransformerEntityMap, TTestSpecProcessPriority } from '../types/types'
import { createContractFixture } from './create_contract.fixture'
import {
  createInsuranceFixture,
} from './create_insurance.fixture'
import { createRoomFixture } from './create_room.fixture'
import { createUserFixture } from './create_user.fixture'
import { createRoleFixture } from './create_role.fixture'
import { createOpStandardFixture } from './create_opStandard.fixture'
import { createCaseFixture } from './create_case.fixture'

const EntityParserFunctionsMap: TransformerEntityMap<InputTestSpec> = {
  cases: createCaseFixture,
  available_insurances: createInsuranceFixture,
  rooms: createRoomFixture,
  users: createUserFixture,
  contracts: createContractFixture,
  roles: createRoleFixture,
  opStandards: createOpStandardFixture,
}

export const getDefaultTest = () =>
  defaultTest.extend<TestSpec>({
    cases: [],
    available_insurances: [],
    rooms: [],
    users: [],
    contracts: [],
    roles: [],
    opStandards: [],
  })

const orderTestEntity = <T>(map: TTestSpecProcessPriority<T>): (keyof T)[] => {
  return (Object.keys(map) as (keyof T)[]).sort((a, b) => map[a] - map[b])
}

export const TestSpecProcessPriority: TTestSpecProcessPriority<TestSpec> = {
  available_insurances: 0,
  rooms: 0,
  roles: 0,
  users: 1,
  opStandards: 2,
  contracts: 3,
  cases: 4,
}

export const prepareTest = (testSpec: InputTestSpec) => {
  const orderedTestEntities = orderTestEntity(TestSpecProcessPriority)
  let result = getDefaultTest()
  for (const entityType of orderedTestEntities)
    result = EntityParserFunctionsMap[entityType](
      result,
      testSpec,
      testSpec[entityType]
    )
  return result
}
