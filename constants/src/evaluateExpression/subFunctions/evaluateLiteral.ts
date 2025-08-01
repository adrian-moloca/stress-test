import { isValid, parse, parseISO } from 'date-fns'
import { v4 } from 'uuid'
import { emailRegEx, isoDateRegEx } from '../../constants'
import {
  tAddressLiteral,
  tBooleanLiteral,
  tDateLiteral,
  tDateWithoutTimestampLiteral,
  tDependentValue,
  tEmailLiteral,
  tEnumLiteral,
  tEvaluateLiteral,
  tEvaluateUtilities,
  tExpression,
  tLiteralList,
  tLiteralListOfExpressions,
  tLiteralOperators,
  tLocalizedTextLiteral,
  tNumberLiteral,
  tObjectLiteral,
  tObjectOfExpressions,
  tPositiveNumberLiteral,
  tPriceLiteral,
  tStringLiteral,
  tTextWithPatternLiteral,
  tTimestampLiteral,
  tTranslatableString,
  tTwoDecimalsNumberLiteral,
  tUserLiteral,
} from '../../types'
import { getZonedStartDay } from '../../utils'
import { convertDepsToEmits, getNewDeps, getNewEmissions, getNewEmits, joinEmits } from './dependenciesFunctions'
import { isExpression, stackStrings } from './optionals'

const addZero = (value: number) => value.toString().padStart(2, '0')

export const validateEnum = (typedEnum: tEnumLiteral['value']) => {
  if (!Array.isArray(typedEnum)) throw new Error('invalidArray')
  if (
    typedEnum.some(
      v => typeof v !== 'object' || typeof v.key !== 'string' || typeof v.description !== 'string'
    )
  )
    throw new Error('invalidArrayObject')

  const keys = typedEnum.map(({ key }) => key)
  const descriptions = typedEnum.map(({ description }) => description)

  const setKeys = new Set(keys)
  const setDescriptions = new Set(descriptions)

  if (setKeys.size !== keys.length || setDescriptions.size !== descriptions.length)
    throw new Error('invalidEnumValues')
}

export const validateTimestamp = (typedTimestamp: tTimestampLiteral['value']) => {
  if (
    typeof typedTimestamp !== 'object' ||
    typeof typedTimestamp.hours !== 'number' ||
    typeof typedTimestamp.minutes !== 'number' ||
    typeof typedTimestamp.seconds !== 'number' ||
    typeof typedTimestamp.timezone !== 'string'
  )
    throw new Error('invalidTimestamp')

  const isoString = `${typedTimestamp.hours}:${typedTimestamp.minutes}:${typedTimestamp.seconds}:${typedTimestamp.timezone}`
  const parsedDate = parse(isoString, 'H:m:s:X', new Date())

  if (!isValid(parsedDate)) throw new Error('invalidTimestamp')
}

export const validateTwoDecimalsNumber = (
  typedTwoDecimalsNumber: tTwoDecimalsNumberLiteral['value']
) => {
  if (
    typeof typedTwoDecimalsNumber !== 'number' ||
    typedTwoDecimalsNumber < 0 ||
    (typedTwoDecimalsNumber * 100) % 1 !== 0
  )
    throw new Error('invalidTwoDecimalsNumber')
}

export const validateLocalizedText = (typedLocalizedText: tLocalizedTextLiteral['value']) => {
  if (typeof typedLocalizedText !== 'object') throw new Error('invalidObject')
  if (Array.isArray(typedLocalizedText)) throw new Error('invalidObject')
}

export const validateTextWithPattern = (typedTextWithPattern: tTextWithPatternLiteral['value']) => {
  if (
    typeof typedTextWithPattern.text !== 'string' ||
    typeof typedTextWithPattern.pattern !== 'string'
  )
    throw new Error('invalidString')

  let regex: RegExp
  try {
    regex = new RegExp(typedTextWithPattern.pattern)
  } catch (_error) {
    throw new Error('invalidPattern')
  }

  if (regex.test(typedTextWithPattern.text) === false) throw new Error('textNotMatchingPattern')
}

export const validateEmail = (typedEmail: tEmailLiteral['value']) => {
  if (typeof typedEmail !== 'string' || emailRegEx.test(typedEmail) === false)
    throw new Error('invalidEmail')
}

export const validatePositiveNumber = (typedPositiveNumber: tPositiveNumberLiteral['value']) => {
  if (typeof typedPositiveNumber !== 'number' || typedPositiveNumber < 0)
    throw new Error('invalidPositiveNumber')
}

