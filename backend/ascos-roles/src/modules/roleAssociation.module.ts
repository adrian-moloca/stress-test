import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
  RoleAssociation,
  RoleAssociationSchema,
} from '../schemas/roleAssociation.schema'
import { RoleAssociationController } from '../controllers/roleAssociation.controller'
import { RoleAssociationService } from '../services'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleAssociation.name, schema: RoleAssociationSchema },
    ]),
  ],
  controllers: [RoleAssociationController],
  providers: [RoleAssociationService],
})
export class RoleAssociationModule {}
