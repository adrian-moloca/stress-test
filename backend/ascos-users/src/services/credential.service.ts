import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  Component,
  parseErrorMessage,
  auditTrailUpdate,
  EntityType,
  IGetCredentialDataResponse,
  IUser,
} from '@smambu/lib.constantsjs'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { Credential, CredentialDocument } from 'src/schemas/credentials.schema'
import { User, UserDocument } from 'src/schemas/user.schema'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { LoggingService, SendgridService } from '@smambu/lib.commons-be'

@Injectable()
export class CredentialService {
  constructor (
    @InjectModel(Credential.name) private credentialModel: Model<CredentialDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    private sendgridService: SendgridService,
    private jwtService: JwtService,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.USERS)
  }

  async getCredentialsData (emails: string[]): Promise<IGetCredentialDataResponse[]> {
    try {
      const credentials = await this.credentialModel.find({
        email: { $in: emails }
      })

      return credentials.map(credential => ({
        email: credential.email,
        verified: credential.verified
      }))
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findByEmail ({ email }: { email: string }): Promise<CredentialDocument> {
    try {
      const credential = this.credentialModel.findOne({ email })

      if (!credential)
        throw new BadRequestException('error_credentialNotExists')

      return credential
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createOne ({ email }: { email: string }): Promise<{ verified: boolean }> {
    const credential = await this.findByEmail({ email })
    if (credential)
      return { verified: credential.verified }

    await this.credentialModel.create({
      email,
      password: '',
      isSuperAdmin: false,
      verified: false,
      verifiedAt: null,
    })

    return { verified: false }
  }

  async verifyEmail (email: string): Promise<CredentialDocument> {
    try {
      const credential: CredentialDocument = await this.credentialModel.findOne({
        email
      })

      if (!credential)
        throw new BadRequestException('error_credentialNotExists')

      const newCredential = await this.credentialModel.findOneAndUpdate(
        { email },
        { verified: true, verifiedAt: new Date() },
        { new: true }
      )

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: credential?.id,
        entityType: EntityType.CREDENTIAL,
        prevObj: credential.toObject(),
        newObj: newCredential.toObject(),
        bypassTenant: true,
      })

      return credential
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async requestResetUserPassword (id: string, user: IUser): Promise<void> {
    try {
      const userToReset = await this.userModel.findById(id)

      const credential: CredentialDocument = await this.credentialModel.findOne({
        email: userToReset.email
      })
      if (!credential)
        throw new BadRequestException('error_credentialNotExists')

      const token = this.jwtService.sign({ id: userToReset.id, email: userToReset.email }, { expiresIn: '10m' })
      const newCredential = await this.credentialModel.findOneAndUpdate(
        { email: userToReset.email },
        { pendingResetToken: token },
        { new: true }
      )

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CREDENTIAL,
        prevObj: credential.toObject(),
        newObj: newCredential.toObject(),
      })

      await this.sendgridService.sendRequestResetPasswordEmail(userToReset,
        token,
        userToReset.email)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetPassword (email: string, password: string): Promise<boolean> {
    try {
      const credential: CredentialDocument = await this.credentialModel.findOne({
        email
      })
      if (!credential)
        throw new BadRequestException('error_credentialNotExists')

      const passwordHash = await bcrypt.hash(password, 10)
      const newCredential = await this.credentialModel.findOneAndUpdate(
        { email },
        { pendingResetToken: null, password: passwordHash },
        { new: true }
      )

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: credential.id,
        entityType: EntityType.CREDENTIAL,
        prevObj: credential.toObject(),
        newObj: newCredential.toObject(),
        bypassTenant: true,
      })

      credential.password = await bcrypt.hash(password, 10)
      credential.pendingResetToken = undefined
      await credential.save()

      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setPendingResetToken ({ token, email }: { token: string; email: string }) {
    try {
      if (!token)
        throw new BadRequestException('error_noPendingResetToken')

      const credential: CredentialDocument = await this.credentialModel.findOne({
        email
      })
      if (!credential)
        throw new BadRequestException('error_credentialNotExists')

      const newCredential = await this.credentialModel.findOneAndUpdate(
        { email },
        { pendingResetToken: token },
        { new: true }
      )

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: credential.id,
        entityType: EntityType.CREDENTIAL,
        prevObj: credential.toObject(),
        newObj: newCredential.toObject(),
        bypassTenant: true,
      })
    } catch (error) {
      console.error(error)

      const message = parseErrorMessage(error)
      throw new RpcException(message)
    }
  }

  async createOneTestEnv ({ email }: { email: string }): Promise<{ verified: boolean }> {
    const credential = await this.findByEmail({ email })
    if (credential)
      return { verified: credential.verified }

    await this.credentialModel.create({
      email,
      password: process.env.TEST_USER_PASSWORD,
      isSuperAdmin: false,
      verified: true,
      verifiedAt: new Date(),
    })

    return { verified: false }
  }
}
