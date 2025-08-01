import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OrManagementController } from 'src/controllers'
import { OrSchedulingController } from 'src/controllers/orScheduling.controller'
import {
  OperatingRoomClass,
  OperatingRoomSchema,
} from 'src/schemas/orManagement.schema'
import { OrManagementService } from 'src/services'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OperatingRoomClass.name, schema: OperatingRoomSchema },
    ]),
  ],
  controllers: [OrManagementController, OrSchedulingController],
  providers: [OrManagementService],
})
export class ContractsModule {}
