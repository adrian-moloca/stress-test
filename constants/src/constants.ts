export const emailRegEx =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
export const isoDateRegEx = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z|\+\d{4})$/
export const phoneRegex = /^\+?(\d\s*-?\s*)*\d\s*$/

export const uniqueIdRegEx = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const invoicingTypes = ['time', 'operation', 'forfait']

export const drawerWidth = 250

export const calendarStartHour = '7:30'
export const calendarEndHour = '17:00'
export const calendarTimeHeightPx = 7
export const calendarMinutesInterval = 5
export const calendarMinimumIntervalsHeight = 6
export const calendarCondensedThreshold = 70
export const dayMaxWidth = 350
export const dayMinWidth = 150
export const calendardHoursWidth = 50
export const calendarTargetColumnsShown = 8
export const calendarPaddingAdjust = 120
export const calendarSpaceBetweenColumns = 10
export const calendarPollingInterval = 30000
export const calendarEllipsisGap = 4
export const calendarExpandSlotHeight = 24
export const dateString = 'yyyy-MM-dd'
export const dateTimeString = 'yyyy-MM-dd HH:mm:ss'
export const dateTimeSafeString = 'yyyy-MM-dd-HH-mm-ss-SSS'
export const tenantDataFileName = 'tenantData.json'
export const calendarDateString = 'dd MMM'
export const ampmEnabled = false
export const lastCasesNumber = 5
export const calendarNotesMaxLength = 50
export const pcMaterialsPageSize = 7

export const Weekdays = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
} as const

export const weekdaysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export const dataGridPreventedKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
export const dataGridTrueValues = ['true', '1', 1, true, 'yes']

export const defaultAuditTrailBulkThreshold = 200

export const MEDICALS_SAMMEL_CODE = 'medicals'
export const PHARMACY_SAMMEL_CODE = 'pharmacy'
export const TABLE_COLUMNS_HEADER_ALIGN = 'left'

export const PREFERRED_LOCALE = 'PREFERRED_LOCALE'

export const allowedDecimalSeparators = [',', '.']

// in material private invoices, if the item has a price greater than supplierCodeThreshold the supplierCode is shown
export const supplierCodeThreshold = 25.56

export const emailLogoFile = 'logoSMAMBUtext.png'

export const auditTrailProtectedFields = ['password', 'pendingResetToken']

export const QUEUE_NAMES = {
  CasesUpdate: 'CasesUpdate',
  URTriggerEvents: 'URTriggerEvents',
  PrescriptionsGeneration: 'PrescriptionsGeneration',
  LocalEvents: 'LocalEvents',
  LocalEventsAnagraphicsQueue: 'LocalEventsAnagraphicsQueue',
  LocalEventsURQueue: 'LocalEventsURQueue',
  LocalEventsSchedulingCasesQueue: 'LocalEventsSchedulingCasesQueue',
  LocalEventsContractsQueue: 'LocalEventsContractsQueue',
  LocalEventsORMangementQueue: 'LocalEventsORMangementQueue',
  LocalEventsRolesQueue: 'LocalEventsRolesQueue',
  LocalEventsPatientAnagraphicsQueue: 'LocalEventsPatientAnagraphicsQueue',
  LocalEventsSystemConfigQueue: 'LocalEventsSystemConfigQueue',
  LocalEventsUserQueue: 'LocalEventsUserConfigQueue',
  GraphFieldsQueue: 'GraphFieldsQueue',
  DepenenciesGraphQueue: 'DepenenciesGraphQueue'
} as const

export const queueRetry = () => ({
  attempts: parseInt(process.env.CRON_RETRY_ATTEMPTS!),
  backoff: {
    type: 'exponential',
    delay: parseInt(process.env.CRON_RETRY_DELAY!),
  },
})

export const userManualFileName = 'SMAMBU User Guide.pdf'
