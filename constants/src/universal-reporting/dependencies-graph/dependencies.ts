import { tParsedDep, tImportedEventsPayload, SOURCE_SCHEMAS, tDepDetails, tDependenciesReplacementFun, tDependenciesReplacementMap, tDependencyGraphNode, tDependencyMap, tEmits, tLocalEventValue, tMarkAsDirtyPayload, tValidEventName, tLocalEventConversionFun, tParsedDepPaths } from '../../types'
import { isExplorableObject, pathMatchesPattern, testQueryOnObject } from '../../utils'

export function emitsArrayToDependencyMap (emitsArray: tEmits,
  replacementMap: tDependenciesReplacementMap,
  replacementFun: tDependenciesReplacementFun) {
  const dependencyMap:tDependencyMap = {}

  emitsArray.forEach(current => {
    const { path, details } = current

    const parsedPath = replacementFun(path, replacementMap)

    dependencyMap[parsedPath] = details
  })

  return dependencyMap
}

export function getUniqueDependencyPaths (emitsArray: tEmits,
  replacementMap: tDependenciesReplacementMap,
  replacementFun: tDependenciesReplacementFun) {
  const uniqueDeps = new Set<string>()

  emitsArray.forEach(current => {
    const parsedPath = replacementFun(current.path, replacementMap)

    uniqueDeps.add(parsedPath)
  })

  return [...uniqueDeps]
}

export const getExpandedDepsPaths = (inputObject: Record<string, unknown>,
  prefix: string,
  depsArray:string[] = []) => {
  for (const currentField in inputObject) {
    if (inputObject[currentField] === undefined) continue

    const canExplore = isExplorableObject(inputObject[currentField])
    const localPrefix = `${prefix}.${currentField}`
    if (canExplore) {
      let deeperLevel = getExpandedDepsPaths(inputObject[currentField] as Record<string, unknown>,
        localPrefix,
        depsArray)

      for (let currentPath in deeperLevel)
        if (deeperLevel[currentPath] === undefined) continue
    } else {
      depsArray.push(localPrefix)
    }
  }

  return depsArray
}

export const localEventMatchesDep = (previousValues: tLocalEventValue,
  currentValues: tLocalEventValue,
  depDetails: tDepDetails) => {
  let expressionsDepsMatchPrev = false
  let expressionsDepsMatchCurrent = false
  if (previousValues != null)
    expressionsDepsMatchPrev = testQueryOnObject(previousValues,
      depDetails)

  if (currentValues != null)
    expressionsDepsMatchCurrent = testQueryOnObject(currentValues,
      depDetails)

  return expressionsDepsMatchPrev || expressionsDepsMatchCurrent
}

function depsFromLocalEvent (
  eventValue: tLocalEventValue,
  prefix?: string
) {
  if (prefix === undefined)
    return []

  if (eventValue == null)
    return []

  const paths = getExpandedDepsPaths(eventValue, prefix)

  return paths
}

function parseAnagraphicDepsForBE (eventValues: tLocalEventValue, prefix?: string) {
  if (eventValues === null)
    return []

  if (prefix === undefined)
    return []

  let tempDeps = new Set<string>()
  const previousValuesOnly = Object.values(eventValues)

  for (const current of previousValuesOnly) {
    const tmpDepsArray = depsFromLocalEvent(current as tLocalEventValue, prefix)

    tempDeps = new Set<string>([...tempDeps, ...tmpDepsArray])
  }

  return [...tempDeps]
}

