import { CurrencySymbols, TranslatorLanguages } from '@smambu/lib.constantsjs'
import * as Joi from 'joi'

const schema = Joi.object().keys({
  name: Joi.string().required(),
  defaultLanguage: Joi.string().valid(...Object.keys(TranslatorLanguages))
    .required(),
  currencySymbol: Joi.string().valid(...Object.keys(CurrencySymbols))
    .required(),
})

export default schema
