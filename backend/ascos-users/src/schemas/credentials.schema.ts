import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { localEventsPlugin } from '@smambu/lib.commons-be'
import { SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'

export type CredentialDocument = Credential &
  Document & {
    passwordMatches: (string) => boolean
  }

@Schema({ timestamps: true })
export class Credential {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string

  @Prop({ default: '' })
  password: string

  @Prop()
  verified: boolean

  @Prop({ default: null })
  verifiedAt: Date | null

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop()
  pendingResetToken: string

  @Prop()
  isSuperAdmin: boolean
}

export const CredentialSchema = SchemaFactory.createForClass(Credential)

CredentialSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.CREDENTIALS
})

CredentialSchema.pre<CredentialDocument>('save', async function save (next) {
  try {
    if (!this.isNew && this.isModified('isSuperAdmin'))
      throw new Error('You cannot change the super admin status')

    // TODO : i need to create a super admin in the seeder
    // if (this.isNew && this.isSuperAdmin) {
    //   throw new Error('You cannot create a super admin')
    // }

    return next()
  } catch (err) {
    next(err)
  }
})

CredentialSchema.method({
  passwordMatches (password) {
    return bcrypt.compare(password, (this as CredentialDocument).password)
  },
})

CredentialSchema.virtual('credentialId').get(function () {
  return this._id.toHexString()
})
