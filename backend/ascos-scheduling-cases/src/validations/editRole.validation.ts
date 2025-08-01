import * as Joi from 'joi'
import { CreateRoleSchema } from './createRole.validation'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'
import { UpdateRoleDto } from '@smambu/lib.constantsjs'

export const EditRoleSchema: JoiGenericInterface<UpdateRoleDto> =
  joiGeneric<UpdateRoleDto>().keys({
    id: Joi.string().required(),
    data: CreateRoleSchema,
  })
