import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SuperAdminFilesController } from 'src/controllers'
import { FilesController } from 'src/controllers/files.controller'
import { File, FileSchema } from 'src/schemas/file.schema'
import { FileService } from 'src/services/files.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
  ],
  controllers: [FilesController, SuperAdminFilesController],
  providers: [FileService],
})
export class RolesModule {}
