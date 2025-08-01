import { parseErrorMessage } from '@smambu/lib.constantsjs'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common'
import { FileService } from 'src/services/files.service'
import { AllExceptionsFilter, LoggingInterceptor } from '@smambu/lib.commons-be'
import { FileInterceptor } from '@nestjs/platform-express'

/* global Express */

@UseInterceptors(LoggingInterceptor)
@Controller('files')
export class SuperAdminFilesController {
  constructor (private readonly fileService: FileService) { }

  @Get('superAdmin')
  @UseFilters(AllExceptionsFilter)
  async getFile (@Query() query, @Res() res) {
    try {
      const exportsFolder = process.env.VITE_EXPORTS_FOLDER

      global.als.enterWith({ bypassTenant: true })
      const mainFolder = query.id.split('/')[0]
      if (mainFolder !== exportsFolder)
        throw new HttpException('Unauthorized', 401)

      const file = await this.fileService.getFile(query.id)
      file.pipe(res)
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }

  @Post('superAdmin')
  @UseFilters(AllExceptionsFilter)
  @UseInterceptors(FileInterceptor('file'))
  async create (
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
    @Body() data: { fileName: string },
  ) {
    try {
      const exportsFolder = process.env.VITE_EXPORTS_FOLDER

      global.als.enterWith({ bypassTenant: true })
      const mainFolder = data.fileName.split('/')[0]

      if (mainFolder !== exportsFolder)
        throw new HttpException('Unauthorized', 401)

      if (!file) throw new BadRequestException('bucket_noFileProvided_error')
      const res = await this.fileService.uploadFile({
        file,
        userId: request.email,
        fileName: data.fileName,
        skipDimensionsCheck: true,
      })
      return res
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new HttpException(message, error?.status ?? 500)
    }
  }
}
