import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CapabilitiesController } from '../controllers/capabilities.controller'
import { Capabilities, CapabilitiesSchema } from '../schemas/capabilities.schema'
import { CapabilitiesService } from '../services/capabilities.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Capabilities.name, schema: CapabilitiesSchema },
    ]),
  ],
  controllers: [CapabilitiesController],
  providers: [CapabilitiesService],
})
export class CapabilitiesModule {}
