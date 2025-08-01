import { Document, RootFilterQuery } from 'mongoose'
import { I_PERMISSIONS_DOMAINS_SCOPES, tSupportedQueriesCollections, UserPermissions } from '../types'
import { getCapabilityUsers } from './permissions'
import { Capabilities, PERMISSIONS_DOMAINS_SCOPES } from '../enums'

function applyPermissionsWithAnd (
  key: string,
  query: RootFilterQuery<Document>,
  permittedUsersIds: string[] | I_PERMISSIONS_DOMAINS_SCOPES,
) {
  if (permittedUsersIds === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
    return query

  if (!Array.isArray(permittedUsersIds))
    throw new Error('invalidPermittedUsersIds')

  const idFilter = { [key]: { $in: permittedUsersIds } }

  if ('$and' in query && Array.isArray(query.$and))
    return {
      $and: [...(query.$and), idFilter],
    }
  else
    return {
      $and: [query, idFilter],
    }
}

export const applyGetQueryPermissions = (
  collection: tSupportedQueriesCollections,
  query: RootFilterQuery<Document>,
  userPermissions: UserPermissions | undefined,
  capabilityUsers?: string[] | I_PERMISSIONS_DOMAINS_SCOPES,
) => {
  if (userPermissions === undefined)
    return query

  let parsedQuery = {}

  switch (collection) {
    case 'contracts':
      const viewContractsUsers = getCapabilityUsers(Capabilities.P_CONTRACTS_VIEW, userPermissions)

      parsedQuery = applyPermissionsWithAnd('details.doctorId', query, viewContractsUsers)
      break

    case 'doctorOpStandards':
      const viewDoctorOpStandardsUsers = getCapabilityUsers(
        Capabilities.P_D_OPSTANDARD_VIEW,
        userPermissions,
      )
      const viewDoctorOpStandardsNamesUsers = getCapabilityUsers(
        Capabilities.P_D_OPSTANDARD_NAMES_VIEW,
        userPermissions,
      )

      if (
        viewDoctorOpStandardsUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
        viewDoctorOpStandardsUsers.length > 0 ||
        viewDoctorOpStandardsNamesUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
        viewDoctorOpStandardsNamesUsers.length > 0
      ) {
        parsedQuery = query
        break
      }
      // TODO UR: better force a empty query or throw an error?
      throw new Error('backendError_noPermission')

    case 'anesthesiologistOpStandards':
      const viewAnesthesiologistOpStandardsUsers = getCapabilityUsers(
        Capabilities.P_A_OPSTANDARD_VIEW,
        userPermissions,
      )
      const viewAnesthesiologistOpStandardsNamesUsers = getCapabilityUsers(
        Capabilities.P_A_OPSTANDARD_NAMES_VIEW,
        userPermissions,
      )

      if (
        viewAnesthesiologistOpStandardsUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
        viewAnesthesiologistOpStandardsUsers.length > 0 ||
        viewAnesthesiologistOpStandardsNamesUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
        viewAnesthesiologistOpStandardsNamesUsers.length > 0
      ) {
        parsedQuery = query
        break
      }
      // TODO UR: better force a empty query or throw an error?
      throw new Error('backendError_noPermission')

    case 'patients':
      // For view patients we need the doctors of their cases
      if (capabilityUsers === undefined)
        throw new Error('capabilityUsersUndefined')

      parsedQuery = applyPermissionsWithAnd('patientId', query, capabilityUsers)
      break
    case 'cases':
      const viewCasesUsers = getCapabilityUsers(Capabilities.P_CASES_VIEW, userPermissions)

      parsedQuery = applyPermissionsWithAnd('bookingSection.doctorId', query, viewCasesUsers)
      break
    case 'users':
      const viewUsersUsers = getCapabilityUsers(Capabilities.P_USERS_VIEW, userPermissions)

      parsedQuery = applyPermissionsWithAnd('_id', query, viewUsersUsers)
      break
    case 'materialsDatabase':
    case 'pricePointConfigs':
    case 'generalData':
    case 'orManagement':
      parsedQuery = query
      break
    default:
      throw new Error('unsupportedCollection')
  }

  return parsedQuery
}
