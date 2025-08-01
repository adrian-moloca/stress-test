import { Type } from '@nestjs/common'
import { SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema } from 'mongoose'

type tSchemaWithMiddlewaresProps = { tenantId: string }

export const generateSchemaWithMiddlewares = <T extends tSchemaWithMiddlewaresProps>(
  data: Type<T>
): Schema<HydratedDocument<T>> => {
  const newSchema = SchemaFactory.createForClass<T>(data) as unknown as Schema<HydratedDocument<T>>

  const getData = () => {
    const store = global.als.getStore()

    if (!store) throw new Error('Store not found')

    const tenantId = store.tenantId
    const bypassTenant = store.bypassTenant

    if (!bypassTenant && !tenantId) throw new Error('TenantId not found')

    return { tenantId, bypassTenant }
  }

  newSchema.pre(/^find/, function (next) {
    const { tenantId, bypassTenant } = getData()

    // XXX Careful! This "this as any" is due to mongoose > 7 and is terrible,
    // but the current type mess makes it the best solution without needing to
    // invest hours in.
    // We should fix this when we fix the same thing in the "async store"
    if (!bypassTenant) (this as any).where({ tenantId })

    next()
  })

  newSchema.pre('findOne', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.where({ tenantId })

    next()
  })

  newSchema.pre('findOneAndUpdate', function (next) {
    const { tenantId, bypassTenant } = getData()

    // XXX Careful! This "this as any" is due to mongoose > 7 and is terrible,
    // but the current type mess makes it the best solution without needing to
    // invest hours in.
    // We should fix this when we fix the same thing in the "async store"
    if (!bypassTenant) (this as any).where({ tenantId })

    next()
  })

  newSchema.pre('countDocuments', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.where({ tenantId })

    next()
  })

  newSchema.pre('aggregate', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.pipeline().unshift({ $match: { tenantId } })

    next()
  })

  newSchema.pre('save', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.tenantId = tenantId

    next()
  })

  newSchema.pre('insertMany', function (next, docs) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant)
      try {
        // @ts-expect-error types are a mess now
        docs.forEach(doc => {
          doc.tenantId = tenantId
        })
      } catch (error) {
        console.error(error)
      }

    next()
  })

  newSchema.pre('updateOne', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.where({ tenantId })

    next()
  })

  newSchema.pre('deleteOne', function (next) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant) this.where({ tenantId })

    next()
  })

  newSchema.pre('deleteMany', function (next, docs) {
    const { tenantId, bypassTenant } = getData()

    if (!bypassTenant)
      try {
        // @ts-expect-error types are a mess now
        docs.forEach(doc => {
          doc.tenantId = tenantId
        })
      } catch (error) {
        console.error(error)
      }

    next()
  })

  return newSchema
}
