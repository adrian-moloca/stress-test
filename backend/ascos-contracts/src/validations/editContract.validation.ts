import * as Joi from 'joi'
import { EditContractDto } from '@smambu/lib.constantsjs'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'

export const EditContractSchema: JoiGenericInterface<EditContractDto> =
  joiGeneric<EditContractDto>().keys({
    contractId: Joi.string(),
    details: Joi.object({
      contractName: Joi.string().required(),
      doctorId: Joi.string().required(),
      validFrom: Joi.date().required(),
      validUntil: Joi.date().required(),
      kassenzulassung: Joi.bool(),
      overnightStayFee1Bed: Joi.number().allow('')
        .allow(null),
      overnightStayFee2Bed: Joi.number().allow('')
        .allow(null),
      overnightStayFee3Bed: Joi.number().allow('')
        .allow(null),
      surgerySlots: Joi.array().items(
        Joi.object({
          from: Joi.number().required(),
          to: Joi.number().required(),
        }),
      ),
      status: Joi.string(),
    }),
    opStandards: Joi.object().allow(null),
  })
