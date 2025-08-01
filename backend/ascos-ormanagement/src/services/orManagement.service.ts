import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Component, EntityType, IUser, Identifier, OpStandard, OperatingRoom, OperatingRoomStatus, UserPermissions, auditTrailCreate, auditTrailDelete, auditTrailUpdate, callMSWithTimeoutAndRetry, formatExecuteQueryValue, tExecuteQueryPayload, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { OperatingRoomClass, OperatingRoomDocument } from 'src/schemas/orManagement.schema'
import { ClientProxy } from '@nestjs/microservices'
import {
  isAfter,
  isBefore,
  getDay,
  parseISO,
} from 'date-fns'
import { LoggingService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
import { OrSchedulingClass, OrSchedulingDocument } from 'src/schemas/orScheduling.schema'
@Injectable()
export class OrManagementService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @InjectModel(OperatingRoomClass.name)
    private readonly operatingRoom: Model<OperatingRoomDocument>,
    @Inject('CONTRACT_CLIENT')
    private readonly contractClient: ClientProxy,
    @Inject('SCHEDULING_CASES_CLIENT')
    private readonly casesClient: ClientProxy,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
    @InjectModel(OrSchedulingClass.name)
    private readonly orScheduling: Model<OrSchedulingDocument>,
  ) {
    this.loggingService.setComponent(Component.OR_MANAGEMENT)
    this.models = [
      { model: this.operatingRoom, label: 'operatingroomclasses' },
      { model: this.orScheduling, label: 'orschedulingclasses' },
    ]
  }

  async findAll () {
    try {
      const res = await this.operatingRoom.find().exec()
      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findOperatingRoomById (id: Identifier) {
    try {
      const operatingRoom = await this.operatingRoom.findById(id).exec()
      return operatingRoom?.toJSON() ?? null
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createOperatingRoom (data: OperatingRoom, user: IUser) {
    try {
      // eslint-disable-next-line new-cap
      const newItem = new this.operatingRoom(data)
      await newItem.save()
      await auditTrailCreate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.OPERATING_ROOM,
        newObj: newItem.toJSON(),
      })

      return newItem.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteOperatingRoom (id: Identifier, user: IUser): Promise<any> {
    try {
      const isRoomUsed = await this.isOrUsed(id)
      if (isRoomUsed) throw new HttpException('operating_room_used_error', 400)
      const previousValue = await this.operatingRoom.findById(id).exec()
      await this.operatingRoom.deleteOne({ _id: id }).exec()
      await auditTrailDelete({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.OPERATING_ROOM,
        prevObj: previousValue.toJSON(),
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateOperatingRoom (id: Identifier, data: OperatingRoom, user: IUser): Promise<any> {
    try {
      const previousValue = await this.operatingRoom.findById(id).exec()
      const item = await this.operatingRoom.findOneAndUpdate({ _id: id }, data)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.OPERATING_ROOM,
        prevObj: previousValue.toJSON(),
        newObj: item.toJSON(),
      })

      return item.toJSON()
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseRoom ({
    bookingDate,
    opStandardId,
    userPermissions,
  }: {
    bookingDate: Date
    opStandardId: string
    userPermissions: UserPermissions
  }) {
    try {
      const pattern = { role: 'contracts', cmd: 'getOpStandard' }

      const payloadData = {
        id: opStandardId,
        userPermissions,
      }
      const opStandard: OpStandard = await callMSWithTimeoutAndRetry(this.contractClient,
        pattern,
        payloadData,
        Component.OR_MANAGEMENT)

      let orId = null
      const operatingRoomsCount = await this.operatingRoom.countDocuments().exec()
      if (operatingRoomsCount === 1) {
        const or = await this.operatingRoom.findOne().exec()
        orId = or._id
      }
      if (operatingRoomsCount > 1)
        if (opStandard?.operatingRoomIds?.length === 1) orId = opStandard?.operatingRoomIds[0]

      if (orId == null) return null
      const isAvailable = await this.isOperatingRoomAvailable(orId, new Date(bookingDate))
      return isAvailable ? orId : null
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async isOperatingRoomAvailable (operatingRoomId: string, date: Date) {
    const or = await this.findOperatingRoomById(operatingRoomId)

    const checkDateRange = (startDate: string, endDate: string, date: Date) => {
      return !isAfter(parseISO(startDate), date) && !isBefore(parseISO(endDate), date)
    }

    if (!or) return false

    if (or.status === OperatingRoomStatus.NOT_AVAILABLE && !or.exception) return false
    if (or.status === OperatingRoomStatus.AVAILABLE && !or.exception) return true

    const available = (or: any, date: Date) => {
      if (checkDateRange(or.exception.startDate, or.exception.endDate, date))
        if ((or.exception.repeatedEvery?.length ?? 0) > 0) {
          if (or.exception.repeatedEvery?.includes(getDay(date))) return true
          return false
        } else {
          return true
        }

      return false
    }

    if (or.status === OperatingRoomStatus.NOT_AVAILABLE && or.exception)
      return !available(or, date)

    if (or.status === OperatingRoomStatus.AVAILABLE && or.exception)
      return available(or, date)

    return false
  }

  async isOrUsed (id: string) {
    try {
      const usedIncasesPattern = { role: 'cases', cmd: 'isOrUsedInCases' }

      const usedInCasesPayloadData = {
        id,
      }
      const isOrUsedInCases = await callMSWithTimeoutAndRetry(this.casesClient,
        usedIncasesPattern,
        usedInCasesPayloadData,
        Component.OR_MANAGEMENT)

      const usedInORPattern = { role: 'contracts', cmd: 'isOrUsedInOpstandards' }

      const usedInORPayloadData = {
        id,
      }
      const isOrUsedInOpstandards = await callMSWithTimeoutAndRetry(this.contractClient,
        usedInORPattern,
        usedInORPayloadData,
        Component.OR_MANAGEMENT)

      return isOrUsedInCases || isOrUsedInOpstandards
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async executeQuery ({ query, select }: tExecuteQueryPayload): Promise<any> {
    try {
      // applyGetQueryPermissions not needed because the users can always see all the operating rooms
      const response = await this.operatingRoom.find(query).select(select)

      const getOperatingRoomDeps = operatingRoom => [{ path: `${SOURCE_SCHEMAS.OR_MANAGEMENT}.${operatingRoom._id}` }]

      return formatExecuteQueryValue(
        SOURCE_SCHEMAS.OR_MANAGEMENT,
        query,
        response,
        getOperatingRoomDeps
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
