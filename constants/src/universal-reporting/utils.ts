import { tSupportedLocales, tTranslatableString } from '../types'

// TODO: remove when mock are no longer necessary
export function MockTranslatableToString (
  targetString: tTranslatableString,
  desiredLocale: tSupportedLocales
) {
  const target = targetString[desiredLocale]

  return target
}

export function isContextValid (context: unknown) {
  // XXX: This a check to identify that a given context is an object
  // of the king key: value
  // This is a popular method, not sure if is the best one.

  if (Object.prototype.toString.call(context) === '[object Object]')
    return true

  return false
}