export function getFullDepPaths (parsedDep: tParsedDep,
  source: tValidEventName,
  previousValues: tLocalEventValue,
  currentValues: tLocalEventValue) {
  const returnValue: tParsedDepPaths = {
    omniFullPathsCurrent: [],
    omniFullPathsPrev: [],
    specificFullPathsCurrent: [],
    specificFullPathsPrev: []
  }

  const { omniPrefix, specificDocument } = parsedDep

  const parsedSource = source.split('-')[0]

  if (parsedSource === SOURCE_SCHEMAS.ANAGRAPHICS) {
    // XXX Little bit of explanation: in the current anagraphics events we receive
    // a payload something like this:
    // { [anagraphicId]: changedValues}
    // for the "omni" prefix we want to "eliminate" the id information, so we
    // use only the changedValues.
    // For the specific documents we want the full path.
    returnValue.omniFullPathsPrev = parseAnagraphicDepsForBE(previousValues, omniPrefix)
    returnValue.specificFullPathsPrev = depsFromLocalEvent(previousValues, specificDocument)

    returnValue.omniFullPathsCurrent = parseAnagraphicDepsForBE(currentValues, omniPrefix)
    returnValue.specificFullPathsCurrent = depsFromLocalEvent(currentValues, specificDocument)

    return returnValue
  }

  returnValue.omniFullPathsPrev = depsFromLocalEvent(previousValues, omniPrefix)
  returnValue.specificFullPathsPrev = depsFromLocalEvent(previousValues, specificDocument)

  returnValue.omniFullPathsCurrent = depsFromLocalEvent(currentValues, omniPrefix)
  returnValue.specificFullPathsCurrent = depsFromLocalEvent(currentValues, specificDocument)

  return returnValue
}

export function parseEventIntoDependencies (event: tImportedEventsPayload,
  conversionFun:tLocalEventConversionFun) {
  const { source, currentValues, previousValues } = event

  // XXX There might some cases where one single event creates multiple depencency
  // path, i.e. when there is a transformation function involved (e.g. one
  // anagraphic event can cause as many paths as many anagraphics row were
  // affected)
  const parsedDeps = conversionFun(event)

  let emittedEvents = new Set<string>()

  for (const currentDep of parsedDeps) {
    const { base, specificDocument, skipSpecifics } = currentDep

    if (skipSpecifics) {
      emittedEvents = new Set([...emittedEvents, base])

      continue
    }

    const returnValue: tParsedDepPaths = getFullDepPaths(currentDep,
      source,
      previousValues,
      currentValues)

    if (specificDocument)
      emittedEvents.add(specificDocument)

    emittedEvents = new Set([
      ...emittedEvents,
      base,
      ...returnValue.omniFullPathsPrev,
      ...returnValue.omniFullPathsCurrent,
      ...returnValue.specificFullPathsPrev,
      ...returnValue.specificFullPathsCurrent
    ])
  }

  return [...emittedEvents]
}

function anyDependencyMatches (
  sourceDepDetails: tDependencyMap,
  parsedDeps: string[],
  sourceDeps: string[],
  previousValues: tLocalEventValue,
  currentValues: tLocalEventValue
) {
  for (const sourceDep of sourceDeps) {
    const matchingDeps = parsedDeps.filter(pdep => pathMatchesPattern(pdep, sourceDep))
    if (matchingDeps.length > 0) {
      const currentDepDetails = sourceDepDetails[sourceDep]
      if (currentDepDetails == null)
        return true

      const depMatches = localEventMatchesDep(previousValues, currentValues, currentDepDetails)

      if (depMatches)
        return true
    }
  }

  return false
}

export function getAffectedNodes (nodesToProcess: tDependencyGraphNode[],
  parsedDeps: string[],
  previousValues: tLocalEventValue,
  currentValues: tLocalEventValue) {
  const affectedNodes:tMarkAsDirtyPayload[] = []
  for (const currentNode of nodesToProcess) {
    const nodeDirtyPayload:tMarkAsDirtyPayload = {
      target: currentNode.target,
      tenantId: currentNode.tenantId
    }

    const expressionDepMatches = anyDependencyMatches(currentNode.expressionDepsDetails,
      parsedDeps,
      currentNode.expressionDeps,
      previousValues,
      currentValues)

    if (expressionDepMatches) {
      affectedNodes.push(nodeDirtyPayload)

      continue
    }

    const childDeps = currentNode.childDeps ?? []
    if (childDeps.length > 0) {
      const childDepMatches = anyDependencyMatches(
        {},
        parsedDeps,
        childDeps,
        previousValues,
        currentValues
      )
      if (childDepMatches) {
        affectedNodes.push(nodeDirtyPayload)
        continue
      }
    }

    const conditionDeps = currentNode.conditionDeps

    if (conditionDeps !== null) {
      const conditionDepMatches = anyDependencyMatches(currentNode.conditionDepsDetail,
        parsedDeps,
        conditionDeps,
        previousValues,
        currentNode)

      if (conditionDepMatches)
        affectedNodes.push(nodeDirtyPayload)
    }
  }

  return affectedNodes
}
