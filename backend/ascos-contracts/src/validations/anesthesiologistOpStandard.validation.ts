import { CreateAnesthesiologistOpStandardDto } from '@smambu/lib.constantsjs'
import { JoiGenericInterface, joiGeneric } from './JoiGenericInterface'

// eslint-disable-next-line max-len
export const AnesthesiologistOpStandardSchema: JoiGenericInterface<CreateAnesthesiologistOpStandardDto> =
  joiGeneric<CreateAnesthesiologistOpStandardDto>()
