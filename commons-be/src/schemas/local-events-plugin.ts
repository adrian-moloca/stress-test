// List of error codes:
// model-error: this is not a "real" problem: the object are compatible,
// we only need to dive more into the nestjs typing to find out why this is
// not ok
//
// this-error: this error is caused by a difficulty correctly defining "this"
// in the various pre and post callbacks, in order to properly access the required
// methods and fields. This is very similar to the previous error though, so it
// will need to be solved (very likely) in the same way

import { Schema, Model, Document, CallbackWithoutResultAndOptionalError, ObjectId } from 'mongoose'
import { LocalEvents } from './local-events.schema'
import { tGetDataReturnType, tLocalEventPayload, tLocalEventsPluginOptions } from '@smambu/lib.constantsjs'
import {
  applyUpdateToDocument,
  getChangesPayload,
  getConnection,
  registerEvent,
} from '../utilities/local-events'

export function localEventsPlugin (schema: Schema, options: tLocalEventsPluginOptions) {
  const { source, rendererFun, metadataFun } = options
  const LocalEventsModelName = LocalEvents.name

  const getData = (): tGetDataReturnType => {
    const store = global.als.getStore()

    if (!store) throw new Error('Store not found')

    const tenantId = store.tenantId
    const unsafeBypassTenant = store.bypassTenant
    const bypassTenant = unsafeBypassTenant === undefined ? false : unsafeBypassTenant

    if (!bypassTenant && !tenantId) throw new Error('TenantId not found')

    return {
      tenantId: tenantId!,
      bypassTenant,
    }
  }

  async function handleSuccessSingle (_res: unknown, next: CallbackWithoutResultAndOptionalError) {
    // @ts-expect-error model-error
    const conn = getConnection(this)
    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error model-error
      conn.model(LocalEventsModelName, LocalEvents)

    const LocalEventsModel = conn.model(LocalEventsModelName)

    // @ts-expect-error this-error
    await LocalEventsModel.updateOne({ _id: this.localEventDocId }, { ready: true })

    next()
  }

  async function handleErrorSingle (
    err: Error,
    _res: unknown,
    next: CallbackWithoutResultAndOptionalError
  ) {
    console.error('Local events middleware got this error:', err.message)

    // @ts-expect-error this-error
    const conn = getConnection(this)
    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error model-error
      conn.model(LocalEventsModelName, LocalEvents)

    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error model-error
      conn.model(LocalEventsModelName, LocalEvents)

    const LocalEventsModel = conn.model(LocalEventsModelName)

    // @ts-expect-error this-error
    await LocalEventsModel.deleteOne({ _id: this.localEventDocId })

    next(err)
  }

  async function handleSuccessMultiple (
    _res: unknown,
    next: CallbackWithoutResultAndOptionalError
  ) {
    // @ts-expect-error this-error
    const conn = getConnection(this)
    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error model-error
      conn.model(LocalEventsModelName, LocalEvents)

    const LocalEventsModel = conn.model(LocalEventsModelName)

    // @ts-expect-error this-error
    for (const id of this.localEventsDocIds)
      await LocalEventsModel.updateOne({ _id: id }, { ready: true })

    next()
  }

  async function handleErrorMultiple (
    err: Error,
    _res: unknown,
    next: CallbackWithoutResultAndOptionalError
  ) {
    console.error('Post updateOne: errore catturato:', err.message)

    // @ts-expect-error this-error
    const conn = getConnection(this)
    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error model-error
      conn.model(LocalEventsModelName, LocalEvents)

    if (!conn.models[LocalEventsModelName])
      // @ts-expect-error this-error
      conn.model(LocalEventsModelName, LocalEvents)

    const LocalEventsModel = conn.model(LocalEventsModelName)

    // @ts-expect-error this-error
    for (const id of this.localEventsDocIds) await LocalEventsModel.deleteOne({ _id: id })

    next(err)
  }

  async function updateMethodsCB (next: CallbackWithoutResultAndOptionalError) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    // @ts-expect-error this-error
    const originalDoc = await this.model.findOne(this.getFilter()).lean()

    // @ts-expect-error this-error
    const updates = this.getUpdate()
    // @ts-expect-error this-error
    const options = this.getOptions()
    const updatedDoc = applyUpdateToDocument(updates, originalDoc, options)

    const updatePayload = await getChangesPayload(
      originalDoc,
      updatedDoc,
      source,
      tenantId,
      rendererFun,
      metadataFun,
      // @ts-expect-error this-error
      this
    )

    if (updatePayload != null) {
      // @ts-expect-error this-error
      const conn = getConnection(this)

      const result = await registerEvent(conn, updatePayload, LocalEventsModelName)

      // @ts-expect-error this-error
      this.localEventDocId = result._id
    }

    next()
  }

  schema.pre('save', async function (next) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    let payload: tLocalEventPayload = <tLocalEventPayload>{}

    if (!this.isNew) {
      const originalDoc = await (this.constructor as Model<Document>)
        .findOne({ _id: this._id })
        .lean()

      const thisObject = this.toObject()

      if (!originalDoc) throw new Error('Original document not found')

      // @ts-expect-error model-error
      payload = await getChangesPayload(
        originalDoc,
        thisObject,
        source,
        tenantId,
        rendererFun,
        metadataFun,
        this
      )
    } else {
      let parsedOriginalDoc = this.toObject()
      let metadata = null
      if (metadataFun != null) metadata = metadataFun(null, this)

      if (rendererFun != null)
        // @ts-expect-error ts is wrong
        parsedOriginalDoc = await rendererFun(this, this)

      payload = {
        source,
        sourceDocId: this._id as ObjectId,
        previousValues: null,
        currentValues: parsedOriginalDoc,
        tenantId,
        metadata,
      }
    }

    const hasChanges = payload != null && Object.keys(payload).length > 0

    if (hasChanges) {
      const result = await registerEvent(this.db, payload, LocalEventsModelName)

      // @ts-ignore I get an error here only in the compilation
      this.localEventDocId = result._id
    }

    next()
  })

  schema.pre('insertMany', async function (next, docs) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    for (const doc of docs) {
      let parsedOriginalDoc = doc
      let metadata = null

      if (rendererFun != null) parsedOriginalDoc = await rendererFun(doc, this)

      if (metadataFun != null) metadata = metadataFun(null, doc)

      const payload: tLocalEventPayload = {
        source,
        sourceDocId: doc._id as ObjectId,
        previousValues: null,
        currentValues: parsedOriginalDoc,
        tenantId,
        metadata,
      }

      const result = await registerEvent(this.db, payload, LocalEventsModelName)

      // @ts-expect-error this-error
      this.localEventDocId = result._id
    }

    next()
  })

  schema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    let parsedOriginalDoc = this.toObject()
    let metadata = null
    if (metadataFun != null) metadata = metadataFun(this, null)

    if (rendererFun != null)
      // @ts-expect-error ts is wrong
      parsedOriginalDoc = await rendererFun(this.toObject(), this)

    const payload: tLocalEventPayload = {
      source,
      sourceDocId: this._id as ObjectId,
      previousValues: parsedOriginalDoc,
      currentValues: null,
      tenantId: tenantId!,
      metadata,
    }

    const result = await registerEvent(this.db, payload, LocalEventsModelName)

    // @ts-ignore I get an error here only in the compilation
    this.localEventDocId = result._id

    next()
  })

  schema.pre('deleteOne', { document: false, query: true }, async function (next) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    const filter = this.getFilter()
    const docsToDelete = await this.model.find(filter)

    // @ts-expect-error this-error
    const conn = getConnection(this)

    // @ts-expect-error this-error
    this.localEventsDocIds = []
    for (const doc of docsToDelete) {
      let parsedOriginalDoc = doc.toObject()
      let metadata = null
      if (metadataFun != null) metadata = metadataFun(this, null)

      // @ts-expect-error this-error
      if (rendererFun != null) parsedOriginalDoc = await rendererFun(doc.toObject(), this)

      const payload: tLocalEventPayload = {
        source,
        sourceDocId: doc._id as ObjectId,
        previousValues: parsedOriginalDoc,
        currentValues: null,
        tenantId,
        metadata,
      }

      const result = await registerEvent(conn, payload, LocalEventsModelName)

      // @ts-expect-error this-error
      this.localEventsDocIds.push(result._id)
    }

    next()
  })

  schema.pre('deleteMany', { document: false, query: true }, async function (next) {
    const { tenantId, bypassTenant } = getData()

    // if bypassTenant is true, the query shouldn't generate a local event
    if (bypassTenant) return

    const filter = this.getFilter()
    const docsToDelete = await this.model.find(filter)

    // @ts-expect-error this-error
    const conn = getConnection(this)

    // @ts-expect-error this-error
    this.localEventsDocIds = []
    for (const doc of docsToDelete) {
      let parsedOriginalDoc = doc.toObject()
      let metadata = null
      if (metadataFun != null) metadata = metadataFun(this, null)

      // @ts-expect-error this-error
      if (rendererFun != null) parsedOriginalDoc = await rendererFun(doc.toObject(), this)

      const payload: tLocalEventPayload = {
        source,
        sourceDocId: doc._id as ObjectId,
        previousValues: parsedOriginalDoc,
        currentValues: null,
        tenantId,
        metadata,
      }

      const result = await registerEvent(conn, payload, LocalEventsModelName)

      // @ts-expect-error this-error
      this.localEventsDocIds.push(result._id)
    }

    next()
  })

  schema.pre('updateOne', updateMethodsCB)
  schema.pre('findOneAndUpdate', updateMethodsCB)

  // "Success" handlers for pre
  schema.post('save', handleSuccessSingle)
  schema.post('updateOne', handleSuccessSingle)
  schema.post('findOneAndUpdate', handleSuccessSingle)
  schema.post('insertMany', handleSuccessMultiple)
  schema.post('deleteOne', handleSuccessMultiple)
  schema.post('deleteMany', handleSuccessMultiple)

  // "Errors" handler for pre
  schema.post('save', handleErrorSingle)
  schema.post('updateOne', handleErrorSingle)
  schema.post('findOneAndUpdate', handleErrorSingle)
  schema.post('insertMany', handleErrorMultiple)
  schema.post('deleteOne', handleErrorSingle)
  schema.post('deleteMany', handleErrorMultiple)
}
