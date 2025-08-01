import * as Joi from 'joi'

export interface JoiGenericInterface<X> extends Joi.ObjectSchema {
  keys(params: {
    [K in keyof X]: JoiTypeOf<X[K]>;
  }): this;
}

export function joiGeneric<X> (): JoiGenericInterface<X> {
  return Joi.object<X, true>() as JoiGenericInterface<X>
}

type JoiTypeOf<X> = X extends string
  ? Joi.StringSchema
  : X extends number
    ? Joi.NumberSchema
    : X extends Date
      ? Joi.DateSchema
      : X extends Array<infer U>
        ? Joi.ArraySchema<U>
        : X extends object
          ? JoiGenericInterface<X>
          : never;
