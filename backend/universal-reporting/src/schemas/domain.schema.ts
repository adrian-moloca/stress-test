import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { SOURCE_SCHEMAS, tCondition, tField, tTranslatableString, tTrigger } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type URDomainDocument = HydratedDocument<URDomain>;

@Schema({ timestamps: true })
export class URDomain {
  @Prop({ unique: true })
  domainId: string

  @Prop({ type: Object })
  domainName: tTranslatableString

  @Prop({ type: Object })
  domainDescription: tTranslatableString

  @Prop({ type: Object })
  trigger: tTrigger

  @Prop({ type: [Object] })
  proxyFields: tField[]

  @Prop({ type: Object })
  canAccessProxies: tCondition

  @Prop({ type: Object })
  canAccessProxyDetails: tCondition

  @Prop({ type: Object })
  canEditProxy: tCondition

  // TODO: this class will probably grow to include other fields from the "father"
  // type
  @Prop()
  tenantId: string
}

export const URDomainSchema = generateSchemaWithMiddlewares(URDomain)

URDomainSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.DOMAINS })

URDomainSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
