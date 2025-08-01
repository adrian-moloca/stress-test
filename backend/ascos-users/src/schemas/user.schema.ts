import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares, localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type UserDocument = User & Document

@Schema({ timestamps: false, _id: false })
export class AddressSchema {
  @Prop()
  street: string

  @Prop()
  houseNumber: string

  @Prop()
  postalCode: string

  @Prop()
  city: string

  @Prop()
  country: string
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    default: () => `user_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop()
  title: string

  @Prop()
  firstName: string

  @Prop()
  lastName: string

  @Prop({ required: true, lowercase: true })
  email: string

  @Prop()
  phoneNumber: string

  @Prop({ type: Date })
  birthDate: Date

  @Prop({ type: AddressSchema })
  address: {
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
  }

  @Prop()
  active: boolean

  @Prop({ default: null })
  activatedAt: Date | null

  @Prop([{ type: String }])
  roleAssociations: string[]

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  debtorNumber: string

  @Prop()
  practiceName: string

  @Prop()
  tenantId: string
}

export const UserSchema = generateSchemaWithMiddlewares(User)

UserSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.USERS
})

UserSchema.index({
  email: 1,
  tenantId: 1
}, { name: 'Unique_email_tenant_1', unique: true })

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})
