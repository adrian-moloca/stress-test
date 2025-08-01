import * as Joi from 'joi'
import { SaveAuditTrailDto } from '@smambu/lib.constantsjs'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'

export const SaveAuditTrailSchema: JoiGenericInterface<SaveAuditTrailDto> =
  joiGeneric<SaveAuditTrailDto>().keys({
    userId: Joi.string(),
    entityType: Joi.string(),
    entityNameOrId: Joi.string(),
    action: Joi.string(),
    prevObj: Joi.object(),
    newObj: Joi.object(),
  })
