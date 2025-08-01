import { format, isValid } from 'date-fns'
import { ICapabilityName, ISerializedUser, IUser } from '../types'
import { Component, Scope_Name } from '../enums'
import { callMSWithTimeoutAndRetry } from '../utils'

export const formatDateNaive = (date: Date) => {
  return format(date, 'yyyy-MM-dd')
}

export const serializeUser = (user: any): ISerializedUser => ({
  ...user,
  birthDate: isValid(user?.birthDate) ? formatDateNaive(user.birthDate) : undefined,
})

export const parseUser = (user: any): IUser => ({
  ...user,
  birthDate: isValid(new Date(user.birthDate)) ? new Date(user.birthDate) : null,
})

export const getFullName = (user?: Partial<IUser> | null, addTitle?: boolean) => {
  if (!user) return ''

  return `${user.title && addTitle ? `${user.title} ` : ''}${user.firstName} ${user.lastName}`
}

export const getUserBirthDate = (user: IUser | null, dateString: string) =>
  isValid(user?.birthDate) && user?.birthDate != null
    ? format(user.birthDate, dateString)
    : String(user?.birthDate ?? '')

export const getUsersByCapability = async (
  // TODO: find out how to import ClientProxyWithTenantId and use it here instead of any
  userClient: any,
  {
    capability,
    scope,
    ownerId,
  }: {
    capability: ICapabilityName
    scope?: Scope_Name
    ownerId?: string
  },
): Promise<IUser[]> => {
  const pattern = { role: 'user', cmd: 'getUsersWithCapability' }

  const payloadData = {
    capability,
    scope,
    ownerId,
  }
  const users = await callMSWithTimeoutAndRetry(userClient,
    pattern,
    payloadData,
    Component.CONSTANTS)

  return users
}
