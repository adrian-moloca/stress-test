import { tField, tFieldRepresentation, tSupportedLocales } from '@smambu/lib.constants'
import { tEvaluatedField, tEvaluatedFieldRepresentation } from 'universal-reporting/types/tEvaluatedTypes'

export type tDynamicRendererProps = {
  fields: tField[]
  representations: tFieldRepresentation[]
  data: tData
  setData: (data: tData) => void
  editable: boolean
  locale: tSupportedLocales
  debug: boolean
}

export type tData = Record<string, unknown>

const _a: tData = {
  pippo: {
    actualValue: 'gigi',
    metaData: {
      automaticValue: 'lapo',
      origin: 'USER'
    }
  }
}

export type tFrontendPayload = {
  data: tData
  fields: tEvaluatedField[]
  representation: tEvaluatedFieldRepresentation[]
}

export type tParsedValues = {
  data: tData
  fields: tEvaluatedField[]
  representation: tEvaluatedFieldRepresentation[]
}

export type tUpdatePayload = {path: string, value: unknown}
