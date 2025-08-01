import { format, isValid } from 'date-fns'
import { AuditAction, Component, EntityType } from '../enums'
import {
  AnesthesiologistOpStandard,
  Case,
  Contract,
  IAnagraphicSetup,
  IAnagraphicVersion,
  ICredential,
  IUser,
  OpStandard,
  OperatingRoom,
  Patient,
  Role,
} from '../types'
import { SaveAuditTrailDto } from '../dto'
import { dateString } from '../constants'
import { callMSWithTimeoutAndRetry } from '../utils'

const basicParse = (entity: any) => ({
  ...(entity ?? {}),
  _id: undefined,
  __v: undefined,
  createdAt: undefined,
  updatedAt: undefined,
})

const parseObject = {
  [EntityType.ANAGRAPHIC]: {
    getEntityName: (entity: IAnagraphicVersion) =>
      `${entity.subType} - ${isValid(new Date(entity.fromDate)) ? format(new Date(entity.fromDate), dateString) : ''}`,
    parseEntity: (entity: any) => ({
      ...basicParse(entity),
      rows: (entity.rows ?? [])
        .map((row: any) => (Array.isArray(row) ? row : Object.values(row ?? {}))), // This is done to manage the old versions of anagraphic
    }),
  },
  [EntityType.CASE]: {
    getEntityName: (entity: Case) => entity.caseNumber,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.CONTRACT]: {
    getEntityName: (entity: Contract) => entity.details?.contractName,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.USER]: {
    getEntityName: (entity: IUser) => entity.email,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.CREDENTIAL]: {
    getEntityName: (entity: ICredential) => entity.email,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.OPSTANDARD]: {
    getEntityName: (entity: OpStandard) => entity.name,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.OPERATING_ROOM]: {
    getEntityName: (entity: OperatingRoom) => entity.operatingRoomId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.ANESTHESIOLOGIST_OPSTANDARD]: {
    getEntityName: (entity: AnesthesiologistOpStandard) => entity.name,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.PATIENT]: {
    getEntityName: (entity: Patient) => entity.patientNumber,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.ROLE]: {
    getEntityName: (entity: Role) => entity.name,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.SYSTEM_CONFIGURATION]: {
    getEntityName: (entity: any) => entity.section,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.BILL]: {
    getEntityName: (entity: any) => entity.billObjId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.CASEBILL]: {
    getEntityName: (entity: any) => entity.caseId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.INVOICE]: {
    getEntityName: (entity: any) => entity.invoiceId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.CASE_BILLING_SNAPSHOT]: {
    getEntityName: (entity: any) => entity.case.caseId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.SAMMEL_CHECKPOINT]: {
    getEntityName: (entity: any) => entity.doctorId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.SCHEDULE_NOTE]: {
    getEntityName: (entity: any) => entity.doctorId,
    parseEntity: (entity: any) => basicParse(entity),
  },
  [EntityType.PRESCRIPTION]: {
    getEntityName: (entity: any) => entity.doctorId,
    parseEntity: (entity: any) => basicParse(entity),
  },
}

export const auditTrailCreate = async ({
  logClient,
  userId,
  entityType,
  newObj,
  bypassTenant,
  anagraphicSetup,
}: {
  logClient: any
  userId: string
  entityType: keyof typeof parseObject
  newObj: any
  bypassTenant?: boolean,
  anagraphicSetup?: IAnagraphicSetup,
}) => {
  const pattern = { role: 'audit-trail', cmd: 'save' }

  const payloadData = {
    userId,
    entityType,
    entityNameOrId: parseObject[entityType].getEntityName(newObj),
    entityDatabaseId: newObj._id,
    action: AuditAction.CREATED,
    newObj: parseObject[entityType].parseEntity(newObj),
    prevObj: null,
    bypassTenant,
    anagraphicSetup,
  } as SaveAuditTrailDto

  await callMSWithTimeoutAndRetry(logClient,
    pattern,
    payloadData,
    Component.CONSTANTS)
}

export const auditTrailUpdate = async ({
  logClient,
  userId,
  entityType,
  newObj,
  prevObj,
  bypassTenant,
  anagraphicSetup,
}: {
  logClient: any
  userId: string
  entityType: keyof typeof parseObject
  newObj: any
  prevObj: any
  bypassTenant?: boolean,
  anagraphicSetup?: IAnagraphicSetup,
}) => {
  const pattern = { role: 'audit-trail', cmd: 'save' }

  const payloadData = {
    userId,
    entityType,
    entityNameOrId: parseObject[entityType].getEntityName(newObj),
    entityDatabaseId: prevObj._id,
    action: AuditAction.EDITED,
    newObj: parseObject[entityType].parseEntity(newObj),
    prevObj: parseObject[entityType].parseEntity(prevObj),
    bypassTenant,
    anagraphicSetup,
  }

  await callMSWithTimeoutAndRetry(logClient,
    pattern,
    payloadData,
    Component.CONSTANTS)
}

export const auditTrailDelete = async ({
  logClient,
  userId,
  entityType,
  prevObj,
  bypassTenant,
  anagraphicSetup,
}: {
  logClient: any
  userId: string
  entityType: keyof typeof parseObject
  prevObj: any
  anagraphicSetup?: IAnagraphicSetup
  bypassTenant?: boolean,
}) => {
  const pattern = { role: 'audit-trail', cmd: 'save' }

  const payloadData = {
    userId,
    entityType,
    entityNameOrId: parseObject[entityType].getEntityName(prevObj),
    entityDatabaseId: prevObj._id,
    action: AuditAction.REMOVED,
    newObj: null,
    prevObj: parseObject[entityType].parseEntity(prevObj),
    bypassTenant,
    anagraphicSetup,
  }

  await callMSWithTimeoutAndRetry(logClient,
    pattern,
    payloadData,
    Component.CONSTANTS)
}
