import {
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { File, FileDocument } from '../schemas/file.schema'
import { Model } from 'mongoose'
import { CaseFileReference, Component, callMSWithTimeoutAndRetry, systemConfigurationSections } from '@smambu/lib.constantsjs'
import FilesDriver from 'src/FilesDriver/FilesDriver'
import { FilesDriverStrategies } from 'src/FilesDriver/FilesDriverStrategies'
import { ClientProxy } from '@nestjs/microservices'
import { EnvConfigsService, LoggingService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'

/* global Express */

@Injectable()
export class FileService {
  private models: { model: Model<any>; label: string }[]
  constructor (
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,

    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,

    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,

    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.BUCKET)
    this.models = [
      { model: this.fileModel, label: 'files' },
    ]
  }

  fileDriver = new FilesDriver(
    new FilesDriverStrategies[process.env.BUCKET_DRIVER](),
  )

  getCompleteFileId (fileId: string) {
    const store = global.als.getStore()
    const tenantId = store.tenantId

    if (store.bypassTenant) return fileId

    if (!tenantId)
      throw new Error('TenantId not found')

    return `${tenantId}/${fileId}`
  }

  async uploadFile ({
    file,
    userId,
    fileName,
    skipDimensionsCheck,
  }: {
    file: Express.Multer.File;
    userId: string;
    fileName: string;
    skipDimensionsCheck?: boolean;
  }) {
    try {
      if (!skipDimensionsCheck) {
        const pattern = { role: 'SystemConfigurationSection', cmd: 'get' }

        const payloadData = {
          section: systemConfigurationSections.FILE_CONFIGS
        }
        const fileConfigs = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
          pattern,
          payloadData,
          Component.BILLING)

        const fileSizeInMB = file.size ? file.size / (1024 * 1024) : null
        const fileSizeUploadLimit = fileConfigs?.data?.sizeUploadLimit
        if (fileSizeUploadLimit != null && fileSizeInMB > fileSizeUploadLimit)
          throw new HttpException('file_too_big_error', 400)
      }

      await this.fileDriver.upload(file, this.getCompleteFileId(fileName))
      const fileData = {
        name: file.originalname,
        type: file.mimetype,
        uploadByUserId: userId,
        fileId: fileName,
      }
      const newFile = await this.fileModel.create(fileData)
      return newFile
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async uploadBase64 (fileEncoded: string, fileName: string, fileType?: string) {
    try {
      await this.fileDriver.uploadBase64(fileEncoded, this.getCompleteFileId(fileName))
      const fileData = {
        name: fileName,
        type: fileType ?? 'application/pdf',
        fileId: fileName,
      }
      let file = await this.fileModel.findOne({
        fileId: fileName,
      })
      if (!file)
        file = await this.fileModel.create(fileData)
      else
        file = await this.fileModel.findOneAndUpdate(
          {
            fileId: fileName,
          },
          fileData,
          {
            new: true,
          },
        )

      return file
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getFile (id: string) {
    try {
      const file = await this.fileDriver.get(this.getCompleteFileId(id))
      return file
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getFilesInfo (filesIds: CaseFileReference[]) {
    try {
      const files = this.fileModel.find({
        fileId: {
          $in: filesIds.map(file => file.fileId),
        },
      })
      return files
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteFiles (filesIds: string[]) {
    try {
      const deletedFiles = []
      await Promise.all(filesIds.map(async fileId => {
        await this.fileDriver.delete(this.getCompleteFileId(fileId))
        deletedFiles.push(fileId)
      }))

      await this.fileModel.deleteMany({
        fileId: {
          $in: deletedFiles,
        },
      })

      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteDirectory (directory: string) {
    try {
      await this.fileDriver.deleteDirectory(this.getCompleteFileId(directory))
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async copyDirectory (sourceDir: string, targetDir: string) {
    try {
      const completeSourceDir = this.getCompleteFileId(sourceDir)
      const completeTargetDir = this.getCompleteFileId(targetDir)
      const files = await this.fileDriver.cloneDir(completeSourceDir, completeTargetDir)

      return files
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async zipDirectory (sourceDir: string, targetDir: string) {
    try {
      const completeSourceDir = this.getCompleteFileId(sourceDir)
      const completeTargetDir = this.getCompleteFileId(targetDir)
      const files = await this.fileDriver.zipDirectory(completeSourceDir, completeTargetDir)

      return files
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async unzipTargetDirectory (zipFileId: string, targetDir: string) {
    try {
      const completeZipDir = this.getCompleteFileId(zipFileId)
      const completeTargetDir = this.getCompleteFileId(targetDir)
      const files = await this.fileDriver.unzipDirectory(completeZipDir, completeTargetDir)

      return files
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async zipPDFArchive (sourceFiles: string[], maxArchiveSize: number, maxFilesPerArchive:number) {
    try {
      const translator = await this.envConfigClient.getTranslator()

      if (!translator)
        throw new Error('Translator not found')

      const completeSourceFiles = sourceFiles.map(this.getCompleteFileId)

      return this.fileDriver.zipPDFArchive(completeSourceFiles,
        maxArchiveSize,
        maxFilesPerArchive,
        translator.fromLabel)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
