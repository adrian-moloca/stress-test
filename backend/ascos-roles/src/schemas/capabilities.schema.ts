import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { ICapabilityName, I_PERMISSIONS_DOMAINS_SCOPES, I_PERMISSION_DOMAINS, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CapabilitiesDocument = HydratedDocument<Capabilities>;

@Schema()
export class Capabilities {
  @Prop()
  capabilities: ICapabilityName[]

  @Prop({ type: Object })
  domain_scopes: {
    [_key in I_PERMISSION_DOMAINS]?: I_PERMISSIONS_DOMAINS_SCOPES;
  }

  @Prop()
  tenantId: string
}

export const CapabilitiesSchema = generateSchemaWithMiddlewares(Capabilities)

CapabilitiesSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.CAPABILITIES
})

CapabilitiesSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
