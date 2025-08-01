import { Component, ETenantDatabases, ETenantJobTypes, TTenantDataFile, TTenantJob, callMSWithTimeoutAndRetry, dateTimeSafeString, sleep, tenantDataFileName } from '@smambu/lib.constantsjs'
import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'
import { NAMES } from 'src/utilities/constants'
import { LoggingService, checkDataJson, substituteIds } from '@smambu/lib.commons-be'
import { ClientProxy } from '@nestjs/microservices'
import { Inject } from '@nestjs/common'
import { format } from 'date-fns'
import { Model } from 'mongoose'
import { Tenant, TenantDocument } from 'src/schemas/tenant.schema'
import { InjectModel } from '@nestjs/mongoose'

@Processor(NAMES.CopierQueue)
export class TenantExporterService {
  private readonly databases: { label: ETenantDatabases, client: ClientProxy, export: boolean }[]
  constructor (
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @Inject('ROLE_CLIENT') private readonly rolesClient: ClientProxy,
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('ANAGRAPHICS_CLIENT') private readonly anagraphicsClient: ClientProxy,
    @Inject('BUCKET_CLIENT') private readonly bucketClient: ClientProxy,
    @Inject('CONTRACTS_CLIENT') private readonly contractsClient: ClientProxy,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notificationsClient: ClientProxy,
    @Inject('OR_MANAGEMENT_CLIENT') private readonly orManagementClient: ClientProxy,
    @Inject('PATIENTS_ANAGRAPHICS_CLIENT') private readonly patientsAnagraphicsClient: ClientProxy,
    @Inject('CASES_CLIENT') private readonly caseClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.TENANTS)
    this.databases = [
      // { label: 'admins', client: null, export: false }, // not necessary
      // { label: 'configs', client: null, export: false }, // not necessary
      // { label: 'local', client: null, export: false }, // not necessary
      { label: ETenantDatabases.ANAGRAPHICS, client: this.anagraphicsClient, export: true },
      { label: ETenantDatabases.BUCKET, client: this.bucketClient, export: true },
      { label: ETenantDatabases.CONTRACTS, client: this.contractsClient, export: true },
      { label: ETenantDatabases.LOGS, client: this.logClient, export: false },
      { label: ETenantDatabases.NOTIFICATIONS, client: this.notificationsClient, export: false },
      { label: ETenantDatabases.OR_MANAGEMENT, client: this.orManagementClient, export: true },
      { label: ETenantDatabases.PATIENTS, client: this.patientsAnagraphicsClient, export: true },
      { label: ETenantDatabases.ROLES, client: this.rolesClient, export: true },
      { label: ETenantDatabases.CASES, client: this.caseClient, export: true },
      {
        label: ETenantDatabases.SYSTEM_CONFIGURATIONS,
        client: this.systemConfigurationClient,
        export: true
      },
      { label: ETenantDatabases.USERS, client: this.usersClient, export: true },
    ]
  }

  async copyTenantFunction (data: { targetTenantId: string }) {
    const tenantData = {} as Record<string, Record<string, any[]>>

    await Promise.all(this.databases
      .filter(service => service.export)
      .map(async service => {
        const pattern = { role: service.label, cmd: 'exportData' }

        const payloadData = { tenantId: data.targetTenantId }

        const serviceData = await callMSWithTimeoutAndRetry(service.client,
          pattern,
          payloadData,
          Component.TENANTS)
        tenantData[service.label] = serviceData
      }))

    return tenantData
  }

  async exportTenantFunction (data: { targetTenantId: string }) {
    try {
      const exportsFolder = process.env.VITE_EXPORTS_FOLDER
      await this.loggingService.logInfo(`Exporting tenant ${data.targetTenantId}`)
      const tenantDoc = await this.tenantModel.findById(data.targetTenantId)

      await this.tenantModel.updateOne(
        { _id: data.targetTenantId },
        { isExporting: true }
      )

      const tenantData = await this.copyTenantFunction(data)

      const dateTimeString = format(new Date(), dateTimeSafeString)
      const tenantDataFileId = `${data.targetTenantId}/${tenantDataFileName}`

      const uploadbase64Pattern = { role: 'file', cmd: 'uploadBase64' }

      const uploadbase84PayloadData = {
        fileEncoded: Buffer.from(JSON.stringify(tenantData)).toString('base64'),
        fileName: tenantDataFileId,
        fileType: 'application/json',
        bypassTenant: true,
      }

      await callMSWithTimeoutAndRetry(this.bucketClient,
        uploadbase64Pattern,
        uploadbase84PayloadData,
        Component.TENANTS)

      const folderName = `${exportsFolder}/${data.targetTenantId}/${dateTimeString}`

      const zipDirPattern = { role: 'file', cmd: 'zipDirectory' }

      const zipDirPayloadData = {
        bypassTenant: true,
        sourceDir: data.targetTenantId,
        targetDir: folderName,
      }

      const zipFileId = await callMSWithTimeoutAndRetry(this.bucketClient,
        zipDirPattern,
        zipDirPayloadData,
        Component.TENANTS)

      await this.tenantModel.updateOne(
        { _id: data.targetTenantId },
        {
          isExporting: false,
          dataFiles: [
            ...tenantDoc.dataFiles,
            {
              zipFileId,
              createdAt: new Date(),
            }
          ] as TTenantDataFile[]
        }
      )

      const deleteFilesPattern = { role: 'file', cmd: 'deleteFiles' }

      const deleteFilesPayloadData = {
        bypassTenant: true,
        fileIds: [tenantDataFileId]
      }

      await callMSWithTimeoutAndRetry(this.bucketClient,
        deleteFilesPattern,
        deleteFilesPayloadData,
        Component.TENANTS)

      await this.loggingService.logInfo(`Tenant ${data.targetTenantId} exported`)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    } finally {
      await this.tenantModel.updateOne(
        { _id: data.targetTenantId },
        { isExporting: false }
      )
    }
  }

  async resetTenantFunction (data: TTenantJob) {
    try {
      await this.loggingService.logInfo(`Resetting tenant ${data.targetTenantId}`)
      let dataFileId = null
      let tenantData = null

      await this.tenantModel.updateOne(
        { _id: data.targetTenantId },
        { isResetting: true }
      )

      const deleteDirPattern = { role: 'file', cmd: 'deleteDirectory' }

      const deleteDirPayloadData = {
        bypassTenant: true,
        targetDir: data.targetTenantId
      }

      await callMSWithTimeoutAndRetry(this.bucketClient,
        deleteDirPattern,
        deleteDirPayloadData,
        Component.TENANTS)

      if (data.sourceTenantId != null) {
        const copyDirectoryPattern = { role: 'file', cmd: 'copyDirectory' }

        const copyDirPayloadData = {
          bypassTenant: true,
          sourceDir: data.sourceTenantId,
          targetDir: data.targetTenantId,
        }

        await callMSWithTimeoutAndRetry(this.bucketClient,
          copyDirectoryPattern,
          copyDirPayloadData,
          Component.TENANTS)

        tenantData = await this.copyTenantFunction({ targetTenantId: data.sourceTenantId })
      } else {
        const unzipDirPattern = { role: 'file', cmd: 'unzipTargetDirectory' }

        const unzipDirPayloadData = {
          zipFileId: data.zipFileId,
          targetDir: data.targetTenantId,
          bypassTenant: true,
        }

        await callMSWithTimeoutAndRetry(this.bucketClient,
          unzipDirPattern,
          unzipDirPayloadData,
          Component.TENANTS)

        await sleep(1000)

        dataFileId = `${data.targetTenantId}/${tenantDataFileName}`

        const downloadBase64Pattern = { role: 'file', cmd: 'downloadBase64' }

        const downloadBase64PayloadData = {
          fileId: dataFileId, bypassTenant: true
        }
        const encodedData = await callMSWithTimeoutAndRetry(this.bucketClient,
          downloadBase64Pattern,
          downloadBase64PayloadData,
          Component.TENANTS)

        const dataString = Buffer.from(encodedData, 'base64').toString('utf-8')
        tenantData = JSON.parse(dataString)
      }

      checkDataJson(tenantData)

      const newIds = {} as Record<string, Record<string, Record<string, string>>>

      await Promise.all(this.databases
        .map(async service => {
          try {
            const generateIdsPattern = { role: service.label, cmd: 'generateIds' }

            const generateIdsPayloadData = {
              tenantId: data.targetTenantId,
              data: tenantData[service.label]
            }

            const serviceNewIds = await callMSWithTimeoutAndRetry(service.client,
              generateIdsPattern,
              generateIdsPayloadData,
              Component.TENANTS)

            newIds[service.label] = serviceNewIds
          } catch (e) {
            console.error(e)
            console.error(service.label)
            throw e
          }
        }))

      const newIdsDataJSON = substituteIds(tenantData, newIds)

      await Promise.all(this.databases
        .map(async service => {
          try {
            const resetDataPattern = { role: service.label, cmd: 'resetData' }

            const resetDataPayloadData = {
              tenantId: data.targetTenantId,
              data: newIdsDataJSON[service.label]
            }

            await callMSWithTimeoutAndRetry(service.client,
              resetDataPattern,
              resetDataPayloadData,
              Component.TENANTS)
          } catch (e) {
            console.error(e)
            console.error(service.label)
            throw e
          }
        }))

      if (dataFileId != null) {
        const deleteFilesPattern = { role: 'file', cmd: 'deleteFiles' }

        const deleteFilesPayloadData = {
          bypassTenant: true,
          fileIds: [dataFileId, data.zipFileId]
        }

        await callMSWithTimeoutAndRetry(this.bucketClient,
          deleteFilesPattern,
          deleteFilesPayloadData,
          Component.TENANTS)
      }
      await this.loggingService.logInfo(`Tenant ${data.targetTenantId} resetted`)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    } finally {
      await this.tenantModel.updateOne(
        { _id: data.targetTenantId },
        { isResetting: false }
      )
    }
  }

  @Process()
  async processQueue (job: Job<TTenantJob>) {
    try {
      global.als.enterWith({ bypassTenant: true })

      const logMessage = 'Starting tenantslog'
      this.loggingService.logInfo(logMessage, false)

      const data = job.data // here goes the goods
      if (data.type === ETenantJobTypes.EXPORT) {
        return this.exportTenantFunction(data)
      } else if (data.type === ETenantJobTypes.RESET) {
        return this.resetTenantFunction(data)
      } else {
        // eslint-disable-next-line no-console
        console.log('Not implemented', data)
        return null
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
