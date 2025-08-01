import React from 'react'
import { Override, tRenderer } from '../types'
import { RenderDateType } from './RenderDateType'
import { EvaluateObject, tEvaluatedFieldRepresentation } from 'universal-reporting/types/tEvaluatedTypes'

export const RenderDateWithoutTimestampType: tRenderer<'dateWithoutTimestamp'> = inputProps => {
  // TODO: the type is mandatory otherwise fieldRepresentation prop cannot infer the type correctly..
  // but if you pass the value directly to the prop it works..
  const memoizedFieldRepresentation: Override<tEvaluatedFieldRepresentation, {
    viewAs: EvaluateObject<{
      representationKind: 'date';
      format: string;
      timezone?: string;
    }>;
  }> = React.useMemo(() => ({
    ...inputProps.fieldRepresentation,
    viewAs: {
      ...inputProps.fieldRepresentation.viewAs,
      representationKind: 'date'
    }
  }), [inputProps.fieldRepresentation])

  return <RenderDateType
    value={inputProps.value}
    fieldRepresentation={memoizedFieldRepresentation}
    fields={[]}
    wholePayload={inputProps.wholePayload}
    locale={inputProps.locale}
    editable={inputProps.editable}
    update={inputProps.update}
    path={inputProps.path}
  />
}
