import { Role } from '@smambu/lib.constantsjs'
import { expect } from '@playwright/test'
import { loginDefaultSuperUser } from './functions'
import { DefaultTestType, InputTestSpec, InputRoleFixture, RoleFixture } from '../types/types'

export const createRoleFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  roles: InputRoleFixture[]
) => {
  roles.forEach(role => {
    const role_name = role.name
    test = test.extend<RoleFixture>({
      roles:
        async ({ roles }, use) => {
          const roleExists = await checkIfRoleExistsViaApi(role_name)
          let result: Role
          if (!roleExists) result = await createRoleViaApi(role)
          else result = roleExists
          await use([...roles, result])
        }
    })
  })
  return test
}

const checkIfRoleExistsViaApi = async (
  name: string
): Promise<undefined | Role> => {
  const token = await loginDefaultSuperUser()

  const roles = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_ROLE_SERVICE_HOST}:${process.env.ROLE_PORT}/api/role/roles`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
  )
  const rolesJson: Role[] = await roles.json()
  const role = rolesJson.find(role => role.name === name)

  return role
}

const createRoleViaApi = async (role: InputRoleFixture): Promise<Role> => {
  const token = await loginDefaultSuperUser()
  const response = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_ROLE_SERVICE_HOST}:${process.env.ROLE_PORT}/api/role/roles`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(role),
    }
  )

  expect(response.ok).toBeTruthy()

  const responseJson: Role = await response.json()

  return responseJson
}
