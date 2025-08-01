import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TenantsController } from 'src/controllers/tenants.controller'
import { Tenant, TenantSchema } from 'src/schemas/tenant.schema'
import { TenantService } from 'src/services/tenant.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
  ],
  controllers: [TenantsController],
  providers: [TenantService],
})
export class RolesModule {}
