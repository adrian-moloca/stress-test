import {
  LoggingService,
  tLocalEventScope,
  tMatchingTriggers,
} from '@smambu/lib.commons-be'
import { EvaluateExpressionService, URService } from 'src/services'
import {
  ALLOWED_DEFINITION_DEPS,
  emitFieldOnGraph,
  getTarget,
  isContextValid,
  MockTranslatableToString,
  TARGETABLE_ENTITIES,
  tContext,
  tDependencyGraphNode,
  tTriggerFailureReason,
  tValidEventName,
} from '@smambu/lib.constantsjs'

export const processMatchingTriggers = async (
  matching: tMatchingTriggers[],
  eventType: tValidEventName,
  loggingService: LoggingService,
  urService: URService,
  expressionService: EvaluateExpressionService,
  eventScope: tLocalEventScope,
  tenantId: string,
  checkSystemBusyFun: () => Promise<boolean>,
  emitFun: (node: tDependencyGraphNode) => Promise<void>
) => {
  try {
    const failingTriggers: tTriggerFailureReason[] = []
    const newProxiesIds: string[] = []

    if (matching.length === 0) {
      loggingService.logInfo(`Event ${eventType} didn't match any trigger`)

      return []
    }

    for (const currentMatch of matching) {
      const trigger = currentMatch.trigger
      const domainId = currentMatch.domainId

      const { condition, emitExpression, contextKey, name } = trigger

      const nameProvided = name != null
      // @ts-expect-error ts is wrong, the check is literally one line above
      const translatedName = MockTranslatableToString(name, 'en')

      const triggerName = translatedName != null ? translatedName : 'noname'

      const triggerDomainId = `${domainId}-${translatedName}`

      const triggerLoggingId = nameProvided ? triggerName : triggerDomainId

      const conditionEvaluation = await expressionService.evaluateExpression({
        data: condition,
        scope: {
          self: {},
          ...eventScope,
        },
        selectedLocale: 'en',
        authorization: '',
        userPermissions: undefined,
      })

      const conditionEvaluated = conditionEvaluation.evaluated
      const conditionErrors = conditionEvaluation.evaluated.error
      const conditionHasErrors = conditionErrors != null && conditionErrors !== ''

      if (conditionHasErrors) {
        failingTriggers.push({
          id: triggerLoggingId,
          tenantId,
          reason: `Condition error ${conditionErrors}`,
        })

        loggingService.logError(`
Warning: Condition of trigger ${triggerLoggingId} of tenant ${tenantId} was not valid, with error ${conditionErrors}. 
Trigger will be skipped, and the current event will be left unprocessed
`)

        continue
      }

      const conditionOutcome = conditionEvaluated.value

      if (conditionOutcome) {
        loggingService.logInfo(
          `Condition for trigger ${triggerLoggingId} and eventType ${eventType} is met.`
        )

        const evaluatedContext = await expressionService.evaluateExpression({
          data: emitExpression,
          scope: {
            self: {},
            ...eventScope,
          },
          selectedLocale: 'en',
          authorization: '',
          userPermissions: undefined,
        })

        const contextEvaluated = evaluatedContext.evaluated
        const contextErrors = evaluatedContext.evaluated.error
        const contextHasErrors = contextErrors != null && contextErrors !== ''

        if (contextHasErrors) {
          failingTriggers.push({
            id: triggerLoggingId,
            tenantId,
            reason: `Context error ${contextErrors}`,
          })

          loggingService.logError(`
Warning: Context expression of trigger ${triggerLoggingId} of tenant ${tenantId} was not valid, with error ${contextErrors}. 
Trigger will be skipped, and the current event will be left unprocessed
`)

          continue
        }

        const contextValid = isContextValid(contextEvaluated.value)

        if (!contextValid) {
          failingTriggers.push({
            id: triggerLoggingId,
            tenantId,
            reason: 'Invalid context',
          })

          loggingService.logError(`
          Warning: context generated from trigger expression ${triggerLoggingId} of tenant ${tenantId} was not valid. 
          Trigger will be skipped, and the current event will be left unprocessed
          `)

          continue
        }

        const evaluatedContextKey = await expressionService.evaluateExpression({
          data: contextKey,
          scope: {
            self: {},
            ...eventScope,
          },
          selectedLocale: 'en',
          authorization: '',
          userPermissions: undefined,
        })

        const contextKeyEvaluated = evaluatedContextKey.evaluated
        const contextKeyErrors = evaluatedContextKey.evaluated.error
        const contextKeyHasErrors = contextKeyErrors != null && contextKeyErrors !== ''

        if (contextKeyHasErrors) {
          failingTriggers.push({
            id: triggerLoggingId,
            tenantId,
            reason: `Context key error ${contextKeyErrors}`,
          })

          loggingService.logError(`
Warning: Context key of trigger ${triggerLoggingId} of tenant ${tenantId} was not valid, with error ${contextKeyErrors}. 
Trigger will be skipped, and the current event will be left unprocessed
`)

          continue
        }

        const proxyFields = await urService.getDomainFields(domainId, tenantId)

        const systemIsBusy = await checkSystemBusyFun()

        if (systemIsBusy)
          throw new Error('System is busy, event processing will be halted')

        const createdProxy = await urService.createProxy(
          contextKeyEvaluated.value as string,
          contextEvaluated.value as tContext,
          domainId,
          proxyFields
        )

        if (createdProxy !== null) {
          newProxiesIds.push(createdProxy.id)

          loggingService.logInfo(
            `A proxy with id ${createdProxy.id} was created for contextKey "${contextKeyEvaluated.value}" and tenantId "${tenantId}"`,
            true
          )

          for (const currentField of proxyFields) {
            const target = getTarget(TARGETABLE_ENTITIES.PROXY, createdProxy.id, currentField.id)
            const automaticValue = currentField.definition.automaticValue ?? null

            await emitFieldOnGraph(
              target,
              [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
              automaticValue,
              currentField.version,
              currentField.definition.condition ?? null,
              currentField.definition.mergePolicies,
              tenantId,
              emitFun,
              // TODO: ref #1391
              []
            )
          }
        } else {
          loggingService.logWarn(
            `Warning: a proxy for contextKey "${contextKeyEvaluated.value}" and tenantId "${tenantId}" already exists`
          )
        }
      } else {
        loggingService.logInfo('Trigger skipped because its condition is not met')
      }
    }

    if (failingTriggers.length > 0) {
      const parsedReasons = failingTriggers
        .map(
          current =>
            `id: ${current.id}
    tenantId: ${current.tenantId}
    reason: ${current.reason}
    `
        )
        .join('\n')

      const message = `
    The following triggers have failed:
      ${parsedReasons}
    `

      throw Error(message)
    }

    return newProxiesIds
  } catch (e) {
    return await loggingService.throwErrorAndLog(e)
  }
}
