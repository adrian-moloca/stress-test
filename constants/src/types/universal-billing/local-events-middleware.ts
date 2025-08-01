import { Component } from '../../enums'
import { Connection, ObjectId } from 'mongoose'
import { tLocalEventValue, tSourceSchemaValues, tValidEventName } from './local-events'

export type tContextTest = {
  db?: Connection
  model?: () => tContextTest
}

export type tUpdateDoc = {
  [x: string]: Record<string, unknown>
  $set: Record<string, unknown>
  $inc: Record<string, number>
  $unset: Record<string, unknown>
  $push: {
    [key: string]: {
      [key: string]: unknown
      $each: Record<string, unknown[]>
    }
  }
  $pull: Record<string, unknown>
  $pullAll: Record<string, unknown[]>
  $pop: Record<string, unknown>
  $addToSet: {
    [key: string]: {
      [key: string]: unknown
      $each: Record<string, unknown>[]
    }
  }
  $rename: Record<string, unknown>
  $mul: Record<string, number>
  $min: Record<string, number>
  $max: Record<string, number>
  $currentDate: Record<string, unknown>
  $setOnInsert: Record<string, unknown>
}

export type tDocBeforeUpdate = Record<string, number | unknown>
export type tRenderFun = (arg:unknown, context: tContextTest) => Promise<Record<string, unknown>>
export type tLocalEventsMetadata = Record<string, unknown> | null
export type tMetadataFun = (original:unknown, updated:unknown) => tLocalEventsMetadata

export type tTransformFunction = (
  source: tLocalEventValue,
  metadata: tLocalEventsMetadata) => tLocalEventValue

export type tGetDataReturnType = {
  bypassTenant: true
  tenantId?: string
} | {
  bypassTenant: false
  tenantId: string
}

export type tLocalEventsPluginOptions = {
  source: tSourceSchemaValues,
  rendererFun?: tRenderFun,
  metadataFun?: tMetadataFun
}

export type tLocalEventPayload = {
  source: string
  sourceDocId: ObjectId,
  ready?: boolean
  downloaded?: boolean
  previousValues: tLocalEventValue
  currentValues: tLocalEventValue
  tenantId: string
  metadata: tLocalEventsMetadata
}

export type tImportedEventsPayload = {
  source: tValidEventName
  sourceDocId: string
  previousValues: tLocalEventValue
  currentValues: tLocalEventValue
  tenantId: string
  processed?: boolean
  metadata: tLocalEventsMetadata
}

export abstract class EventPublisher {
  abstract publishEvent (
    source: tValidEventName,
    sourceDocId: string,
    previousValues: tLocalEventValue,
    currentValues: tLocalEventValue,
    tenantId: string,
    metadata: tLocalEventsMetadata,
    component: Component
  ): Promise<boolean>
}

export type tLocalQueueEvent = tLocalEventPayload & { id: string}

export type tParsedDep = {
  base: string
  specificDocument?: string
  omniPrefix?: string
  skipSpecifics?: boolean
}

export type tParsedDepPaths = {
  omniFullPathsPrev: string[]
  omniFullPathsCurrent: string[]
  specificFullPathsPrev: string[]
  specificFullPathsCurrent: string[]
}

export type tLocalEventConversionFun = (event: tImportedEventsPayload) => tParsedDep[]
