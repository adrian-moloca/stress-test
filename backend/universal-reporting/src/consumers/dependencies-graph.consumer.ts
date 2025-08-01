import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectModel } from '@nestjs/mongoose'
import { LoggingService } from '@smambu/lib.commons-be'
import { callMSWithTimeoutAndRetry, Component, getParsedEntity, IGenericError, parseTarget, processNode, QUEUE_NAMES, replaceDepsFunForBE, setNestedValue, TARGETABLE_ENTITIES, tDependenciesReplacementMap, tEntityRetrievalFunc, tEntityUpdateFunc, tEvaluateNamedExpressionData, tGenericDependencyJob, tParsedTarget, tScope } from '@smambu/lib.constantsjs'
import { Job } from 'bullmq'
import { Model, ObjectId } from 'mongoose'
import { Proxy } from 'src/schemas/proxy.schema'
import { DependenciesGraphService, EvaluateExpressionService } from 'src/services'

@Processor(QUEUE_NAMES.DepenenciesGraphQueue)
export class DependenciesGraphConsumer extends WorkerHost {
  constructor (
    @InjectModel(Proxy.name)
    private readonly proxyModel: Model<Proxy>,

    @Inject('CASES_CLIENT')
    private readonly caseClient: ClientProxy,

    @Inject(EvaluateExpressionService)
    private readonly expressionService: EvaluateExpressionService,

    @Inject(DependenciesGraphService)
    private readonly dependenciesGraphService: DependenciesGraphService,

    private readonly loggingService: LoggingService,
  ) {
    super()
    this.loggingService.setComponent(Component.FIELDS_LIFECYLE_CONSUMER)
  }

  getProxyEntity = async (id: string) => {
    const store = global.als.getStore()
    try {
      store!.skipRWMiddleware = true
      const result = await this.proxyModel.findById(id).lean() as Proxy

      store!.skipRWMiddleware = false

      return result
    } catch (e) {
      store!.skipRWMiddleware = false

      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  getCaseEntity = async (id: string) => {
    const store = global.als.getStore()
    try {
      store!.skipRWMiddleware = true

      const response = await callMSWithTimeoutAndRetry(
        this.caseClient,
        { role: 'cases', cmd: 'getCasebyIdWithoutPermissions' },
        { caseId: id },
        Component.DEPENCECIES_GRAPH_CONSUMER,
      )

      store!.skipRWMiddleware = false

      return response
    } catch (e) {
      store!.skipRWMiddleware = false

      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  updateCaseEntity = async (id: string, updatePayload: Record<string, unknown>) => {
    console.error('not implemented yet')
  }

  updateProxyEntity = async (id: string, updatePayload: Record<string, unknown>) => {
    const store = global.als.getStore()
    try {
      store!.skipRWMiddleware = true
      const proxy = await this.proxyModel.findById(id).lean()

      if (proxy == null)
        throw Error(`Error: proxy with id ${id} is missing`)

      Object.entries(updatePayload).forEach(([path, value]) => {
        setNestedValue(proxy, path, value)
      })

      await this.proxyModel.updateOne({ _id: id }, proxy)

      store!.skipRWMiddleware = false
    } catch (e) {
      store!.skipRWMiddleware = false

      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  // XXX This function cannot do http calls, and should be only used in the
  // "process" method of this file
  evaluateNamedExpressionForBackend = async (data: tEvaluateNamedExpressionData) => {
    return this.expressionService.evaluateNamedExpression(data, undefined, '')
  }

  entityRetrievalFunctionsMap:Record<string, tEntityRetrievalFunc> = {
    [TARGETABLE_ENTITIES.CASE]: this.getCaseEntity,
    [TARGETABLE_ENTITIES.PROXY]: this.getProxyEntity,
  }

  entityUpdateFunctionsMap:Record<string, tEntityUpdateFunc> = {
    [TARGETABLE_ENTITIES.CASE]: this.updateCaseEntity,
    [TARGETABLE_ENTITIES.PROXY]: this.updateProxyEntity,
  }

  async process (job: Job<tGenericDependencyJob, boolean, string>) {
    try {
      const data = job.data
      const { tenantId } = data

      const als = global.als
      const store = { tenantId }
      als.enterWith(store)

      const nodes = data.nodes

      const parsedTarget: tParsedTarget = parseTarget(nodes[0].target)

      const entity = await getParsedEntity(parsedTarget, this.entityRetrievalFunctionsMap)

      const scope:tScope = { self: entity as Record<string, unknown> }
      const replacementMap: tDependenciesReplacementMap = {
        self: nodes[0].entity!
      }

      for (const node of nodes) {
        const { updates } = await processNode(node,
          scope,
          this.expressionService.executeQueryBypassDependencies,
          this.evaluateNamedExpressionForBackend,
          this.dependenciesGraphService.updateNode,
          entity as Record<string, unknown>,
          replacementMap,
          replaceDepsFunForBE)

        if (Object.keys(updates.updatesMap).length > 0) {
          const updateFunc = this.entityUpdateFunctionsMap[updates.targetEntity]

          await updateFunc(updates.id, updates.updatesMap)
        }
      }

      return { entity: (entity as {_id: ObjectId})._id?.toString(), processed: nodes.length }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }

  @OnWorkerEvent('completed')
  onCompleted (job: Job, returnValue: Record<string, number>) {
    const { entity, processed } = returnValue

    const message = `
    Job ${job.id} processed ${processed} nodes for entity with id ${entity}.
    `

    this.loggingService.logInfo(message, false)
  }

  @OnWorkerEvent('failed')
  onFailed (job: Job, failedReason: string) {
    const failMessage = `Job ${job.id} failed with reason ${failedReason}`

    this.loggingService.logError(failMessage)
  }
}
