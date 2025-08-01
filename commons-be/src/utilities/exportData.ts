import { ETenantDatabases, IGenericError, parseErrorMessage } from '@smambu/lib.constantsjs'
import { RpcException } from '@nestjs/microservices'
import mongoose, { Model } from 'mongoose'

export const exportData = async (connectionUrl: string) => {
  try {
    if (!connectionUrl) throw new Error('Connection URL not found')

    const store = global.als.getStore()
    const tenantId = store?.tenantId

    if (!tenantId) throw new Error('TenantId not found')

    const connection = await mongoose.createConnection(connectionUrl).asPromise()

    if (!connection) throw new Error('Connection not found')
    if (!connection.db) throw new Error('Database not found')

    const dbCollections = await connection.db.listCollections().toArray()
    const databaseData = {} as Record<string, any>

    for (const dbCollection of dbCollections)
      databaseData[dbCollection.name] = await connection.db
        .collection(dbCollection.name)
        .find({ tenantId })
        .toArray()

    await connection.close()

    return databaseData
  } catch (e) {
    console.error(e)

    const message = parseErrorMessage(e as IGenericError)
    throw new RpcException(message)
  }
}

export const generateDataIds = async (models: {
  model: Model<any>;
  label: string
}[],
data: Record<string, any[]>) => {
  try {
    const newIds = {} as Record<string, Record<string, string>>
    for (const model of models) {
      newIds[model.label] = {}

      const newCollectionData = data?.[model.label]
      if (newCollectionData == null || newCollectionData.length === 0) continue

      for (const newData of newCollectionData) {
        const Model = model.model
        const item = new Model({})

        newIds[model.label][newData._id] = item._id.toString()
      }
    }

    return newIds
  } catch (e) {
    console.error(e)

    const message = parseErrorMessage(e as IGenericError)
    throw new RpcException(message)
  }
}

export const resetTenantsData = async (
  models: { model: Model<any>; label: string }[],
  data?: Record<string, any[]>,
) => {
  try {
    const store = global.als.getStore()
    const tenantId = store?.tenantId

    if (!tenantId) throw new Error('TenantId not found')

    for (const model of models) {
      if (data == null) continue
      await model.model.deleteMany({ tenantId })

      const newCollectionData = data[model.label]
      if (newCollectionData == null || newCollectionData.length === 0) continue

      await model.model.insertMany(newCollectionData.map(d => ({ ...d, tenantId })))
    }

    return true
  } catch (e) {
    console.error(e)

    const message = parseErrorMessage(e as IGenericError)
    throw new RpcException(message)
  }
}

export const substituteIds = (
  data: Record<string, any>,
  newIds: Record<string, Record<string, Record<string, string>>>,
) => {
  try {
    let stringifiedData = JSON.stringify(data)
    const idsList = Object.values(newIds).reduce(
      (acc, curr) =>
        acc.concat(
          Object.values(curr)
            .map(ids => Object.entries(ids))
            .reduce((acc, curr) => acc.concat(curr), []),
        ),
      [] as [string, string][],
    )

    for (const [oldId, newId] of idsList) {
      const regex = new RegExp(`"${oldId}"`, 'g')
      stringifiedData = stringifiedData.replace(regex, `"${newId}"`)
    }

    return JSON.parse(stringifiedData)
  } catch (e) {
    console.error(e)

    const message = parseErrorMessage(e as IGenericError)
    throw new RpcException(message)
  }
}

export const checkDataJson = (data: any) => {
  try {
    if (typeof data !== 'object' || data == null || Array.isArray(data))
      throw new Error('resetTenant_fileNotValid_error')

    const keys = Object.keys(data)
    if (keys.length === 0) throw new Error('resetTenant_fileNotValid_error')

    const tenantDataKeys = Object.values(ETenantDatabases)

    for (const key of keys)
      if (!tenantDataKeys.includes(key as ETenantDatabases)) throw new Error('resetTenant_fileNotValid_error')

    return true
  } catch (e) {
    console.error(e)

    const message = parseErrorMessage(e as IGenericError)
    throw new RpcException(message)
  }
}
