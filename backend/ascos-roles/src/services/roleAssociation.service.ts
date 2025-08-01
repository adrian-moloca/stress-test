import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import {
  RoleAssociation,
  RoleAssociationDocument,
} from '../schemas/roleAssociation.schema'
import { Component } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class RoleAssociationService {
  constructor (
    @InjectModel(RoleAssociation.name)
    private roleAssociationModel: Model<RoleAssociationDocument>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.ROLES)
  }

  async findOne (id: string) {
    try {
      return this.roleAssociationModel.findById(id)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findAll () {
    try {
      return this.roleAssociationModel.find()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  find (filters: FilterQuery<RoleAssociation>): Promise<RoleAssociation[]> {
    return this.roleAssociationModel.find(filters).exec()
  }

  async findWithRole (filters: FilterQuery<RoleAssociation>): Promise<any[]> {
    const res = await this.roleAssociationModel.find(filters).populate({ path: 'role' })
    return res
  }

  async createOne (data: any) {
    try {
      const res = await this.roleAssociationModel.create(data)
      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteOne (id: string): Promise<any> {
    try {
      return await this.roleAssociationModel.deleteOne({ _id: id })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateOne (id: string, data: any): Promise<any> {
    try {
      return this.roleAssociationModel.updateOne({ _id: id }, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async distinct (
    field: string,
    filters: FilterQuery<RoleAssociation>,
  ): Promise<any[]> {
    return this.roleAssociationModel.distinct(field, filters).exec()
  }

  async addUser (id: string, userId: string) {
    try {
      const roleAssociation = await this.roleAssociationModel.findById(id)
      if (roleAssociation) {
        roleAssociation.users = roleAssociation?.users
          ? [...roleAssociation.users, userId]
          : [userId]

        await roleAssociation.save()
      }

      return roleAssociation
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
