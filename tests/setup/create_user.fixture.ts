import { ISerializedUser, Role } from '@smambu/lib.constantsjs'
import { expect } from '@playwright/test'
import { loginDefaultSuperUser } from './functions'
import { DefaultTestType, InputTestSpec, InputTestUser, UserFixture } from '../types/types'

export const createUserFixture = (
  test: DefaultTestType,
  testSpec: InputTestSpec,
  input_users: InputTestUser[]
) => {
  input_users.forEach(input_user => {
    test = test.extend<UserFixture>({
      users:
        async ({ users, roles }, use: (arg0: any[]) => any) => {
          const userExists = await checkIfUserExistsViaApi(
            input_user.firstName,
            input_user.lastName
          )
          let result: ISerializedUser
          if (!userExists)
            result = await createUserViaApi( // TODO: fix payload with a generic createUserDto
              findRolesIdByName(roles, input_user.role_names),
              input_user
            )
          else result = userExists

          await use([...users, result])
        }
    })
  })
  return test
}

const checkIfUserExistsViaApi = async (
  firstName: string,
  lastname: string
): Promise<ISerializedUser> => {
  const token = await loginDefaultSuperUser()
  const users = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_USER_SERVICE_HOST}:${process.env.USER_PORT}/api/user/users`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
  )

  expect(users.ok).toBeTruthy()
  const usersJson = await users.json()
  const user = usersJson.find(
    (user: any) => user.firstName === firstName && user.lastName === lastname
  )
  return user
}

const createUserViaApi = async (
  roles_id: string[],
  input_user: InputTestUser,
) => {
  const token = await loginDefaultSuperUser()
  const rolesAssociations = []
  for (const role_id of roles_id) {
    const roleAssociation = await fetch(
      `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_ROLE_SERVICE_HOST}:${process.env.ROLE_PORT}/api/role/role-associations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: role_id, users: [], id: 'new' }),
      }
    )

    expect(roleAssociation.ok).toBeTruthy()
    const roleAssociationJson = await roleAssociation.json()
    rolesAssociations.push(roleAssociationJson.id)
  }

  const user = await fetch(
    `${process.env.BACKEND_PROTOCOL}://${process.env.VITE_USER_SERVICE_HOST}:${process.env.USER_PORT}/api/user/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...input_user,
        roleAssociations: [...rolesAssociations, ...['new']],
      }),
    }
  )

  expect(user.ok).toBeTruthy()

  const userJson = await user.json()
  return userJson
}

const findRolesIdByName = (roles: Role[], role_names: string[]) => {
  return roles.filter(role => role_names.includes(role.name)).map(role => role.id)
}
