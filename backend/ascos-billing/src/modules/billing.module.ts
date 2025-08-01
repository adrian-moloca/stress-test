import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BillingController } from 'src/controllers'
import { CaseBilling, CaseBillingSchema } from 'src/schemas/casebilling.schema'
import { BillingService } from 'src/services'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CaseBilling.name, schema: CaseBillingSchema }]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})

export class BillingModule { }
