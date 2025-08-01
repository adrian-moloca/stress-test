import * as Joi from 'joi'
import { Capabilities, CreateRoleDto, ICapabilityName, I_PERMISSIONS_DOMAINS_SCOPES, I_PERMISSION_DOMAINS, PERMISSIONS_DOMAINS_SCOPES } from '@smambu/lib.constantsjs'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'

export const CreateRoleSchema: JoiGenericInterface<CreateRoleDto> =
  joiGeneric<CreateRoleDto>().keys({
    name: Joi.string().required(),
    capabilities: Joi.array<ICapabilityName>().items(
      Joi.string<ICapabilityName>().valid(...Object.values(Capabilities)),
    ),
    domain_scopes: joiGeneric<{
      [_key in I_PERMISSION_DOMAINS]: I_PERMISSIONS_DOMAINS_SCOPES;
    }>().required(),
    scope: Joi.string<I_PERMISSIONS_DOMAINS_SCOPES>()
      .required()
      .valid(...Object.keys(PERMISSIONS_DOMAINS_SCOPES)),
  })
