import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  EntityType,
  Capabilities,
  CreateAnesthesiologistOpStandardDto,
  Identifier,
  PERMISSIONS_DOMAINS_SCOPES,
  QueryAnesthesiologistOpStandardDto,
  UpdateAnesthesiologistOpStandardDto,
  UserPermissions,
  checkPermission,
  getCapabilityUsers,
  permissionRequests,
  validateNewAnesthesiologistOpStandard,
  auditTrailCreate,
  auditTrailDelete,
  auditTrailUpdate,
  Component,
  sanitizeRegex,
} from '@smambu/lib.constantsjs'
import {
  AnesthesiologistOpStandard,
  AnesthesiologistOpStandardDocument,
} from '../schemas/anesthesiologistOPStandard.schema'
import { ClientProxy } from '@nestjs/microservices'
import { endOfDay, isValid, startOfDay } from 'date-fns'
import { LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class AnesthesiologistOpStandardService {
  constructor (
    @InjectModel(AnesthesiologistOpStandard.name)
    private readonly anesthesiologistOpStandardModel: Model<AnesthesiologistOpStandardDocument>,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.CONTRACTS)
  }

  async getNextVersion (versionId: string, validFrom: Date): Promise<AnesthesiologistOpStandard> {
    const results = await this.anesthesiologistOpStandardModel.aggregate([
      { $match: { versionId, validFrom: { $gt: validFrom } } },
      { $sort: { validFrom: 1 } },
      { $limit: 1 },
    ])

    return results?.[0]
  }

  async getPreviousVersion (versionId: string,
    validFrom: Date): Promise<AnesthesiologistOpStandard> {
    const results = await this.anesthesiologistOpStandardModel.aggregate([
      { $match: { versionId, validFrom: { $lt: validFrom } } },
      { $sort: { validFrom: -1 } },
      { $limit: 1 },
    ])

    return results?.[0]
  }

  async findAnesthesiologistOpStandards (
    queries: QueryAnesthesiologistOpStandardDto,
    userPermissions: UserPermissions,
  ) {
    try {
      const { search, validFrom, page, limit, sortBy, sortOrder } = queries
      const searchRegex = (search?.split(' ') ?? [])
        .filter(Boolean)
        .map(word => new RegExp(sanitizeRegex(word).trim()
          .toLowerCase(), 'i'))

      const validFromDate = new Date(validFrom)
      const validFromIsValid = isValid(validFromDate)

      const validFromStart = startOfDay(new Date(validFrom))
      const validFromEnd = endOfDay(new Date(validFrom))
      const dateFilter = validFromIsValid
        ? [{ validFrom: { $gte: validFromStart, $lte: validFromEnd } }]
        : []

      const searchQuery = validFromIsValid || searchRegex?.length
        ? {
          $or: [
            ...(searchRegex?.length ? [{ name: { $in: searchRegex } }] : []),
            ...(searchRegex?.length ? [{ _id: { $in: searchRegex } }] : []),
            ...dateFilter,
          ],
        }
        : {}

      const capabilityUsers = getCapabilityUsers(Capabilities.P_A_OPSTANDARD_VIEW, userPermissions)
      if (capabilityUsers !== PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
        searchQuery['createdBy'] = { $in: capabilityUsers }

      const total = await this.anesthesiologistOpStandardModel
        .countDocuments(searchQuery)
        .exec()

      let sortKey
      // XXX so, this is very sketchy: typescript says that sortby CANNOT be
      // null or undefined, but there is a big portion of logic using the exact
      // inverse assumption.
      // I'm leaving this apparently wrong check for legacy reasons, but we must
      // discuss this asap
      switch (sortBy) {
        case null:
        case undefined:
          sortKey = 'updatedAt'
          break

        case 'anesthesiologistOpStandardId':
          sortKey = '_id'
          break

        default:
          sortKey = `details.${sortBy}`
          break
      }

      const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1

      const query = this.anesthesiologistOpStandardModel
        .find(searchQuery, { __v: 0 })
        .skip((page ? Number(page) - 1 : 0) * (Number(limit) ?? 100))
        .limit(Number(limit) ?? 100)
        .sort({
          [sortKey]: sortOrderNumeric,
        })

      const anOpStandards = await query.exec()
      return {
        results: anOpStandards.map(item => item.toJSON()),
        total,
        currentPage: page ?? 1,
        limit: limit ?? 100,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findAll (userPermissions: UserPermissions | null, forceAllData = false) {
    try {
      let capabilityUsers
      if (userPermissions == null && forceAllData)
        capabilityUsers = PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
      else
        capabilityUsers = getCapabilityUsers(Capabilities.P_A_OPSTANDARD_VIEW, userPermissions)

      const res = await this.anesthesiologistOpStandardModel.find({
        ...(capabilityUsers !== PERMISSIONS_DOMAINS_SCOPES.ALL_DATA && {
          createdBy: { $in: (capabilityUsers as string[]) },
        }),
      }).exec()

      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findAnesthesiologistOpStandardById (id: Identifier, userPermissions: UserPermissions) {
    try {
      const anOpStandard = await this.anesthesiologistOpStandardModel
        .findById(id, { __v: 0 })
        .exec()

      const anesthesiologistOpStandard = anOpStandard.toJSON()
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandard,
        { userPermissions, props: { anesthesiologistOpStandard } })
      return anOpStandard.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createAnesthesiologistOpStandard (
    data: CreateAnesthesiologistOpStandardDto,
    userId: string
  ) {
    try {
      const validatedModel = validateNewAnesthesiologistOpStandard({
        ...data,
        createdBy: userId,
      })
      // eslint-disable-next-line new-cap
      const newItem = new this.anesthesiologistOpStandardModel(validatedModel)

      await newItem.save()

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.ANESTHESIOLOGIST_OPSTANDARD,
        newObj: newItem.toJSON(),
      })

      return newItem.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createAnesthesiologistOpStandardNewVersion (
    data,
    id: Identifier,
    userPermissions: UserPermissions,
    userId: string
  ) {
    try {
      const fatherItem = await this.findAnesthesiologistOpStandardById(id, userPermissions)
      const sameDateItem = await this.anesthesiologistOpStandardModel.findOne({
        versionId: fatherItem.versionId,
        validFrom: data.validFrom,
      })
      if (sameDateItem)
        throw new BadRequestException('anesthesiologistOpStandard_sameDateItem_error')

      // eslint-disable-next-line new-cap
      const newItem = new this.anesthesiologistOpStandardModel({
        ...validateNewAnesthesiologistOpStandard(data),
        versionId: fatherItem.versionId,
        createdBy: userId,
      })
      await newItem.save()

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.ANESTHESIOLOGIST_OPSTANDARD,
        newObj: newItem.toJSON(),
      })

      return newItem.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteAnesthesiologistOpStandard (id: Identifier,
    userPermissions: UserPermissions,
    userId: string): Promise<any> {
    try {
      const anesthesiologistOpStandard = await this.findAnesthesiologistOpStandardById(id,
        userPermissions)

      checkPermission(permissionRequests.canDeleteAnesthesiologistOpStandard,
        { userPermissions, props: { anesthesiologistOpStandard } })
      await this.anesthesiologistOpStandardModel.deleteOne({ _id: id }).exec()

      await auditTrailDelete({
        logClient: this.logClient,
        userId,
        entityType: EntityType.ANESTHESIOLOGIST_OPSTANDARD,
        prevObj: anesthesiologistOpStandard,
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateAnesthesiologistOpStandard (
    id: Identifier,
    data: UpdateAnesthesiologistOpStandardDto,
    userPermissions: UserPermissions,
    userId: string
  ): Promise<any> {
    try {
      const anesthesiologistOpStandard = await this.findAnesthesiologistOpStandardById(id,
        userPermissions)
      checkPermission(permissionRequests.canEditAnesthesiologistOpStandard,
        { userPermissions, props: { anesthesiologistOpStandard } })

      const prevObj = await this.anesthesiologistOpStandardModel.findById(id)
      await this.anesthesiologistOpStandardModel.updateOne(
        { _id: id },
        data,
      ).exec()
      const newObj = await this.anesthesiologistOpStandardModel.findById(id)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.ANESTHESIOLOGIST_OPSTANDARD,
        prevObj: prevObj.toJSON(),
        newObj: newObj.toJSON(),
      })

      return newObj.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findNearVersions (
    id: Identifier,
    userPermissions: UserPermissions,
  ): Promise<{ nextVersion: AnesthesiologistOpStandard;
      previousVersion: AnesthesiologistOpStandard }> {
    try {
      const item = await this.anesthesiologistOpStandardModel.findOne({
        _id: id,
      })
      checkPermission(permissionRequests.canViewAnesthesiologistOpStandard,
        { userPermissions, props: { anesthesiologistOpStandard: item } })
      const nextVersion = await this.getNextVersion(
        item.versionId,
        item.validFrom,
      )

      const previousVersion = await this.getPreviousVersion(
        item.versionId,
        item.validFrom,
      )

      return { nextVersion, previousVersion }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getNames () {
    try {
      const res = await this.anesthesiologistOpStandardModel.find()
      return res.map(item => ({
        id: item._id,
        name: item.name,
      }))
    } catch (error) {
      await this.loggingService.throwErrorAndLog(error)
    }
  }
}
