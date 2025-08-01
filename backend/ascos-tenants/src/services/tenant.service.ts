import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Tenant, TenantDocument } from '../schemas/tenant.schema'
import { Model } from 'mongoose'
import { Component, CreateTenantDTO, CurrencySymbols, ETenantJobTypes, ExportTenantDTO, ResetTenantDTO, Role, TTenantJob, callMSWithTimeoutAndRetry, getFirstRolePayload, systemConfigurationSections } from '@smambu/lib.constantsjs'
import { ClientProxy } from '@nestjs/microservices'
import { ObjectId } from 'mongodb'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectQueue } from '@nestjs/bull'
import { NAMES, queueRetry } from 'src/utilities/constants'
import { Job, Queue } from 'bull'

@Injectable()
export class TenantService {
  constructor (
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @Inject('ROLE_CLIENT') private readonly rolesClient: ClientProxy,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('CASES_CLIENT') private readonly caseClient: ClientProxy,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
    @InjectQueue(NAMES.CopierQueue) private copierQueue: Queue,
  ) {
    this.loggingService.setComponent(Component.TENANTS)
  }

  async create (data: CreateTenantDTO, email: string) {
    try {
      const newTenantDoc = await this.tenantModel.create({
        name: data.name,
        resettable: data.resettable,
        isResetting: false,
        exportable: data.exportable,
        isExporting: false,
        dataFiles: []
      })
      const newTenant = newTenantDoc.toObject()
      const tenantId = newTenant._id.toHexString()

      const editPattern = { role: 'SystemConfigurationSection', cmd: 'edit' }

      const editPayloadData = {
        section: systemConfigurationSections.ENVIRONMENT_CONFIG,
        tenantId,
        data: {
          language: data.defaultLanguage,
          currency: CurrencySymbols[data.currencySymbol],
        }
      }

      await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        editPattern,
        editPayloadData,
        Component.TENANTS)

      const createRolesPattern = { role: 'roles', cmd: 'create' }

      const createRolesPayloadData = {
        data: getFirstRolePayload(tenantId),
        tenantId,
      }

      const firstRole: Role = await callMSWithTimeoutAndRetry(this.rolesClient,
        createRolesPattern,
        createRolesPayloadData,
        Component.TENANTS)

      const createUserPattern = { role: 'user', cmd: 'create' }

      const createUserPayloadData = {
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          email,
          tenantId,
        },
        tenantId
      }

      const firstUser = await callMSWithTimeoutAndRetry(this.usersClient,
        createUserPattern,
        createUserPayloadData,
        Component.TENANTS)

      const createRoleAssociationPattern = { role: 'roleAssociation', cmd: 'create' }

      const createRoleAssociationPayloadData = {
        role: firstRole.id,
        users: [firstUser._id],
        tenantId
      }

      const roleAssociation = await callMSWithTimeoutAndRetry(this.rolesClient,
        createRoleAssociationPattern,
        createRoleAssociationPayloadData,
        Component.TENANTS)

      const updateUserPattern = { role: 'user', cmd: 'update' }

      const updateUserPayloadData = {
        userId: firstUser._id,
        user: null,
        data: {
          roleAssociations: [roleAssociation._id]
        },
        tenantId,
      }

      await callMSWithTimeoutAndRetry(this.usersClient,
        updateUserPattern,
        updateUserPayloadData,
        Component.TENANTS)

