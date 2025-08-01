import { anagraphicsTypes, Capabilities, permissionRequests, PERMISSIONS_DOMAINS_SCOPES } from '../enums'
import { Case, Contract, IAnagraphicRow, IAuditTrailRow, IUser, OperatingRoom, OpStandard, Patient, Role, tFullAnagraphicSetup, tLogRow, UserPermissions } from '../types'
import { anagraphicsPermissionParser } from './anagraphicsPermissionParser'
import { casePermissionsParser } from './casePermissionParser'
import { booleanPermission, getCapabilityUsers } from './permissions'

export const collectionPermissionsParsers = {
  auditTrails: (auditTrails: IAuditTrailRow[], userPermissions: UserPermissions) => {
    const canViewAuditTrails = booleanPermission(
      permissionRequests.canViewAuditTrails,
      { userPermissions },
    )
    if (canViewAuditTrails) return auditTrails
    return []
  },

  logs: (logs: tLogRow[], userPermissions: UserPermissions) => {
    const canViewLogs = booleanPermission(permissionRequests.canViewLogs, { userPermissions })
    if (canViewLogs) return logs
    return []
  },

  roles: (roles: Role[], userPermissions: UserPermissions) => {
    const canViewRoles = booleanPermission(permissionRequests.canViewRoles, { userPermissions })
    if (canViewRoles) return roles
    return []
  },

  anagraphics: (
    rows: IAnagraphicRow[],
    userPermissions: UserPermissions,
    anagraphicSetup: tFullAnagraphicSetup,
    subType: anagraphicsTypes,
    canViewAll: boolean,
    canViewNames: boolean,
  ) => {
    return anagraphicsPermissionParser({
      anagraphicSetup,
      rows,
      userPermissions,
      subType,
      canViewAll,
      canViewNames,
    })
  },

  cases: (cases: Case[], userPermissions: UserPermissions) => {
    const viewCasesUsers = getCapabilityUsers(Capabilities.P_CASES_VIEW, userPermissions)

    const calculatedPermissions = {
      canViewDocuments: booleanPermission(permissionRequests.canViewDocuments, { userPermissions }),
      canViewBookingNotes: booleanPermission(
        permissionRequests.canViewBookingNotes,
        { userPermissions },
      ),
      canViewCheckinDocuments: booleanPermission(
        permissionRequests.canViewCheckinDocuments,
        { userPermissions },
      ),
      canViewCheckinTimestamp: booleanPermission(
        permissionRequests.canViewCheckinTimestamp,
        { userPermissions },
      ),
      canViewSurgeryInfo: booleanPermission(
        permissionRequests.canViewSurgeryInfo,
        { userPermissions },
      ),
      canViewSurgeryNotes: booleanPermission(
        permissionRequests.canViewSurgeryNotes,
        { userPermissions },
      ),
      canViewSurgeryTimestamps: booleanPermission(
        permissionRequests.canViewSurgeryTimestamps,
        { userPermissions },
      ),

      canViewAnesthesiaTimestamps: booleanPermission(
        permissionRequests.canViewAnesthesiaTimestamps,
        { userPermissions },
      ),
      canViewPatientTimestamps: booleanPermission(
        permissionRequests.canViewPatientTimestamps,
        { userPermissions },
      ),

      canViewPreopTimestamps: booleanPermission(
        permissionRequests.canViewPreopTimestamps,
        { userPermissions },
      ),
      canViewPreOpNotes: booleanPermission(
        permissionRequests.canViewPreOpNotes,
        { userPermissions },
      ),

      canViewIntraOpDocumentation: booleanPermission(
        permissionRequests.canViewIntraOpDocumentation,
        { userPermissions },
      ),
      canViewIntraOpDocuments: booleanPermission(
        permissionRequests.canViewIntraOpDocuments,
        { userPermissions },
      ),
      canViewIntraOpNotes: booleanPermission(
        permissionRequests.canViewIntraOpNotes,
        { userPermissions },
      ),

      canViewPostOpTimestamps: booleanPermission(
        permissionRequests.canViewPostOpTimestamps,
        { userPermissions },
      ),
      canViewPostOpNotes: booleanPermission(
        permissionRequests.canViewPostOpNotes,
        { userPermissions },
      ),

      canViewCheckoutDocuments: booleanPermission(
        permissionRequests.canViewCheckoutDocuments,
        { userPermissions },
      ),
      canViewCheckoutTimestamp: booleanPermission(
        permissionRequests.canViewCheckoutTimestamp,
        { userPermissions },
      ),
    }

    if (viewCasesUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
      return cases.map(c => casePermissionsParser(c, userPermissions, calculatedPermissions))

    return cases
      .filter(c => viewCasesUsers.includes(c.bookingSection.doctorId))
      .map(c => casePermissionsParser(c, userPermissions, calculatedPermissions))
  },

  // TODO UR: how we can check this?
  doctorOpStandards: (doctorOpStandards: OpStandard[]) => {
    return doctorOpStandards
  },

  // TODO UR: how we can check this?
  anesthesiologistOpStandards: (anesthesiologistOpStandards: OpStandard[]) => {
    return anesthesiologistOpStandards
  },

  contracts: (contracts: Contract[], userPermissions: UserPermissions) => {
    const viewContractsUsers = getCapabilityUsers(Capabilities.P_CONTRACTS_VIEW, userPermissions)
    if (viewContractsUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA) return contracts

    return contracts.filter(c => viewContractsUsers.includes(c.details.doctorId))
  },

  orManagement: (operatingRooms: OperatingRoom[], userPermissions: UserPermissions) => {
    const canViewOperatingRooms = booleanPermission(
      permissionRequests.canViewOr,
      { userPermissions },
    )

    if (canViewOperatingRooms) return operatingRooms
    return []
  },

  // This is necessary only if the query to mongo is not already filtered by permission
  patients: (
    patients: Patient[],
    _u: UserPermissions,
    capabilityUsers: string[] | typeof PERMISSIONS_DOMAINS_SCOPES.ALL_DATA,
  ) => {
    if (capabilityUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA) return patients
    if (!Array.isArray(capabilityUsers)) throw new Error('capabilityUsersUndefined')

    return patients.filter(patient => capabilityUsers.includes(patient.patientId))
  },

  // System configurations can be viewed by everyone
  pricePointConfigs: (pricePointConfigs: unknown) => pricePointConfigs,
  generalData: (generalData: unknown) => generalData,

  users: (users: IUser[], userPermissions: UserPermissions) => {
    const viewUsersUsers = getCapabilityUsers(Capabilities.P_USERS_VIEW, userPermissions)

    if (viewUsersUsers === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA) return users

    return users.filter(user => viewUsersUsers.includes(user._id))
  },
}
