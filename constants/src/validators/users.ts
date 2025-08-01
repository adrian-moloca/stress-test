import * as Joi from 'joi'

// If used in React, the emails should be .email({ tlds: { allow: false } })
// https://github.com/hapijs/joi/issues/2390

export const getCreateUserSchema = () =>
  Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email()
      .required(),
    birthDate: Joi.string().allow(''),
    title: Joi.string().allow(''),
    phoneNumber: Joi.string().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      houseNumber: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      city: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
    roleAssociations: Joi.array(),
  }).options({
    abortEarly: false,
  })

export const getEditUserSchema = () =>
  Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email()
      .required(),
    birthDate: Joi.string().allow(''),
    title: Joi.string().allow(''),
    phoneNumber: Joi.string().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      houseNumber: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      city: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
    roleAssociations: Joi.array(),
    status: Joi.string().allow(''),
  }).options({
    abortEarly: false,
  })

export const GetUsersQuerySchema = Joi.object({
  search: Joi.string().optional(),
})
