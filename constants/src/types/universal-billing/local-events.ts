// WARNING If we type this more, remember to update the schemas to reflect the new
// values
export type tLocalEventValue = Record<string, unknown> | null

export const SOURCE_SCHEMAS = {
  ANAGRAPHICS: 'anagraphics',
  BGDEBTORNUMBER: 'bgDebtorNumber',
  CASE_BILLING: 'caseBilling',
  CONTRACTS: 'contracts',
  ANESTHESIOLOGIST_OPSTANDARD: 'anesthesiologistOPStandard',
  OPSTANDARDS: 'opStandards',
  SURGERY_SLOTS: 'surgerySlots',
  CASES_LAST_UPDATES: 'caseLastUpdates',
  CASES: 'cases',
  CASES_BACKUP: 'casesBackup',
  LOCKED_WEEKS: 'lockedWeeks',
  SCHEDULE_NOTES: 'scheduleNotes',
  DOMAINS: 'domain',
  DEPENDENCIES_GRAPH: 'dependenciesGraph',
  JSON_CONFIG: 'jsonConfig',
  BILLING_CONFIG: 'billingConfig',
  DYNAMIC_DATA_CONFIG: 'dynamicDataConfig',
  PROXY: 'proxy',
  TRIGGERS: 'triggers',
  TRIGGER_EVENTS: 'triggerDBEvents',
  OR_MANAGEMENT: 'orManagement',
  OR_SCHEDULING: 'orScheduling',
  CAPABILITIES: 'capabilities',
  ROLES: 'roles',
  ROLE_ASSOCIATION: 'roleAssociation',
  PATIENTS: 'patients',
  PATIENT_ANAGRAPHICS: 'patientAnagraphics',
  CREDENTIALS: 'credentials',
  DEBTOR_NUMBER: 'debtorNumber',
  ROLE_ASSOCIATION_USER: 'roleAssociationUser',
  SYSTEM_CONFIGURATIONS: 'systemConfigurations',
  USERS: 'users',
  DATA: 'data',
} as const

export const ALLOWED_EVENTS_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
}

export type tSourceSchemaValues = typeof SOURCE_SCHEMAS[keyof typeof SOURCE_SCHEMAS]
export type tAllowedEventTypesValues = typeof ALLOWED_EVENTS_TYPES[keyof
  typeof ALLOWED_EVENTS_TYPES]

export type tValidEventName =
`${(typeof SOURCE_SCHEMAS)[keyof typeof SOURCE_SCHEMAS]}-${(typeof ALLOWED_EVENTS_TYPES)[keyof typeof ALLOWED_EVENTS_TYPES]}`

export type tEventsSenderServiceParams = {
  cronString: string
  lockName: string
}
