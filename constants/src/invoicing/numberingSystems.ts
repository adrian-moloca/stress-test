/** A structure to represent the last generated numbers for invoices */
type LastInvoicingNumbers = {
  lastGlobalNumber: number | null
  lastYearlyNumber: number | null
  lastTypedNumber: number | null
  lastTypedYearlyNumber: number | null
}
type LastPatientNumbers = Omit<LastInvoicingNumbers, 'lastTypedNumber' | 'lastTypedYearlyNumber'>
type LastCaseNumbers = Omit<LastInvoicingNumbers, 'lastTypedNumber' | 'lastTypedYearlyNumber'>
type LastDebtorNumbers = LastInvoicingNumbers

type LiteralToken = {
  kind: 'literal'
  value: string
}
type NumberToken = {
  kind: 'number' | 'type.number' | 'year.number' | 'type.year.number'

  /** The target length for the generated number, which will padded with zeros */
  length: number | null
}
type YearToken = {
  kind: 'year'
}

/** A single token in a pattern, like a literal string or a placeholder (e.g. {number}) */
type PatternToken = { originalString: string } & (LiteralToken | NumberToken | YearToken)

/** A structure representing the pattern after parsing */
type ParsedPattern = {

  /** The kind of pattern, determined by the {*.number} found in the pattern */
  kind: 'global' | 'yearly' | 'typed' | 'typedYearly'
  structure: PatternToken[]
}

// TODO move this together with others if they exist
type ErrorCode =
  | 'bad_syntax'
  | 'more_than_one_number_in_pattern'
  | 'unknown_placeholder'
  | 'no_number_specified_in_pattern'
  | 'forbidden_token_for_current_pattern'

type PatternError = {

  /** Error code to be translated */
  error_code: ErrorCode

  /** The string that caused the issue */
  culprit: string
}

export enum NumberingSystemTypes {
  INVOICE = 'invoice',
  PATIENT = 'patient',
  CASE = 'case',
  DEBTOR = 'debtor',
  PATIENT_DEBTOR = 'patient_debtor',
  USER_DEBTOR = 'user_debtor',
  THIRD_PARTY_DEBTOR = 'third_party_debtor',
  BG_DEBTOR = 'bg_debtor',
  CHARGE_ABGABE = 'charge_abgabe',
  SACHKOSTEN = 'sachkosten',
  ANAESTHESIA = 'anaesthesia',
  MATERIAL_PRIVATE = 'material_private',
  PLASTIC_SURGERY = 'plastic_surgery',
  PLASTIC_SURGERY_VAT = 'plastic_surgery_vat',
  SELF_PAYER = 'self_payer',
  PC_MATERIALS = 'pc_materials',
  OVERNIGHT_STAY = 'overnight_stay',
  PRESCRIPTION = 'prescription',
}

const numberKindToPatternKind: Record<NumberToken['kind'], ParsedPattern['kind']> = {
  number: 'global',
  'type.number': 'typed',
  'year.number': 'yearly',
  'type.year.number': 'typedYearly',
} as const

const startNumberingFrom = 1

export const forbiddenTokensForInvoices: PatternToken['kind'][] = []
export const forbiddenTokensForPatients: PatternToken['kind'][] = ['type.number', 'type.year.number']
export const forbiddenTokensForCases: PatternToken['kind'][] = ['type.number', 'type.year.number']
export const forbiddenTokensForDebtors: PatternToken['kind'][] = []

/** Parses a pattern string, returns either the result or a list of errors */
export const parsePattern = (
  pattern: string,
  forbiddenTokens: PatternToken['kind'][] = [],
): [ParsedPattern, null] | [null, PatternError[]] => {
  // TODO make a better regex
  const regex = /(?:({(?:number|type\.number|year\.number|type\.year\.number)(?::\d+)?})|({year})|([^{}]+))/g

  const match = pattern.match(regex)
  if (!match) return [null, [{ error_code: 'bad_syntax', culprit: pattern }]]

  let kind: ParsedPattern['kind'] | null = null
  let foundNumber = false
  const errors: PatternError[] = []
  const res: PatternToken[] = []
  for (const group of match)
    if (group.startsWith('{')) {
      const [name, padding] = group.substring(1, group.length - 1).split(':')
      const parsedPadding = padding ? Number(padding) : null

      if (forbiddenTokens.includes(name as PatternToken['kind']))
        errors.push({ error_code: 'forbidden_token_for_current_pattern', culprit: group })

      switch (name) {
        case 'number':
        case 'year.number':
        case 'type.number':
        case 'type.year.number':
          if (foundNumber) {
            errors.push({ error_code: 'more_than_one_number_in_pattern', culprit: group })
            continue
          }
          kind = numberKindToPatternKind[name]
          foundNumber = true

          res.push({ originalString: group, kind: name, length: parsedPadding })
          break
        case 'year':
          res.push({ originalString: group, kind: 'year' })
          break
        default:
          errors.push({ error_code: 'unknown_placeholder', culprit: group })
          break
      }
    } else {
      res.push({ kind: 'literal', originalString: group, value: group })
    }

  if (!kind) errors.push({ error_code: 'no_number_specified_in_pattern', culprit: pattern })

  if (errors.length > 0) return [null, errors]
  return [{ kind: kind as ParsedPattern['kind'], structure: res }, null]
}

