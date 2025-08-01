import {
  Schema,
  Document,
  Model,
  Query,
  FilterQuery,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose'
import { RW_PLUGIN_TAG, tDynamicChanges, tSourceSchemaValues } from '@smambu/lib.constantsjs'
import { getScopeForEntity, removeNotReadableFields, throwIfAnyUnWritable } from '../misc'

export interface DynamicEntityRWPluginOptions {
  tags: string[],
  getConfigurationJSON: () => Promise<unknown>;
}

async function handleRead (
  config: unknown,
  sourceSchema: tSourceSchemaValues,
  entity: unknown,
) {
  const store = global.als.getStore()

  // TODO: ref 1369
  const scope = getScopeForEntity(sourceSchema, entity, store!)

  await removeNotReadableFields(config, entity, sourceSchema, scope)
}

async function handleWrite (
  config: unknown,
  sourceSchema: tSourceSchemaValues,
  entity: unknown,
  changesMap: tDynamicChanges,
) {
  const store = global.als.getStore()

  const scope = getScopeForEntity(sourceSchema, entity, store!)

  await throwIfAnyUnWritable(config, entity, sourceSchema, changesMap, scope)
}

const docHooks = ['validate', 'save', 'remove'] as const
const writeHooks = [
  'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate',
  'deleteOne', 'deleteMany', 'update', 'updateOne', 'updateMany',
  'replaceOne', 'bulkWrite', 'insertMany'
] as const
const readHooks = [
  'find', 'findOne', 'findOneAndDelete', 'findOneAndReplace',
  'findOneAndUpdate', 'aggregate', 'count', 'countDocuments',
  'estimatedDocumentCount'
] as const

const docRegExp = new RegExp(`^(${docHooks.join('|')})$`)
const writeRegExp = new RegExp(`^(${writeHooks.join('|')})$`)
const readRegExp = new RegExp(`^(${readHooks.join('|')})$`)

const skipMiddleware = (): boolean => {
  const store = global.als.getStore()

  if (!store)
    throw new Error('Store not found')

  return store.skipRWMiddleware ?? false
}

const getChangesMap = (): tDynamicChanges => {
  const store = global.als.getStore()

  if (!store)
    throw new Error('Store not found')

  return store.dynamicChangesMap ?? {}
}

export function dynamicEntityRWPlugin<T extends Document> (
  schema: Schema<T, Model<T>>,
  options?: DynamicEntityRWPluginOptions,
): void {
  // @ts-expect-error ref 1434
  const schemaTags = schema.options.pluginTags ?? []

  if (!schemaTags.includes(RW_PLUGIN_TAG))
    return

  const sourceSchema = schemaTags[1]

  schema.pre(docRegExp, async function (this: T) {
    const skip = skipMiddleware()

    if (skip)
      return

    const changesMap = getChangesMap()
    const config = await options?.getConfigurationJSON()

    await handleWrite(config, sourceSchema, this.toObject(), changesMap)
  })

  schema.pre(
    writeRegExp,
    function (this: Query<T, T>, next: CallbackWithoutResultAndOptionalError) {
      (async () => {
        const skip = skipMiddleware()

        if (skip)
          return next()

        const changesMap = getChangesMap()
        const config = await options!.getConfigurationJSON()

        const filter = this.getQuery() as FilterQuery<T>
        const docs = await this.model.find(filter).exec()

        await Promise.all(
          docs.map(doc =>
            handleWrite(config, sourceSchema, doc.toObject(), changesMap))
        )

        next()
      })().catch(err => {
        next(err)
      })
    }
  )

  schema.post(
    readRegExp,
    async function (this: Query<unknown, T> | T, result: T | T[] | unknown) {
      const skip = skipMiddleware()

      if (skip)
        return

      const config = await options?.getConfigurationJSON()

      if (Array.isArray(result)) {
        const parsedResult = result as T[]
        parsedResult.forEach(async current => {
          await handleRead(config, sourceSchema, current)
        })
      } else if (result && typeof (result as Document).toObject === 'function') {
        await handleRead(config, sourceSchema, result)
      }
    },
  )
}
