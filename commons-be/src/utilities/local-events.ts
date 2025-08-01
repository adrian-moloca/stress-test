import {
  ALLOWED_EVENTS_TYPES,
  setNestedValue,
  tLocalEventValue,
  tSourceSchemaValues,
  getObjectsDiff,
  OBJECT_DIFF_EVENTS,
  tValidEventName,
  tUpdateDoc,
  tContextTest,
  tDocBeforeUpdate,
  tLocalEventPayload,
  tMetadataFun,
  tRenderFun,
} from '@smambu/lib.constantsjs'
import { Connection, Model, ObjectId } from 'mongoose'
import { LocalEvents } from '../schemas'

export const getConnection = (context: tContextTest): Connection => {
  if (context.db) return context.db

  if (context.model) {
    const model = context.model()

    return model.db!
  }

  // This should never happen, but better safe than sorry
  throw new Error(`No connection obtainable from context ${context}`)
}

export const applyUpdateToDocument = (
  update: tUpdateDoc,
  docBeforeUpdate: tDocBeforeUpdate,
  options: any
) => {
  const docUpdated = { ...docBeforeUpdate }

  const keys = Object.keys(update)
  const nonMongoKeys = keys.filter(current => !current.startsWith('$') && !current.startsWith('_'))

  for (const key of nonMongoKeys) {
    const newElement = docUpdated[key]
    const newElementExists = newElement != null

    const isArray = Array.isArray(newElement)
    const isObjectType = typeof newElement === 'object'
    // @ts-expect-error types are a mess right now
    const objectHasKeys = newElementExists ? Object.keys(newElement) > 0 : false
    const isObject = isObjectType && objectHasKeys

    let payload
    if (isArray) {
      // @ts-expect-error ts is wrong
      const uniqueElements = new Set([...newElement, ...update[key]])

      payload = [...uniqueElements]
    }

    if (isObject)
      payload = {
        ...(docUpdated[key] as Record<string, unknown>),
        ...update[key],
      }

    if (!isArray && !isObject) payload = update[key]

    Object.assign(docUpdated, {
      [key]: payload,
    })
  }

  if (update.$set) Object.assign(docUpdated, update.$set)

  if (update.$inc)
    for (const key in update.$inc)
      docUpdated[key] = ((docUpdated[key] as number) || 0) + update.$inc[key]

  if (update.$unset) for (const key in update.$unset) delete docUpdated[key]

  if (update.$push)
    for (const key in update.$push) {
      if (!Array.isArray(docUpdated[key])) docUpdated[key] = []

      if (typeof update.$push[key] === 'object' && update.$push[key].$each)
        docUpdated[key] = [
          ...(docUpdated[key] as Array<unknown>),
          // @ts-expect-error TODO: we should fix the update type
          ...update.$push[key].$each,
        ]
      else (docUpdated[key] as Array<unknown>).push(update.$push[key])
    }

  if (update.$pull)
    for (const key in update.$pull)
      if (Array.isArray(docUpdated[key]))
        docUpdated[key] = (docUpdated[key] as Array<unknown>).filter(
          item => item !== update.$pull[key]
        )

  if (update.$pullAll)
    for (const key in update.$pullAll)
      if (Array.isArray(docUpdated[key]))
        docUpdated[key] = (docUpdated[key] as Array<unknown>).filter(
          item => !update.$pullAll[key].includes(item)
        )

  if (update.$pop)
    for (const key in update.$pop)
      if (Array.isArray(docUpdated[key]))
        if (update.$pop[key] === 1) (docUpdated[key] as Array<unknown>).pop()
        else if (update.$pop[key] === -1) (docUpdated[key] as Array<unknown>).shift()

  if (update.$addToSet)
    for (const key in update.$addToSet) {
      if (!Array.isArray(docUpdated[key])) docUpdated[key] = []

      if (Array.isArray(update.$addToSet[key]?.$each))
        for (const val of update.$addToSet[key].$each) {
          if (!(docUpdated[key] as Array<unknown>).includes(val))
            (docUpdated[key] as Array<unknown>).push(val)
        }
      else if (!(docUpdated[key] as Array<unknown>).includes(update.$addToSet[key]))
        (docUpdated[key] as Array<unknown>).push(update.$addToSet[key])
    }

  if (update.$rename)
    for (const oldKey in update.$rename) {
      const newKey = update.$rename[oldKey]
      docUpdated[newKey as string] = docUpdated[oldKey]
      delete docUpdated[oldKey]
    }

  if (update.$mul)
    for (const key in update.$mul)
      docUpdated[key] = ((docUpdated[key] as number) || 0) * update.$mul[key]

  if (update.$min)
    for (const key in update.$min)
      if ((docUpdated[key] as number) > update.$min[key]) docUpdated[key] = update.$min[key]

  if (update.$max)
    for (const key in update.$max)
      if ((docUpdated[key] as number) < update.$max[key]) docUpdated[key] = update.$max[key]

  if (update.$currentDate) for (const key in update.$currentDate) docUpdated[key] = new Date()

  if (update.$setOnInsert && options.upsert && !docBeforeUpdate)
    Object.assign(docUpdated, update.$setOnInsert)

  return docUpdated
}