/** Generates a new number for a pattern */
export const generateNumber = <TNumbers extends Partial<LastInvoicingNumbers>>(
  pattern: string,
  date: Date,
  lastNumbers: TNumbers,
  forbiddenTokens: PatternToken['kind'][],
): [string, TNumbers] => {
  const [parsedPattern, errors] = parsePattern(pattern, forbiddenTokens)
  // @ts-ignore There is a discrepancy between constants and constantsjs types
  if (errors) throw Error('pattern_parsing_failed', { cause: errors })

  const newNumbers = { ...lastNumbers }

  let nextNumber: number

  switch (parsedPattern.kind) {
    case 'global':
      nextNumber = newNumbers.lastGlobalNumber != null
        ? newNumbers.lastGlobalNumber + 1
        : startNumberingFrom
      newNumbers.lastGlobalNumber = nextNumber
      break
    case 'typed':
      nextNumber = newNumbers.lastTypedNumber != null
        ? newNumbers.lastTypedNumber + 1
        : startNumberingFrom
      newNumbers.lastTypedNumber = nextNumber
      break
    case 'yearly':
      nextNumber = newNumbers.lastYearlyNumber != null
        ? newNumbers.lastYearlyNumber + 1
        : startNumberingFrom
      newNumbers.lastYearlyNumber = nextNumber
      break
    case 'typedYearly':
      nextNumber = newNumbers.lastTypedYearlyNumber != null
        ? newNumbers.lastTypedYearlyNumber + 1
        : startNumberingFrom
      newNumbers.lastTypedYearlyNumber = nextNumber
      break
    default:
      throw Error('unknown_pattern_kind')
  }

  const tokenOutput = parsedPattern.structure.map(token => {
    switch (token.kind) {
      case 'literal':
        return token.value
      case 'number':
      case 'type.number':
      case 'year.number':
      case 'type.year.number':
        return `${nextNumber}`.padStart(token.length as number, '0')
      case 'year':
        return `${date.getFullYear()}`
      default:
        throw Error('unknown_token_kind')
    }
  })

  const result = tokenOutput.join('')
  return [result, newNumbers]
}

export const generateInvoiceNumber = (pattern: string,
  date: Date,
  lastNumbers: Partial<LastInvoicingNumbers>) =>
  generateNumber(pattern, date, lastNumbers, forbiddenTokensForInvoices)

export const generatePatientNumber = (pattern: string,
  date: Date,
  lastNumbers: Partial<LastPatientNumbers>) =>
  generateNumber(pattern, date, lastNumbers, forbiddenTokensForPatients)

export const generateCaseNumber = (pattern: string,
  date: Date,
  lastNumbers: Partial<LastCaseNumbers>) =>
  generateNumber(pattern, date, lastNumbers, forbiddenTokensForCases)

export const generateDebtorNumber = (pattern: string,
  date: Date,
  lastNumbers: Partial<LastDebtorNumbers>) =>
  generateNumber(pattern, date, lastNumbers, forbiddenTokensForDebtors)

// The following functions could be useful in the web page to show examples to the users as they choose a pattern
export const generateExampleInvoiceNumber = (pattern: string): string => {
  const [res, _] = generateInvoiceNumber(pattern, new Date(), {
    lastGlobalNumber: 55,
    lastTypedNumber: 44,
    lastYearlyNumber: 33,
    lastTypedYearlyNumber: 22,
  })
  return res
}
export const generateExamplePatientNumber = (pattern: string): string => {
  const [res, _] = generatePatientNumber(pattern,
    new Date(),
    { lastGlobalNumber: 55, lastYearlyNumber: 33 })
  return res
}
export const generateExampleCaseNumber = (pattern: string): string => {
  const [res, _] = generateCaseNumber(pattern,
    new Date(),
    { lastGlobalNumber: 55, lastYearlyNumber: 33 })
  return res
}
export const generateExampleDebtorNumber = (pattern: string): string => {
  const [res, _] = generateDebtorNumber(pattern, new Date(), {
    lastGlobalNumber: 55,
    lastTypedNumber: 44,
    lastYearlyNumber: 33,
    lastTypedYearlyNumber: 22,
  })
  return res
}
