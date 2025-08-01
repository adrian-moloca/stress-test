export type tAddress = {
  kind: 'address'
}

export type tDateWithoutTimestamp = {
  kind: 'dateWithoutTimestamp'
}

export type tPrice = {
  kind: 'price'
}

export type tPositivePrice = {
  kind: 'positivePrice'
}

export type tTimestamp = {
  kind: 'timeStamp'
}

export type tPositiveNumber = {
  kind: 'positiveNumber'
}

export type tTwoDecimalNumber = {
  // TODO:  note for the future:
  // we could add template literal to make this more "imperative"
  kind: 'twoDecimalNumber'
}

export type tLocalizedText = {
  kind: 'localizedText'
}

export type tTextWithPattern = {
  kind: 'textWithPattern'
  pattern: RegExp
}

export type tEmail = {
  kind: 'email'
}

export type tUser = {
  kind: 'user'
}

// used for the identifiers
export type tUniqueId = {
  kind: 'uniqueId'
}
