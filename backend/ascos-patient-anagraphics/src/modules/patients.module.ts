import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PatientsController } from 'src/controllers/patients.controller'
import { Patient, PatientSchema } from 'src/schemas/patient.schema'
import { PatientsService } from 'src/services/patients.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class RolesModule {}
