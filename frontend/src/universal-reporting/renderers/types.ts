import React from 'react'
import { tSupportedLocales, tColumnRepresentation } from '@smambu/lib.constants'
import { GridCellParams } from '@mui/x-data-grid'
import { tEvaluatedField, tEvaluatedFieldRepresentation, tEvaluatedViewAs } from 'universal-reporting/types/tEvaluatedTypes'

type tCommonRendererProps = {
  wholePayload: Record<string, any>,
  locale: tSupportedLocales,
  editable: boolean,
  update: (data: { path: string, value: any }) => void,
  path: string
}

// TODO: check if is it possible to remove the export. it is needed in fields like
// RenderDateWithoutTimestampType because otherwise typescript is not be able to infer the type if you assign it
// to a variable and pass it but it works if you pass directly the value.
export type Override<T, U> = Omit<T, keyof U> & U;

export type tRendererProps<K extends tEvaluatedFieldRepresentation['viewAs']['representationKind']> = tCommonRendererProps & {
  fields: tEvaluatedField[],
  value: any,
  fieldRepresentation: Override<
    tEvaluatedFieldRepresentation,
    { viewAs: EvaluatedViewAs<K> }
  >;
}

export type tRenderer<K extends tEvaluatedFieldRepresentation['viewAs']['representationKind']> = React.FC<tRendererProps<K>>

type EvaluatedViewAs<K> = Extract<tEvaluatedViewAs, { representationKind: K }>

 type ColumnRendererProps<K extends tColumnRepresentation['viewAs']['representationKind']> = tCommonRendererProps & {
   field: any;
   fieldRepresentation: tColumnRepresentation & {
     viewAs: EvaluatedViewAs<K>
   };
   params: GridCellParams;
   fieldDef: tEvaluatedField;
 }

export type ColumnRenderer<K extends tColumnRepresentation['viewAs']['representationKind']> = React.FC<ColumnRendererProps<K>>;
