import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { RW_PLUGIN_TAG, SOURCE_SCHEMAS, tContext, tFragments, tProxyDynamicFields } from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'

export type ProxyDocument = HydratedDocument<Proxy>;

@Schema({
  timestamps: true,
  pluginTags: [RW_PLUGIN_TAG, SOURCE_SCHEMAS.PROXY]
})
export class Proxy {
  @Prop({ type: Object })
  context: tContext

  @Prop()
  contextKey: string

  @Prop({
    type: 'string',
    ref: 'URDomain',
    required: true
  })
  domainId: string

  @Prop({ type: Object })
  fragments: tFragments | undefined

  @Prop({ type: Object })
  dynamicFields: tProxyDynamicFields

  @Prop()
  tenantId: string
}

export const ProxySchema = generateSchemaWithMiddlewares(Proxy)

ProxySchema.index({ contextKey: 1, domainId: 1, tenantId: 1 }, { unique: true })

// Middleware for domainId validation
ProxySchema.pre('save', async function (next) {
  const newProxyDoc = this as Proxy
  const urDomainExists = await this.model('URDomain').exists({
    domainId: newProxyDoc.domainId,
    tenantId: newProxyDoc.tenantId
  })

  if (!urDomainExists)
    return next(new Error(`DomainId ${newProxyDoc.domainId} does not exist`))

  next()
})

ProxySchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.PROXY })

ProxySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
