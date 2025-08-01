import { HttpException, HttpStatus } from '@nestjs/common'
import {
  evaluateExpression,
  getBackendExecuteHttp,
  getMiddlewareEvaluateNamedExpressions,
  getMiddlewareExecuteQuery,
  SOURCE_SCHEMAS,
  SUPPORTED_LOCALES,
  tAsyncLocalStorage,
  tBillingConfig,
  tEvaluateNamedExpression,
  tExecuteHttp,
  tExecuteQuery,
  tExpression,
  tExpressionResult,
  tList,
  tProxy,
  tScope,
  tSourceSchemaValues,
  tSupportedLocales,
  tFieldDefinition,
  tObject,
  tDynamicChanges,
  CHANGING_AGENTS,
  Contract,
  OpStandard,
  Case,
  tContractsDynamicData,
  tProxyDynamicFields,
  tDynamicFields,
  tDynamicSections,
  tOPStandardDynamicData,
  tCasesDynamicData,
  tDynamicDataList,
  genericPermissionError
} from '@smambu/lib.constantsjs'

export function getScopeForEntity (entitySourceSchema: tSourceSchemaValues,
  // TODO: ref #1155, Type when dynamic-data is finally completed
  entity: unknown,
  alsStore: tAsyncLocalStorage): tScope {
  switch (entitySourceSchema) {
    case SOURCE_SCHEMAS.PROXY:
    case SOURCE_SCHEMAS.CONTRACTS:
    case SOURCE_SCHEMAS.OPSTANDARDS:
    case SOURCE_SCHEMAS.CASES:
      return ({
        self: {
          entity,
          userPermissions: alsStore.userPermissions
        }
      })

    default:
      throw Error(`Error: entity of schema ${entitySourceSchema} has no scope function`)
  }
}

export function isRecursiveField (definition: tFieldDefinition) {
  const recursiveKinds = ['list', 'object']

  return recursiveKinds.includes(definition.type.kind)
}

export function isUserEditedField (
  fieldPath: string,
  changesMap: tDynamicChanges,
  recursive: boolean = false
): boolean {
  if (recursive) {
    const anyMatches = Object.keys(changesMap)
      .some(current => current.startsWith(fieldPath))

    return anyMatches
  }

  return changesMap[fieldPath] === CHANGING_AGENTS.USER
}

export function isSystemEditedField (
  fieldPath: string,
  changesMap: tDynamicChanges,
  recursive: boolean = false
): boolean {
  if (recursive) {
    const anyMatches = Object.keys(changesMap)
      .some(current => current.startsWith(fieldPath))

    return anyMatches
  }

  return changesMap[fieldPath] === CHANGING_AGENTS.SYSTEM
}

async function applyReadableFromConfig (
  definition: tFieldDefinition,
  instanciatedField: unknown,
  scope: tScope,
  deleteCB: () => void
) {
  const type = definition.type
  const typeKind = type.kind

  const readableExpression = definition.readable
  const { value, error } = await EvaluateExpressionNoQueryNoNamedExpr(readableExpression,
    scope)

  if (error != null && error !== '')
    throw new Error(error)

  // TODO: ref #1396
  const canReadField = value as boolean

  if (!canReadField) {
    deleteCB()

    return
  }

  let parsedField
  switch (typeKind) {
    case 'list':
      parsedField = type as tList

      const parsedInsField = (instanciatedField as unknown[])
      for (let i = 0; i < parsedInsField.length; i++) {
        const deleteCB = () => parsedInsField.splice(i, 1)

        await applyReadableFromConfig(parsedField.itemType, parsedInsField[i], scope, deleteCB)
      }

      break

    case 'object':
      parsedField = type as tObject

      Object.entries(parsedField.object).forEach(async ([key, definition]) => {
        const currentValue = (instanciatedField as Record<string, unknown>)[key]
        const deleteCB = () => {
          delete (instanciatedField as Record<string, unknown>)[key]
        }

        await applyReadableFromConfig(definition, currentValue, scope, deleteCB)
      })
      break

    // no default
  }
}

async function applyWritableFromConfig (
  fieldId: string,
  definition: tFieldDefinition,
  instanciatedField: unknown,
  scope: tScope,
  changesMap: tDynamicChanges,
  prefix:string = '',
) {
  const type = definition.type
  const typeKind = type.kind

  const currentPrefix = prefix !== '' ? `${prefix}.${fieldId}` : fieldId

  const isRecursive = isRecursiveField(definition)

  const wasEdited = isUserEditedField(currentPrefix, changesMap, isRecursive)

  if (wasEdited) {
    const writableExpression = definition.writable
    const { value, error } = await EvaluateExpressionNoQueryNoNamedExpr(writableExpression,
      scope)

    if (error != null && error !== '')
      throw new Error(error)

    // TODO: ref #1396
    const canWriteField = value as boolean

    if (!canWriteField)
      throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)
  }

  let parsedField
  switch (typeKind) {
    case 'list':
      parsedField = type as tList

      const parsedInsField = (instanciatedField as unknown[])
      for (let i = 0; i < parsedInsField.length; i++)
        await applyWritableFromConfig(`${i}`,
          parsedField.itemType,
          parsedInsField[0],
          scope,
          changesMap,
          currentPrefix)

      break

    case 'object':
      parsedField = type as tObject

      Object.entries(parsedField.object).forEach(async ([key, definition]) => {
        const currentValue = (instanciatedField as Record<string, unknown>)[key]

        await applyWritableFromConfig(key,
          definition,
          currentValue,
          scope,
          changesMap,
          currentPrefix)
      })
      break

    // no default
  }
}

