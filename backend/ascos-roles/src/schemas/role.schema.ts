import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { ICapabilityName, I_PERMISSIONS_DOMAINS_SCOPES, I_PERMISSION_DOMAINS, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop()
  name: string

  @Prop()
  scope: I_PERMISSIONS_DOMAINS_SCOPES

  @Prop({ type: Object })
  domain_scopes: {
    [_key in I_PERMISSION_DOMAINS]?: I_PERMISSIONS_DOMAINS_SCOPES;
  }

  @Prop()
  capabilities: ICapabilityName[]

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  tenantId: string
}

export const RoleSchema = generateSchemaWithMiddlewares(Role)

RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true })

RoleSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.ROLES
})

RoleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
