import { GetFilesInfoDto, parseErrorMessage, backendConfiguration } from '@smambu/lib.constantsjs'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Query,
  Res,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { FileService } from 'src/services/files.service'
import { AllExceptionsFilter, LoggingInterceptor, MPInterceptor, exportData } from '@smambu/lib.commons-be'
/* global Express */

async function streamToJson (readableStream) {
  let data = ''

  for await (const chunk of readableStream)
    data += chunk

  return JSON.parse(data)
}

@UseInterceptors(LoggingInterceptor)
@Controller('files')
export class FilesController {
  constructor (private readonly fileService: FileService) { }

  @Post('getFilesInfo')
  @UseFilters(AllExceptionsFilter)
  async getFilesInfo (
    @Body() data: GetFilesInfoDto,
  ) {
    try {
      const response = this.fileService.getFilesInfo(data?.filesIds)
      return response
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Delete('deleteFiles')
  @UseFilters(AllExceptionsFilter)
  async deleteFiles (
    @Body() data: string[],
  ) {
    try {
      const response = this.fileService.deleteFiles(data)
      return response
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'deleteFiles' })
  async deleteFilesMP ({ fileIds }: { fileIds: string[] }) {
    try {
      const response = this.fileService.deleteFiles(fileIds)
      return response
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'upload' })
  async upload ({
    file,
    userId,
    fileName,
  }: {
    file: Express.Multer.File;
    fileName: string;
    userId: string;
  }) {
    try {
      if (!file) throw new BadRequestException('bucket_noFileProvided_error')
      const res = await this.fileService.uploadFile({
        file,
        userId,
        fileName,
      })
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'uploadBase64' })
  async uploadBase64 ({
    fileEncoded,
    fileName,
    fileType,
  }: {
    fileEncoded: string;
    fileName: string;
    fileType?: string;
  }) {
    try {
      if (!fileEncoded) throw new BadRequestException('bucket_noFileProvided_error')
      if (!fileName) throw new BadRequestException('bucket_noFileNameProvided_error')

      const res = await this.fileService.uploadBase64(fileEncoded, fileName, fileType)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getFile (@Query() query, @Res() res) {
    try {
      const file = await this.fileService.getFile(query.id)
      file.pipe(res)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Get('/commons')
  @UseFilters(AllExceptionsFilter)
  async getCommonFile (@Query() query, @Res() res) {
    try {
      global.als.enterWith({ bypassTenant: true })
      const commonsFolder = process.env.VITE_COMMONS_FOLDER

      const file = await this.fileService.getFile(`${commonsFolder}/${query.id}`)
      file.pipe(res)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'downloadBase64' })
  async download ({ fileId }: { fileId: string }) {
    try {
      const file = await this.fileService.getFile(fileId)

      const fileData = await streamToJson(file)

      return await Buffer.from(JSON.stringify(fileData)).toString('base64')
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'deleteDirectory' })
  async deleteDirectoryMP ({
    targetDir
  }: {
    targetDir: string;
  }) {
    try {
      const res = await this.fileService.deleteDirectory(targetDir)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'copyDirectory' })
  async copyDirectoryMP ({
    sourceDir,
    targetDir
  }: {
    sourceDir: string,
    targetDir: string;
  }) {
    try {
      const res = await this.fileService.copyDirectory(sourceDir, targetDir)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'zipDirectory' })
  async zipDirectoryMP ({
    sourceDir,
    targetDir
  }: {
    sourceDir: string,
    targetDir: string;
  }) {
    try {
      const res = await this.fileService.zipDirectory(sourceDir, targetDir)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'zipPDFArchive' })
  async zipPDFArchiveyMP ({
    sourceFiles,
    maxArchiveSize,
    maxFilesPerArchive
  }: {
    sourceFiles: string[],
    maxArchiveSize: number,
    maxFilesPerArchive:number
  }) {
    try {
      const res = await this.fileService.zipPDFArchive(sourceFiles,
        maxArchiveSize,
        maxFilesPerArchive)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'file', cmd: 'unzipTargetDirectory' })
  async unzipTargetDirectoryMP ({
    zipFileId,
    targetDir
  }: {
    zipFileId: string,
    targetDir: string
  }) {
    try {
      const res = await this.fileService.unzipTargetDirectory(zipFileId, targetDir)

      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bucket', cmd: 'exportData' })
  async mpExportData () {
    try {
      return exportData(backendConfiguration().mongodb_uri_bucket)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bucket', cmd: 'generateIds' })
  async mpGenerateIds ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.fileService.generateIds(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'bucket', cmd: 'resetData' })
  async mpResetData ({
    data
  }: {
    data: Record<string, any[]>
  }) {
    try {
      return this.fileService.resetData(data)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }
}