export async function registerEvent (
  conn: Connection,
  payload: tLocalEventPayload,
  LocalEventsModelName: string
) {
  if (!conn.models[LocalEventsModelName])
    // @ts-expect-error model-error
    conn.model(LocalEventsModelName, LocalEvents)

  // @ts-expect-error model-error
  const LocalEventsModel: Model<Document> = conn.model(LocalEventsModelName)

  return await LocalEventsModel.create(payload)
}

export async function getChangesPayload (
  originalDoc: Record<string, unknown>,
  updatedDoc: Record<string, unknown>,
  source: string,
  tenantId: string,
  rendererFun?: tRenderFun,
  metadataFun?: tMetadataFun,
  context?: any
) {
  let metadata = null
  if (metadataFun != null) metadata = metadataFun(originalDoc, updatedDoc)

  let parsedOriginalDoc = originalDoc
  let parsedUpdatedDoc = updatedDoc

  if (rendererFun != null) {
    parsedOriginalDoc = await rendererFun(originalDoc, context)
    parsedUpdatedDoc = await rendererFun(updatedDoc, context)
  }

  const originalValues: Record<string, unknown> = {}
  const changedValues: Record<string, unknown> = {}

  const objectDiffs = getObjectsDiff(parsedOriginalDoc ?? {}, parsedUpdatedDoc ?? {}, {})

  // avoid reporting empty changes
  const hasChanges = Object.keys(objectDiffs).length > 0
  if (hasChanges) {
    Object.keys(objectDiffs).forEach(current => {
      const { type, valueBefore, valueAfter } = objectDiffs[current]
      switch (type) {
        case OBJECT_DIFF_EVENTS.CREATED:
          setNestedValue(changedValues, current, valueAfter)
          break

        case OBJECT_DIFF_EVENTS.DELETED:
          setNestedValue(originalValues, current, valueBefore)
          break

        case OBJECT_DIFF_EVENTS.UPDATED:
          setNestedValue(originalValues, current, valueBefore)
          setNestedValue(changedValues, current, valueAfter)
          break
      }
    })

    const payload: tLocalEventPayload = {
      source,
      sourceDocId: originalDoc?._id as ObjectId,
      previousValues: originalValues,
      currentValues: changedValues,
      tenantId,
      metadata,
    }

    return payload
  }

  return null
}

export const getParsedEventType = (
  source: tSourceSchemaValues,
  previousValues: tLocalEventValue,
  currentValues: tLocalEventValue
): tValidEventName | null => {
  const hasPreviousValue = previousValues != null
  const hasCurrentValue = currentValues != null

  if (hasPreviousValue && hasCurrentValue)
    return `${source}-${ALLOWED_EVENTS_TYPES.UPDATED}`

  if (!hasPreviousValue && hasCurrentValue)
    return `${source}-${ALLOWED_EVENTS_TYPES.CREATED}`

  // XXX: this might seem wrong, but it actually happens
  // when a new field gets created without value.
  // Removing this causes a nasty and hard to track bug
  if (!hasPreviousValue && !hasCurrentValue)
    return `${source}-${ALLOWED_EVENTS_TYPES.CREATED}`

  if (hasPreviousValue && !hasCurrentValue)
    return `${source}-${ALLOWED_EVENTS_TYPES.DELETED}`

  return null
}