      return newTenant
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetTenant (data: ResetTenantDTO, email: string) {
    try {
      const targetTenantDoc = await this.tenantModel.findById(data.targetTenantId)

      if (targetTenantDoc == null) throw new Error('Tenant not found')
      if (!targetTenantDoc.resettable) throw new Error('Tenant not resettable')
      if (data.sourceTenantId == null && data.zipFileId == null) throw new Error('Invalid parameters')
      if (targetTenantDoc.isResetting) throw new Error('resetTenant_resetAlreadyInProgress_error')

      const jobId = 'reset_' + data.targetTenantId
      const queryRetryObj = queueRetry()
      const jobData: TTenantJob = {
        type: ETenantJobTypes.RESET,
        targetTenantId: data.targetTenantId,
      }

      if (data.sourceTenantId != null) {
        const sourceTenantDoc = await this.tenantModel.findById(data.sourceTenantId)

        if (sourceTenantDoc == null) throw new Error('Source tenant not found')
        if (!sourceTenantDoc.exportable) throw new Error('Source tenant not exportable')
        if (sourceTenantDoc.isExporting) throw new Error('resetTenant_exportAlreadyInProgress_error')

        jobData.sourceTenantId = data.sourceTenantId

        await this.loggingService.logInfo(`${email} is resetting tenant "${data.targetTenantId}" with data from "${data.sourceTenantId}" tenant`)
      } else if (data.zipFileId != null) {
        jobData.zipFileId = data.zipFileId

        await this.loggingService.logInfo(`${email} is resetting tenant "${data.targetTenantId}" with data from the uploaded file`)
      }

      const added = await this.copierQueue.add(jobData, {
        jobId,
        removeOnComplete: true,
        removeOnFail: true,
        ...queryRetryObj
      })

      return added
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async exportTenant (data: ExportTenantDTO): Promise<Job<TTenantJob>> {
    try {
      const tenantDoc = await this.tenantModel.findById(data.tenantId)

      if (tenantDoc == null) throw new Error('Tenant not found')
      if (!tenantDoc.exportable) throw new Error('Tenant not exportable')
      if (tenantDoc.isExporting) throw new Error('exportTenant_alreadyInProgress_error')

      const jobId = 'export_' + data.tenantId
      const queryRetryObj = queueRetry()

      const added = await this.copierQueue.add({
        targetTenantId: data.tenantId,
        type: ETenantJobTypes.EXPORT,
      }, { jobId, removeOnComplete: true, removeOnFail: true, ...queryRetryObj })

      return added
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getTenantsByIds (tenantsIds: string[]) {
    try {
      const tenants = await this.tenantModel.find({
        _id: {
          $in: tenantsIds.map(id => new ObjectId(id))
        }
      })
      return tenants
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getTenantById (tenantId: string) {
    try {
      const tenant = await this.tenantModel.findById(tenantId)
      return tenant
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeDebtorNumbers (body: { limit: number }) {
    try {
      const pattern = { role: 'systemConfigurations', cmd: 'normalizeDebtorNumbers' }

      const response = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        body,
        Component.TENANTS)

      return response
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizePatientsNumbers (body: {
    limit: number, tenantId: string, skipPatients?: boolean, skipCases?: boolean, sleepTime?: number
  }) {
    try {
      let newPatientsNumbers = null
      let newCasesPatientsNumbers = null
      if (!body.skipPatients) {
        // eslint-disable-next-line no-console
        console.log('PNN tenants callSystemConfigurationClient')
        const patientsNumberPattern = { role: 'systemConfigurations', cmd: 'normalizePatientsNumbers' }

        newPatientsNumbers = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
          patientsNumberPattern,
          body,
          Component.TENANTS)
      }

      if (!body.skipCases) {
        // eslint-disable-next-line no-console
        console.log('PNN tenants callCasesClient')
        const casePatientsNumberPattern = { role: 'cases', cmd: 'normalizeCasesPatientsNumbers' }

        newCasesPatientsNumbers = await callMSWithTimeoutAndRetry(this.caseClient,
          casePatientsNumberPattern,
          body,
          Component.TENANTS)
      }

      return { newPatientsNumbers, newCasesPatientsNumbers }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createAuditTrailAtlasSearchIndex () {
    try {
      const pattern = { role: 'audit-trail', cmd: 'createAtlasSearchIndex' }

      const response = await callMSWithTimeoutAndRetry(this.logClient,
        pattern,
        {},
        Component.TENANTS)

      return response
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
