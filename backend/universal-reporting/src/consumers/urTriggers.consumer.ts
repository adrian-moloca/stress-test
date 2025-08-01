// Guide at nestjs is wrong for bullMq, use this: https://docs.bullmq.io/guide/nestjs
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Component, eventConversionFuncForBE, getAffectedNodes, parseEventIntoDependencies, QUEUE_NAMES, tImportedEventsPayload, tTriggersQueueJobResult } from '@smambu/lib.constantsjs'
import { Job } from 'bullmq'
import { LoggingService, tLocalEventScope } from '@smambu/lib.commons-be'

import { URService, EvaluateExpressionService, DependenciesGraphService, FieldsOperationsService } from 'src/services'
import { Inject } from '@nestjs/common'
import { processMatchingTriggers } from 'src/utilities/trigger-evaluation'

@Processor(QUEUE_NAMES.URTriggerEvents)
export class TriggersConsumer extends WorkerHost {
  constructor (
    @Inject(URService)
    private readonly urService: URService,

    @Inject(EvaluateExpressionService)
    private readonly expressionService: EvaluateExpressionService,

    @Inject(DependenciesGraphService)
    private readonly dependenciesGraphService: DependenciesGraphService,

    @Inject(FieldsOperationsService)
    private readonly fieldsOperationsService: FieldsOperationsService,

    private readonly loggingService: LoggingService,

  ) {
    super()
    this.loggingService.setComponent(Component.UNIVERSAL_REPORTING)
  }

  async process (job: Job<tImportedEventsPayload, tTriggersQueueJobResult, string>) {
    try {
      const { id, data: triggerEvent } = job

      const {
        source,
        sourceDocId,
        previousValues,
        currentValues,
        metadata,
        tenantId
      } = triggerEvent

      const eventScope: tLocalEventScope = {
        source,
        sourceDocId,
        previousValues,
        currentValues,
        metadata,
      }

      const als = global.als
      const store = { tenantId }
      als.enterWith(store)

      this.loggingService.logInfo(`Processing job ${id}`, false)

      const systemIsBusy = await this.fieldsOperationsService.areThereOperationsRunning()

      if (systemIsBusy)
        throw new Error('System is busy, event processing will be halted')

      const eventType = triggerEvent.source
      const matching = await this.urService.findMatchingTriggers(eventType)

      const newProxiesIds:string[] = await processMatchingTriggers(matching,
        eventType,
        this.loggingService,
        this.urService,
        this.expressionService,
        eventScope,
        tenantId,
        this.fieldsOperationsService.areThereOperationsRunning,
        this.dependenciesGraphService.emitNode)

      const parsedDeps = parseEventIntoDependencies(triggerEvent, eventConversionFuncForBE)

      const nodesToProcess = await this.dependenciesGraphService.getAffectedNodes(parsedDeps)
      const affectedNodes = getAffectedNodes(nodesToProcess,
        parsedDeps,
        previousValues,
        currentValues)

      if (affectedNodes.length > 0)
        await this.dependenciesGraphService.markNodesAsDirty(affectedNodes)

      await this.urService.markEventAsProcessed(job.id!)

      return { newProxiesIds }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  @OnWorkerEvent('completed')
  onCompleted (job: Job, returnValue: tTriggersQueueJobResult) {
    const nProxiesCreated = returnValue.newProxiesIds.length
    const proxiesIds = returnValue.newProxiesIds.join(',')
    const newProxiesPart = nProxiesCreated > 0
      ? `
    Here is the list: "${proxiesIds}"
    `
      : ''
    const message = `
    Job ${job.id} created ${nProxiesCreated} new proxies.
    ${newProxiesPart}
    `

    this.loggingService.logInfo(message, false)
  }

  @OnWorkerEvent('failed')
  onFailed (job: Job, failedReason: string) {
    const failMessage = `Job ${job.id} failed with reason ${failedReason}`

    this.loggingService.logError(failMessage)
  }
}
