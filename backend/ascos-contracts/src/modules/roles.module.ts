import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AnesthesiologistOPStandardController } from 'src/controllers'
import { ContractsController } from 'src/controllers/contracts.controller'
import { AnesthesiologistOpStandard, AnesthesiologistOpStandardSchema } from 'src/schemas/anesthesiologistOPStandard.schema'
import { Contract, ContractSchema } from 'src/schemas/contracts.schema'
import {
  SurgerySlot,
  SurgerySlotSchema,
} from 'src/schemas/surgerySlots.schema'
import { AnesthesiologistOpStandardService } from 'src/services'
import { ContractsService } from 'src/services/contracts.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: SurgerySlot.name, schema: SurgerySlotSchema },
      { name: AnesthesiologistOpStandard.name, schema: AnesthesiologistOpStandardSchema }
    ]),
  ],
  controllers: [ContractsController, AnesthesiologistOPStandardController],
  providers: [ContractsService, AnesthesiologistOpStandardService],
})
export class ContractsModule {}
