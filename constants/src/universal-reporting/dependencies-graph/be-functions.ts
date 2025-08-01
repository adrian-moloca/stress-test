import { tParsedDep, SOURCE_SCHEMAS, tImportedEventsPayload, tLocalEventValue, tLocalEventsMetadata } from '../../types'
import { tDependenciesReplacementMap } from '../../types/universal-billing/dependencies-graph'
import { prettifyObject } from '../../utils'

export function replaceDepsFunForBE (dependency: string,
  replacementMap:tDependenciesReplacementMap) {
  let fixedDep = dependency
  Object.entries(replacementMap).forEach(([original, replacement]) => {
    if (fixedDep.startsWith(original)) {
      const replacementRegEx = new RegExp(`^${original}.`)

      fixedDep = fixedDep.replace(replacementRegEx, `${replacement}.`)
    }

    return fixedDep
  })

  return fixedDep
}

function convertAnagraphics (metadata: tLocalEventsMetadata,
  previousValues: tLocalEventValue,
  currentValues: tLocalEventValue) {
  if (metadata === null)
    throw new Error(`
  Warning: metadata cannot be null for an anagraphic event (processing event ${prettifyObject(event)})
  `)

  const returnValue: tParsedDep[] = []

  const subType = metadata.subType

  const baseAnag = SOURCE_SCHEMAS.ANAGRAPHICS
  const baseOmni = `${SOURCE_SCHEMAS.ANAGRAPHICS}.*`

  const baseAnagParsed:tParsedDep = {
    base: baseAnag,
    omniPrefix: baseOmni

  }

  const baseSubType = `${SOURCE_SCHEMAS.ANAGRAPHICS}.${subType}`
  const omniSubType = `${SOURCE_SCHEMAS.ANAGRAPHICS}.${subType}.*`

  const subTypeParsed:tParsedDep = {
    base: baseSubType,
    specificDocument: baseSubType,
    omniPrefix: omniSubType
  }

  returnValue.push(baseAnagParsed)
  returnValue.push(subTypeParsed)

  let uniqueIds = new Set<string>()

  const hasPreviousValues = previousValues != null
  const hasCurrentValues = currentValues != null

  if (hasPreviousValues) {
    const prevIds = Object.keys(previousValues)

    uniqueIds = new Set([...uniqueIds, ...prevIds])
  }

  if (hasCurrentValues) {
    const currentIds = Object.keys(currentValues)

    uniqueIds = new Set([...uniqueIds, ...currentIds])
  }

  const uniqueIdsArray = [...uniqueIds]

  if (uniqueIds.size > 0)
    uniqueIdsArray.forEach(currentId => {
      const baseDocLevel = `${SOURCE_SCHEMAS.ANAGRAPHICS}.${subType}.${currentId}`

      const docLevelParsed:tParsedDep = {
        base: baseDocLevel,
        skipSpecifics: true
      }

      returnValue.push(docLevelParsed)
    })

  return returnValue
}

export function eventConversionFuncForBE (event: tImportedEventsPayload) {
  const { source, sourceDocId, metadata, previousValues, currentValues } = event
  const parsedSource = source.split('-')[0]
  const returnValue: tParsedDep[] = []

  if (parsedSource === SOURCE_SCHEMAS.ANAGRAPHICS) {
    const parsedAnagraphics = convertAnagraphics(metadata, previousValues, currentValues)

    return parsedAnagraphics
  }

  const specificDocument = `${parsedSource}.${sourceDocId}`
  const omniPrefix = `${parsedSource}.*`
  const localDep:tParsedDep = {
    base: parsedSource,
    specificDocument,
    omniPrefix
  }

  returnValue.push(localDep)

  return returnValue
}

export function replaceDepsFunForFE (dependency: string,
  replacementMap:tDependenciesReplacementMap) {
  let fixedDep = dependency

  if (dependency.startsWith('self.'))
    fixedDep = dependency.replace('self.', 'data.')

  if (dependency in replacementMap)
    fixedDep = replacementMap[dependency]

  return fixedDep
}
