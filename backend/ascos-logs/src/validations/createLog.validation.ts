import { CreateLogDto } from '@smambu/lib.constantsjs'
import * as Joi from 'joi'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'

export const CreateLogSchema: JoiGenericInterface<CreateLogDto> =
  joiGeneric<CreateLogDto>().keys({
    component: Joi.string(),
    level: Joi.string(),
    message: Joi.string(),
  })
