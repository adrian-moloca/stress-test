import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Seeder } from 'nestjs-seeder'
import { Credential } from '../../schemas/credentials.schema'
import * as bcrypt from 'bcryptjs'
@Injectable()
export class UsersSeeder implements Seeder {
  constructor (
    @InjectModel(Credential.name) private readonly credentials: Model<Credential>
  ) {}

  async seed (): Promise<any> {
    try {
      const password = await bcrypt.hash(process.env.DEFAULT_SUPER_ADMIN_PASSWORD, 10)
      const credentialSeed = {
        email: process.env.DEFAULT_SUPER_ADMIN_EMAIL,
        password,
        verified: true,
        isSuperAdmin: true,
      }

      const credentials = await this.credentials.findOne({ email: credentialSeed.email })
      if (!credentials) {
        const credentials = await this.credentials.create(credentialSeed)

        // eslint-disable-next-line no-console
        console.log('credentials created', credentials)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SEED ERROR::', e)
    }
  }

  async drop (): Promise<any> {
    return this.credentials.deleteMany({})
  }
}