export function getReadableFields (entitySourceSchema: tSourceSchemaValues,
// TODO: ref #1155, Type when dynamic-data is finally completed
  entity: unknown): tProxyDynamicFields | tDynamicFields | tDynamicSections {
  let parsedEntity
  switch (entitySourceSchema) {
    case SOURCE_SCHEMAS.PROXY:
      parsedEntity = entity as tProxy

      return parsedEntity.dynamicFields

    case SOURCE_SCHEMAS.CONTRACTS:
      parsedEntity = entity as Contract

      // TODO: ref issue #1433
      return parsedEntity.dynamicSections ?? {}

    case SOURCE_SCHEMAS.OPSTANDARDS:
      parsedEntity = entity as OpStandard

      // TODO: ref issue #1433
      return parsedEntity.dynamicSections ?? {}

    case SOURCE_SCHEMAS.CASES:
      parsedEntity = entity as Case

      // TODO: ref issue #1433
      return parsedEntity.dynamicFields ?? {}

    default:
      throw Error(`Error: entity of schema ${entitySourceSchema} has no dynamic data getter`)
  }
}

export async function removeNotReadableForProxy (config: tBillingConfig,
  entity: tProxy,
  entitySchema: tSourceSchemaValues,
  scope: tScope) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  const domainId = entity.domainId

  const matchingDomain = config.domains
    .find(current => current.domainId === domainId)

  if (matchingDomain === undefined)
    throw new Error(`Error: domain with id ${domainId} does not exists in the provided configuration`)

  const domainFields = matchingDomain.proxyFields

  if (dynamicFields === undefined)
    return

  for (const field of domainFields) {
    const currentField = dynamicFields[field.id]
    const deleteCB = () => {
      delete dynamicFields[field.id]
    }

    await applyReadableFromConfig(field.definition, currentField, scope, deleteCB)
  }
}

export async function removeNotReadableForContracts (config: tContractsDynamicData,
  entity: Contract,
  entitySchema: tSourceSchemaValues,
  scope: tScope) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  if (dynamicFields === undefined)
    return

  const sections = Object.values(config.sections)

  for (const section of sections) {
    const sectionFields = section.fields

    for (const field of sectionFields) {
      const currentField = dynamicFields[field.id]
      const deleteCB = () => {
        delete dynamicFields[field.id]
      }

      await applyReadableFromConfig(field.definition, currentField, scope, deleteCB)
    }
  }
}

export async function removeNotReadableForOPStandards (config: tOPStandardDynamicData,
  entity: OpStandard,
  entitySchema: tSourceSchemaValues,
  scope: tScope) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  if (dynamicFields === undefined)
    return

  const sections = Object.values(config.sections)

  for (const section of sections) {
    const sectionFields = section.fields

    for (const field of sectionFields) {
      const currentField = dynamicFields[field.id]
      const deleteCB = () => {
        delete dynamicFields[field.id]
      }

      await applyReadableFromConfig(field.definition, currentField, scope, deleteCB)
    }
  }
}

export async function removeNotReadableForCases (config: tCasesDynamicData,
  entity: Case,
  entitySchema: tSourceSchemaValues,
  scope: tScope) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  if (dynamicFields === undefined)
    return

  const caseDynamicFields = config.fields

  for (const field of caseDynamicFields) {
    const currentField = dynamicFields[field.id]
    const deleteCB = () => {
      delete dynamicFields[field.id]
    }

    await applyReadableFromConfig(field.definition, currentField, scope, deleteCB)
  }
}

export async function removeNotReadableFields (config: unknown,
  entity: unknown,
  entitySchema: tSourceSchemaValues,
  scope: tScope) {
  let parsedConfig
  switch (entitySchema) {
    case SOURCE_SCHEMAS.PROXY:
      await removeNotReadableForProxy(config as tBillingConfig,
        entity as tProxy,
        entitySchema,
        scope)
      break

    case SOURCE_SCHEMAS.CONTRACTS:
      parsedConfig = config as tDynamicDataList

      await removeNotReadableForContracts(parsedConfig.contracts,
        entity as Contract,
        entitySchema,
        scope)
      break

    case SOURCE_SCHEMAS.OPSTANDARDS:
      parsedConfig = config as tDynamicDataList

      await removeNotReadableForOPStandards(parsedConfig.opStandards,
        entity as OpStandard,
        entitySchema,
        scope)
      break

    case SOURCE_SCHEMAS.CASES:
      parsedConfig = config as tDynamicDataList

      await removeNotReadableForCases(parsedConfig.cases,
        entity as Case,
        entitySchema,
        scope)
      break
  }
}

