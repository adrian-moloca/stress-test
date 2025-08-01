import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  LoggingService,
} from '@smambu/lib.commons-be'
import {
  ALLOWED_DEFINITION_DEPS,
  Component,
  DEPENDENCY_JOB_TYPE,
  IGenericError,
  QUEUE_NAMES,
  TARGETABLE_ENTITIES,
  tDependencyJobType,
  tField,
  tGraphFieldJob,
  tProxyDynamicFields,
  emitFieldOnGraph,
  getTarget,
  updateFieldOnGraph,
  tAsyncLocalStorage,
} from '@smambu/lib.constantsjs'
import { Job } from 'bullmq'
import { Model } from 'mongoose'
import { Proxy } from 'src/schemas/proxy.schema'
import { DependenciesGraphService, FieldsOperationsService } from 'src/services'

@Processor(QUEUE_NAMES.GraphFieldsQueue)
export class FieldLifecyleConsumer extends WorkerHost {
  constructor (
    @InjectModel(Proxy.name)
    private readonly proxyModel: Model<Proxy>,
    private readonly loggingService: LoggingService,
    @Inject(DependenciesGraphService)
    private readonly dependenciesGraphService: DependenciesGraphService,
    @Inject(FieldsOperationsService)
    private readonly fieldsOperations: FieldsOperationsService
  ) {
    super()
    this.loggingService.setComponent(Component.FIELDS_LIFECYLE_CONSUMER)
  }

  async getNewFieldsArray (
    jobType: tDependencyJobType,
    field: tField,
    proxyDynamicFields: tProxyDynamicFields
  ) {
    const updated: tProxyDynamicFields = { ...proxyDynamicFields }

    switch (jobType) {
      case DEPENDENCY_JOB_TYPE.CREATE:
        updated[field.id] = undefined
        break

      case DEPENDENCY_JOB_TYPE.DELETE:
        delete updated[field.id]
        break

      default:
        throw Error(`Job type ${jobType} is not supported`)
    }

    return updated
  }

  async processField (jobType: tDependencyJobType,
    field: tField,
    proxyId: string,
    tenantId: string) {
    const target = getTarget(TARGETABLE_ENTITIES.PROXY, proxyId, field.id)
    const automaticValue = field.definition.automaticValue ?? null

    switch (jobType) {
      case DEPENDENCY_JOB_TYPE.CREATE:
        await emitFieldOnGraph(
          target,
          [ALLOWED_DEFINITION_DEPS.DEFINEDBY],
          automaticValue,
          field.version,
          field.definition.condition ?? null,
          field.definition.mergePolicies,
          tenantId,
          this.dependenciesGraphService.emitNode,
          // TODO: ref #1391
          []
        )
        break

      case DEPENDENCY_JOB_TYPE.UPDATE:
        await updateFieldOnGraph(
          target,
          automaticValue,
          field.version,
          field.definition.condition ?? null,
          field.definition.mergePolicies,
          tenantId,
          this.dependenciesGraphService.updateNode
        )
        break

      case DEPENDENCY_JOB_TYPE.DELETE:
        await this.dependenciesGraphService.deleteNode(target, tenantId)
        break

      default:
        throw Error(`Graph event of type ${jobType} isn't supported`)
    }
  }

  async process (job: Job<tGraphFieldJob, boolean, string>) {
    try {
      const { type, field, domainId, tenantId, id } = job.data

      const als = global.als
      const store:tAsyncLocalStorage = { tenantId, skipRWMiddleware: true }
      als.enterWith(store)

      const matchingProxies = await this.proxyModel.find({ domainId })

      if (matchingProxies.length === 0)
        this.loggingService.logInfo(
          `No proxy matching for domain ${domainId} of tenant ${tenantId}`
        )

      for (const proxy of matchingProxies) {
        const newFields = await this.getNewFieldsArray(type, field, proxy.dynamicFields)

        await this.processField(type, field, proxy.id, tenantId)

        await this.proxyModel.updateOne(
          { _id: proxy._id },
          {
            dynamicFields: newFields,
          }
        )
      }

      await this.fieldsOperations.markOperationAsProcessed(id, tenantId)

      return { id: field.id, type, updated: matchingProxies.length }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e as IGenericError)
    }
  }

  @OnWorkerEvent('completed')
  onCompleted (job: Job, returnValue: Record<string, number>) {
    const { id, updated, type } = returnValue

    const message = `
    Job ${job.id} performed ${type} operation on field with id ${id} to ${updated} matching proxies.
    `

    this.loggingService.logInfo(message, false)
  }

  @OnWorkerEvent('failed')
  onFailed (job: Job, failedReason: string) {
    const failMessage = `Job ${job.id} failed with reason ${failedReason}`

    this.loggingService.logError(failMessage)
  }
}