export const validatePositivePrice = (typedPositivePrice: tPositiveNumberLiteral['value']) => {
  if (typeof typedPositivePrice !== 'number' || typedPositivePrice < 0)
    throw new Error('invalidPositivePrice')
}

export const validateUser = (typedUser: tUserLiteral['value']) => {
  if (
    typeof typedUser !== 'object' ||
    typeof typedUser.title !== 'string' ||
    typeof typedUser.firstName !== 'string' ||
    typeof typedUser.lastName !== 'string' ||
    typeof typedUser.email !== 'string' ||
    emailRegEx.test(typedUser.email) === false ||
    typeof typedUser.phoneNumber !== 'string' ||
    typeof typedUser.birthDate !== 'object' ||
    typeof typedUser.address !== 'object' ||
    typeof typedUser.debtorNumber !== 'string'
  )
    throw new Error('invalidUser')
}

export const valuateLiteralDateWithoutTimestamp = (value: unknown) => {
  const typedDate = value as tDateWithoutTimestampLiteral['value']
  if (
    typeof typedDate !== 'object' ||
    typeof typedDate.day !== 'number' ||
    typeof typedDate.month !== 'number' ||
    typeof typedDate.year !== 'number'
  )
    throw new Error('invalidDate')

  const isoString = `${typedDate.year}-${addZero(typedDate.month)}-${addZero(
    typedDate.day
  )}T00:00:00Z`
  const parsedDate = getZonedStartDay(isoString, process.env.VITE_TIME_ZONE!)

  if (!isValid(parsedDate)) throw new Error('invalidDate')

  return parsedDate
}

export const valuateAddress = (value: unknown) => {
  const typedAddress = value as tAddressLiteral['value']
  if (
    typeof typedAddress !== 'object' ||
    typeof typedAddress.street !== 'string' ||
    typeof typedAddress.city !== 'string' ||
    typeof typedAddress.country !== 'string' ||
    typeof typedAddress.houseNumber !== 'string' ||
    typeof typedAddress.postalCode !== 'string'
  )
    throw new Error('invalidAddress')
  return typedAddress
}

