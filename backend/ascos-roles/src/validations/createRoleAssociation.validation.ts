import * as Joi from 'joi'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'
import { CreateRoleAssociationDto } from '@smambu/lib.constantsjs'

export const CreateRoleAssociationSchema: JoiGenericInterface<CreateRoleAssociationDto> =
  joiGeneric<CreateRoleAssociationDto>().keys({
    role: Joi.string().required(),
    users: Joi.array<string>().items(Joi.string()),
  })
