import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CasesController } from 'src/controllers/cases.controller'
import { Case, CaseSchema } from 'src/schemas/cases.schema'
import { CasesService } from 'src/services/cases.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Case.name, schema: CaseSchema }]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
