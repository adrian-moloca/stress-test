import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type RoleAssociationDocument = HydratedDocument<RoleAssociation>;

@Schema({ timestamps: true })
export class RoleAssociation {
  @Prop({
    type: String,
    default: () => `ra_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop({
    type: String,
    ref: 'Role',
  })
  role: string

  @Prop([
    {
      type: String,
      ref: 'User',
    },
  ])
  users: string[]

  @Prop()
  tenantId: string
}

export const RoleAssociationSchema = generateSchemaWithMiddlewares(RoleAssociation)

RoleAssociationSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.ROLE_ASSOCIATION_USER
})

RoleAssociationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.password
    return ret
  },
})
