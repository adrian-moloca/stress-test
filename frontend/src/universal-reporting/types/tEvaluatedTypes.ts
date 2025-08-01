import { RepresentationMap, tColumnRepresentation, tExpression, tField, tFieldRepresentation, tTypedExpression, tViewAs } from '@smambu/lib.constants'

type TypeKindToJS = {
  boolean: boolean;
  number: number;
  string: string;
  date: Date;
  object: Record<string, any>;
  list: any[];
  enum: string;
}

type ResolveType<T> = T extends { kind: keyof TypeKindToJS }
  ? TypeKindToJS[T['kind']]
  : any;

  type EvaluateField<T> =
  T extends tTypedExpression<infer U> ? ResolveType<U> :
    T extends tExpression ? any :
      T extends tViewAs ? tEvaluatedViewAs :
        T extends Array<infer U> ? EvaluateField<U>[] :
          T extends object ? { [K in keyof T]: EvaluateField<T[K]> } :
            T;

export type tEvaluatedFieldRepresentation = {
  [K in keyof tFieldRepresentation]: EvaluateField<tFieldRepresentation[K]>;
};

export type tEvaluatedField = {
  [K in keyof tField]: EvaluateField<tField[K]>;
};

export type tEvaluatedContainerRepresentation = {
  [K in `_${string}`]: tEvaluatedViewItem[];
}

export type tEvaluatedViewItem = tEvaluatedFieldRepresentation | tEvaluatedContainerRepresentation;

export type tEvaluatedColumnRepresentation = {
  [K in keyof tColumnRepresentation]: EvaluateField<tColumnRepresentation[K]>;
};

// TODO: check if is it possible to remove the export. it is needed in fields like
// RenderDateWithoutTimestampType because otherwise typescript is not be able to infer the type if you assign it
// to a variable and pass it but it works if you pass directly the value.
export type EvaluateObject<T> = {
  [K in keyof T]: EvaluateField<T[K]>;
};

type EvaluatedRepresentationMap = {
  [K in keyof RepresentationMap]: EvaluateObject<RepresentationMap[K]>;
};

export type tEvaluatedViewAs = EvaluatedRepresentationMap[keyof EvaluatedRepresentationMap];