export async function checkUnWritableForProxies (
  entity: tProxy,
  entitySchema: tSourceSchemaValues,
  config: tBillingConfig,
  scope: tScope,
  changesMap: tDynamicChanges
) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  const domainId = entity.domainId

  const matchingDomain = config.domains
    .find(current => current.domainId === domainId)

  if (matchingDomain === undefined)
    throw new Error(`Error: domain with id ${domainId} does not exists in the provided configuration`)

  const domainFields = matchingDomain.proxyFields

  if (dynamicFields === undefined)
    return

  for (const field of domainFields) {
    const currentField = dynamicFields[field.id]

    await applyWritableFromConfig(
      field.id,
      field.definition,
      currentField,
      scope,
      changesMap,
      'dynamicFields'
    )
  }
}

export async function checkUnWritableForContracts (
  entity: Contract,
  entitySchema: tSourceSchemaValues,
  config: tContractsDynamicData,
  scope: tScope,
  changesMap: tDynamicChanges
) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  if (dynamicFields === undefined)
    return

  const sections = Object.values(config.sections)

  for (const section of sections) {
    const sectionFields = section.fields

    for (const field of sectionFields) {
      const currentField = dynamicFields[field.id]
      const fieldId = `${section.id}.${field.id}`

      await applyWritableFromConfig(
        fieldId,
        field.definition,
        currentField,
        scope,
        changesMap,
        'sections'
      )
    }
  }
}
export async function checkUnWritableForOPstandards (
  entity: OpStandard,
  entitySchema: tSourceSchemaValues,
  config: tOPStandardDynamicData,
  scope: tScope,
  changesMap: tDynamicChanges
) {
  const dynamicFields = getReadableFields(entitySchema, entity)

  if (dynamicFields === undefined)
    return

  const sections = Object.values(config.sections)

  for (const section of sections) {
    const sectionFields = section.fields

    for (const field of sectionFields) {
      const currentField = dynamicFields[field.id]
      const fieldId = `${section.id}.${field.id}`

      await applyWritableFromConfig(
        fieldId,
        field.definition,
        currentField,
        scope,
        changesMap,
        'sections'
      )
    }
  }
}
export async function checkUnWritableForCases (
  entity: Case,
  entitySchema: tSourceSchemaValues,
  config: tCasesDynamicData,
  scope: tScope,
  changesMap: tDynamicChanges
) {
  const dynamicFields = await getReadableFields(entitySchema, entity)

  const casesDynamicFields = config.fields

  if (dynamicFields === undefined)
    return

  for (const field of casesDynamicFields) {
    const currentField = dynamicFields[field.id]

    await applyWritableFromConfig(
      field.id,
      field.definition,
      currentField,
      scope,
      changesMap,
      'dynamicFields'
    )
  }
}

export async function throwIfAnyUnWritable (config: unknown,
  entity: unknown,
  entitySchema: tSourceSchemaValues,
  changesMap: tDynamicChanges,
  scope: tScope) {
  let parsedConfig
  switch (entitySchema) {
    case SOURCE_SCHEMAS.PROXY:
      await checkUnWritableForProxies(entity as tProxy,
        entitySchema,
        config as tBillingConfig,
        scope,
        changesMap)
      break

    case SOURCE_SCHEMAS.CONTRACTS:
      parsedConfig = config as tDynamicDataList

      await checkUnWritableForContracts(entity as Contract,
        entitySchema,
        parsedConfig.contracts,
        scope,
        changesMap)
      break

    case SOURCE_SCHEMAS.OPSTANDARDS:
      parsedConfig = config as tDynamicDataList

      await checkUnWritableForOPstandards(entity as OpStandard,
        entitySchema,
        parsedConfig.opStandards,
        scope,
        changesMap)
      break

    case SOURCE_SCHEMAS.CASES:
      parsedConfig = config as tDynamicDataList

      await checkUnWritableForCases(entity as Case,
        entitySchema,
        parsedConfig.cases,
        scope,
        changesMap)
      break
  }
}

export async function EvaluateExpressionNoQueryNoNamedExpr (
  expression: tExpression,
  scope: tScope
) {
  const executeHttp: tExecuteHttp = getBackendExecuteHttp()
  const executeQuery: tExecuteQuery = getMiddlewareExecuteQuery()
  const evaluateNamedExpression: tEvaluateNamedExpression = getMiddlewareEvaluateNamedExpressions()

  // XXX: locale should be irrelevant for this kind of evaluations. If not, please
  // change this accordingly
  const selectedLocale = Object.keys(SUPPORTED_LOCALES)[0] as tSupportedLocales

  const evaluated:tExpressionResult = await evaluateExpression({
    mainExpression: expression,
    firstScope: scope,
    selectedLocale,
    executeQuery,
    evaluateNamedExpression,
    executeHttp
  })

  return evaluated
}
