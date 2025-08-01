import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type RoleAssociationDocument = HydratedDocument<RoleAssociation>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, transform: (_doc, ret) => ret },
  toObject: { virtuals: true, transform: (_doc, ret) => ret }
})
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

  // users associated to the role
  @Prop([
    {
      type: String,
      ref: 'User',
    },
  ])
  users: string[]

  @Prop()
  tenantId: string

  get id (): string {
    return this._id
  }
}

export const RoleAssociationSchema = generateSchemaWithMiddlewares(RoleAssociation)

RoleAssociationSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.ROLE_ASSOCIATION
})