export const evaluateLiteral = (
  utilities: tEvaluateUtilities
): Record<tLiteralOperators, tEvaluateLiteral> => ({
  literalString: async expression => {
    const typedString = (expression as tStringLiteral).value
    if (typeof typedString !== 'string') throw new Error('invalidString')
    return { value: typedString, ...getNewEmissions() }
  },
  literalNumber: async expression => {
    const typedNumber = (expression as tNumberLiteral).value
    if (typeof typedNumber !== 'number') throw new Error('invalidNumber')
    return { value: typedNumber, ...getNewEmissions() }
  },
  literalBoolean: async expression => {
    const typedBoolean = (expression as tBooleanLiteral).value
    if (typeof typedBoolean !== 'boolean') throw new Error('invalidBoolean')
    return { value: typedBoolean, ...getNewEmissions() }
  },
  literalDate: async expression => {
    const value = (expression as tDateLiteral).value

    const parsedDate = parseISO(value)
    if (isoDateRegEx.test(value) === false) throw new Error('invalidIsoString')

    if (!isValid(parsedDate)) throw new Error('invalidDate')
    return { value: parsedDate, ...getNewEmissions() }
  },
  literalEnum: async expression => {
    const typedEnum = (expression as tEnumLiteral).value

    validateEnum(typedEnum)
    const typedValue = Object.fromEntries(
      (typedEnum as unknown as Array<{ key: string; description: string }>).map(
        ({ key, description }) => [key, description]
      )
    )

    return { value: typedValue, ...getNewEmissions() }
  },
  literalList: async expression => {
    const typedList = (expression as tLiteralList).value

    if (!Array.isArray(typedList)) throw new Error('invalidArray')

    const parsedValue = typedList.map(item => ({
      value: item,
      ...getNewEmissions(),
    }))

    return {
      value: parsedValue,
      ...getNewEmissions(),
    }
  },
  literalListOfExpressions: async expression => {
    const typedList = (expression as tLiteralListOfExpressions).value

    if (!Array.isArray(typedList)) throw new Error('invalidArray')

    const results = []
    for (let i = 0; i < typedList.length; i++) {
      utilities.appendStack(stackStrings.listIndex(i))
      const element = typedList[i]
      const result = await utilities.innerEvaluate(element, utilities)
      results.push(result)
      utilities.popStack()
    }
    return { value: results, ...getNewEmissions() }
  },
  objectOfExpressions: async expression => {
    const typedObject = (expression as tObjectOfExpressions).value

    if (typeof typedObject !== 'object') throw new Error('invalidObject')
    if (Array.isArray(typedObject)) throw new Error('invalidObject')

    const results: Record<string, tDependentValue> = {}
    const entries = Object.entries(typedObject)

    for (const [key, value] of entries) {
      utilities.appendStack(stackStrings.objectKey(key))
      const result = await utilities.innerEvaluate(value as tExpression, utilities)
      results[key] = result
      utilities.popStack()
    }

    return { value: results, ...getNewEmissions() }
  },
  literalObj: async expression => {
    const typedObject = (expression as tObjectLiteral).value
    if (typeof typedObject !== 'object') throw new Error('invalidObject')
    if (Array.isArray(typedObject)) throw new Error('invalidObject')

    const parsedValue = Object.fromEntries(
      Object.entries(typedObject).map(([key, value]) => [key, { value, ...getNewEmissions() }])
    )

    return { value: parsedValue, ...getNewEmissions() }
  },
  literalAddress: async expression => {
    const value = (expression as tAddressLiteral).value
    return { value: valuateAddress(value), ...getNewEmissions() }
  },
  literalDateWithoutTimestamp: async expression => {
    const value = (expression as tDateWithoutTimestampLiteral).value
    return {
      value: valuateLiteralDateWithoutTimestamp(value),
      ...getNewEmissions(),
    }
  },
  literalPrice: async expression => {
    const typedPrice = (expression as tPriceLiteral).value
    if (typeof typedPrice !== 'number') throw new Error('invalidPrice')
    return { value: typedPrice, ...getNewEmissions() }
  },
  literalPositivePrice: async expression => {
    const typedPositivePrice = (expression as tPositiveNumberLiteral).value
    validatePositivePrice(typedPositivePrice)
    return { value: typedPositivePrice, ...getNewEmissions() }
  },
  literalTimestamp: async expression => {
    const typedTimestamp = (expression as tTimestampLiteral).value
    validateTimestamp(typedTimestamp)

    return { value: typedTimestamp, ...getNewEmissions() }
  },
  literalPositiveNumber: async expression => {
    const typedPositiveNumber = (expression as tPositiveNumberLiteral).value
    validatePositiveNumber(typedPositiveNumber)
    return { value: typedPositiveNumber, ...getNewEmissions() }
  },
  literalTwoDecimalsNumber: async expression => {
    const typedTwoDecimalsNumber = (expression as tTwoDecimalsNumberLiteral).value
    validateTwoDecimalsNumber(typedTwoDecimalsNumber)

    return { value: typedTwoDecimalsNumber, ...getNewEmissions() }
  },
  literalLocalizedText: async expression => {
    let typedLocalizedText = (expression as tLocalizedTextLiteral).value
    const deps = getNewDeps()
    let emits = getNewEmits()

    if (isExpression(typedLocalizedText)) {
      const result = await utilities.innerEvaluate(typedLocalizedText, utilities)
      typedLocalizedText = result.value
      const convertedDeps = convertDepsToEmits(result.deps)
      emits = joinEmits(emits, convertedDeps, result.emits)
    }

    validateLocalizedText(typedLocalizedText)
    const translation = utilities.getTranslation(typedLocalizedText as tTranslatableString)

    return {
      value: translation,
      deps,
      emits,
    }
  },
  literalTextWithPattern: async expression => {
    const typedTextWithPattern = (expression as tTextWithPatternLiteral).value
    validateTextWithPattern(typedTextWithPattern)

    return { value: typedTextWithPattern.text, ...getNewEmissions() }
  },
  literalEmail: async expression => {
    const typedEmail = (expression as tEmailLiteral).value
    validateEmail(typedEmail)
    return { value: typedEmail, ...getNewEmissions() }
  },
  literalUser: async expression => {
    const typedUser = (expression as tUserLiteral).value
    validateUser(typedUser)

    return {
      value: {
        ...typedUser,
        birthDate: valuateLiteralDateWithoutTimestamp(typedUser.birthDate),
        address: valuateAddress(typedUser.address),
      },
      ...getNewEmissions(),
    }
  },
  literalUniqueId: async () => ({
    value: v4(),
    ...getNewEmissions()
  }),
  literalNone: async () => ({
    value: null,
    ...getNewEmissions()
  }),
})
