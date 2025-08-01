import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Contract, ContractDocument } from '../schemas/contracts.schema'
import { FilterQuery, Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import { SurgerySlot, SurgerySlotDocument } from 'src/schemas/surgerySlots.schema'
import {
  CreateContractDto,
  Identifier,
  QueryContractDto,
  CreateOpStandardDto,
  QueryOpStandardDto,
  UserPermissions,
  IUser,
  booleanPermission,
  permissionRequests,
  EntityType,
  EditContractDto,
  checkPermission,
  getCapabilityUsers,
  Capabilities,
  PERMISSIONS_DOMAINS_SCOPES,
  auditTrailCreate,
  auditTrailUpdate,
  auditTrailDelete,
  Component,
  createNotifications,
  NotificationType,
  NotificationActionType,
  getUsersByCapability,
  callMSWithTimeoutAndRetry,
  formatContractForDataGrid,
  eSortByContractsFields,
  sanitizeRegex,
  tExecuteQueryPayload,
  applyGetQueryPermissions,
  tSupportedQueriesCollections,
  formatExecuteQueryValue,
  SOURCE_SCHEMAS,
} from '@smambu/lib.constantsjs'
import { OpStandard, OpStandardDocument } from '../schemas/opStandard.schema'
import * as _ from 'lodash'
import { endOfDay, isValid, startOfDay } from 'date-fns'
import { LoggingService, SendgridService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
import { AnesthesiologistOpStandard, AnesthesiologistOpStandardDocument } from 'src/schemas/anesthesiologistOPStandard.schema'
@Injectable()
export class ContractsService {
  private models: { model: Model<any>, label: string }[]
  constructor (
    @Inject('USERS_CLIENT')
    private readonly userClient: ClientProxy,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    @Inject('SCHEDULING_CASES_CLIENT')
    private readonly casesClient: ClientProxy,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(SurgerySlot.name)
    private readonly surgerySlotModel: Model<SurgerySlotDocument>,
    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,
    @Inject('UR_CLIENT')
    private readonly universalReportingClient: ClientProxy,

    @InjectModel(OpStandard.name)
    private readonly opStandardModel: Model<OpStandardDocument>,
    private readonly loggingService: LoggingService,
    private sendgridService: SendgridService,
    @InjectModel(AnesthesiologistOpStandard.name)
    private readonly anesthesiologistOpStandardModel: Model<AnesthesiologistOpStandardDocument>,
  ) {
    this.loggingService.setComponent(Component.CONTRACTS)
    this.models = [
      { model: this.anesthesiologistOpStandardModel, label: 'anesthesiologistopstandards' },
      { model: this.contractModel, label: 'contracts' },
      { model: this.opStandardModel, label: 'opstandards' },
      { model: this.surgerySlotModel, label: 'surgeryslots' },
    ]
  }

  checkOverlapTime = (timeList: { _id?: string, from: number | Date, to: number | Date }[]) => {
    timeList.sort((a, b) => (a.from > b.from ? 1 : -1))

    return timeList
      .some((obj, index, sortedTimeList) => {
        if (index === 0) return false
        if (obj._id && obj._id === sortedTimeList[index - 1]._id) return false
        return new Date(obj.from).getTime() <= new Date(sortedTimeList[index - 1].to).getTime()
      })
  }

  async checkIsValidContractTime (data: CreateContractDto | EditContractDto,
    id?: string): Promise<boolean> {
    const existedContractsValid = await this.contractModel
      .find({
        'details.doctorId': data?.details.doctorId,
      })
      .exec()

    const workingTimes = [
      ...existedContractsValid.map(obj => ({
        _id: obj._id,
        from: new Date((obj as any).details.validFrom).getTime(),
        to: new Date((obj as any).details.validUntil).getTime(),
      })),
      {
        _id: id,
        from: new Date(data?.details.validFrom).getTime(),
        to: new Date(data?.details.validUntil).getTime(),
      },
    ]
    const isOverlap = this.checkOverlapTime(workingTimes)
    if (isOverlap) throw new HttpException('contracts_contractDurationOverlap_error', 400)

    return true
  }

  checkOverlapSurgerySlot = (surgerySlots: { from: number | Date, to: number | Date }[]) => {
    const isOverlap = this.checkOverlapTime(surgerySlots ?? [])
    if (isOverlap)
      throw new HttpException('contracts_surgerySlotsOverlap_error', 400)
    return true
  }

  async saveSurgerySlots (data: CreateContractDto | EditContractDto,
    contractId: string): Promise<any> {
    if (contractId)
      await this.surgerySlotModel.deleteMany({ contractId }).exec()

    const surgerySlots = data?.details.surgerySlots

    this.checkOverlapSurgerySlot(surgerySlots)

    let insertedSurgerySlots = []
    if (surgerySlots)
      insertedSurgerySlots = await this.surgerySlotModel.insertMany(
        surgerySlots.map(obj => ({ ...obj, contractId })),
      )

    return insertedSurgerySlots
  }

  async createOne (data: CreateContractDto,
    userPermissions: UserPermissions,
    user: IUser): Promise<any> {
    try {
      await this.checkIsValidContractTime(data)

      const contract = await this.contractModel.create({
        ...data,
        opStandards: Object.keys(data?.opStandards ?? {}),
      })

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CONTRACT,
        newObj: contract.toObject(),
      })

      await this.saveSurgerySlots(data, contract._id)

      const pattern = { role: 'user', cmd: 'getUserDetail' }

      const payloadData = {
        id: data?.details.doctorId,
      }
      const doctor = await callMSWithTimeoutAndRetry(this.userClient,
        pattern,
        payloadData,
        Component.CONTRACTS)
      await this.sendgridService.sendNewContractEmail(doctor)

      return this.findContract(contract._id, userPermissions, user)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateContract (contractId: Identifier,
    data: CreateContractDto,
    userPermissions: UserPermissions,
    user: IUser): Promise<any> {
    try {
      await this.checkIsValidContractTime(data, contractId)

      const opStandardIds = Object.keys(data.opStandards)
      const contract = await this.contractModel.findById(contractId)
      if (!contract)
        throw new NotFoundException(`Contract with id ${contractId} not found`)
      const previousValue = _.cloneDeep(contract)
      checkPermission(permissionRequests.canEditContract,
        {
          userPermissions,
          user,
          props: {
            contract: {
              details: {
                ...contract.details,
                doctorId: contract?.details?.doctorId
              },
              opStandards: {}
            }
          }
        })

      await this.contractModel.updateOne({
        _id: contractId,
      }, {
        ...data,
        createdAt: contract.createdAt,
        opStandards: opStandardIds,
      })

      await this.saveSurgerySlots(data, contract._id)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CONTRACT,
        prevObj: previousValue.toObject(),
        newObj: contract.toObject(),
      })

      const store = (global as any).als.getStore()
      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')

      return this.findContract(contractId, userPermissions, user)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteContract (id: Identifier,
    user: IUser,
    userPermissions: UserPermissions): Promise<any> {
    try {
      const previousValue = await this.contractModel.findById(id)
      if (!previousValue)
        throw new NotFoundException(`Contract with id ${id} not found`)
      checkPermission(permissionRequests.canDeleteContract, {
        userPermissions,
        user,
        props: {
          contract: {
            details: { ...previousValue.details, doctorId: previousValue?.details?.doctorId },
            opStandards: {}
          }
        }
      })

      await this.surgerySlotModel.deleteMany({ contractId: id }).exec()
      await this.contractModel.deleteOne({ _id: id }).exec()

      await auditTrailDelete({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CONTRACT,
        prevObj: previousValue.toObject(),
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getContractsDoctors ({
    contracts,
    userPermissions,
    permissionCheck = true,
  }: {
    contracts: Contract[],
    userPermissions: UserPermissions,
    permissionCheck?: boolean
  }): Promise<Record<string, IUser>> {
    const doctorsIds = contracts.reduce((acc, contract) => ([
      ...acc,
      ...(contract?.details?.doctorId && !acc.includes(contract.details.doctorId)
        ? [contract.details.doctorId]
        : []),
    ]), [])

    const pattern = { role: 'user', cmd: 'getMultipleDoctors' }

    const payloadData = { ids: doctorsIds, userPermissions, permissionCheck }
    const doctors = await callMSWithTimeoutAndRetry(this.userClient,
      pattern,
      payloadData,
      Component.CONTRACTS)

    return doctors.reduce((acc, doctor) => ({ ...acc, [doctor?._id]: doctor }), {})
  }

  // any is a workaround for the issue with mongoose populate
  async formatContract (
    contract: any,
    doctors: Record<string, IUser>,
    userPermissions: UserPermissions,
    user: IUser,
    permissionCheck: boolean = true,
    noSurgerySlots: boolean = false
  ) {
    const canViewOpstandard = permissionCheck
      ? booleanPermission(permissionRequests.canViewOpStandard, {
        userPermissions,
        user,
        props: {
          contract,
        }
      })
      : true
    const canViewOpstandardName = permissionCheck
      ? booleanPermission(permissionRequests.canViewOpstandardName, {
        userPermissions,
        user,
        props: {
          contract,
        }
      })
      : true

    const surgerySlots = noSurgerySlots
      ? []
      : await this.surgerySlotModel
        .find({ contractId: contract?._id })
        .lean()
        .exec()

    const canAccessOpstandards = (canViewOpstandard || canViewOpstandardName)

    const contractOpstandards = contract.opStandards ?? []
    const opStandards = canAccessOpstandards
      ? contractOpstandards
        .reduce((acc, curr) => {
          // this is a workaround for the issue with mongoose populate
          const o = curr as unknown as OpStandard
          if (canViewOpstandard)
            acc[o?._id] = {
              ...o,
              opStandardId: o?._id,
            }

          else
            acc[o?._id] = {
              opStandardId: o?._id,
              name: o.name,
            }

          return acc
        }, {})
      : {}

    return {
      ...contract,
      contractId: contract?._id,
      _id: undefined,
      details: {
        ...contract?.details ?? {},
        status: new Date(contract?.details.validUntil).getTime() > new Date().getTime() ? 'active' : 'expired',
        surgerySlots: surgerySlots.map(obj => ({
          id: obj?._id,
          from: obj.from,
          to: obj.to,
        })),
      },

      opStandards,
      associatedDoctor: doctors[contract?.details.doctorId],
    }
  }

  async getContractsByIds ({ contractsIds }: { contractsIds: string[] },
    userPermissions: UserPermissions,
    user: IUser) {
    try {
      const query = this.contractModel
        .find({
          $and: [
            {
              _id: {
                $in: contractsIds,
              },
            },
          ],
        },
        { __v: 0 })
        .populate({
          path: 'opStandards',
        })
        .lean()

      const contracts = await query.exec()
      const doctors = await this.getContractsDoctors({ contracts, userPermissions })
      const filteredContracts = await Promise.all((contracts ?? [])
        .map(async contract => await this.formatContract(contract, doctors, userPermissions, user)))

      return {
        results: filteredContracts,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findContracts (queries: QueryContractDto, userPermissions: UserPermissions, user: IUser) {
    try {
      const capabilityDoctors = getCapabilityUsers(Capabilities.P_CONTRACTS_VIEW, userPermissions)
      const {
        search,
        doctorId,
        validFrom,
        validUntil, status, sortBy, sortOrder, page, limit, forDataGrid
      } = queries
      const limitParam = isNaN(Number(limit)) ? undefined : Number(limit)
      const pageParam = limitParam == null || isNaN(Number(page)) ? 0 : Number(page)

      const searchQuery = search
        ? [{
          $or: [
            {
              $expr: {
                $regexMatch: {
                  input: '$details.contractName',
                  regex: sanitizeRegex(search).toLowerCase(),
                  options: 'i',
                },
              },
            },
            {
              $expr: {
                $regexMatch: {
                  input: '$_id',
                  regex: sanitizeRegex(search),
                  options: 'i',
                },
              },
            },
          ]
        }]
        : []
      const validFromDate = new Date(Number(validFrom))
      const validUntilDate = new Date(Number(validUntil))

      const endLimitDate = isValid(validFromDate) ? startOfDay(validFromDate) : null
      const startLimitDate = isValid(validUntilDate) ? endOfDay(validUntilDate) : null

      const dateFromQuery = endLimitDate
        ? [
          {
            'details.validFrom': {
              $gte: endLimitDate,
            },
          },
        ]
        : []

      const dateToQuery = startLimitDate
        ? [
          {
            'details.validUntil': {
              $lte: startLimitDate,
            },
          },
        ]
        : []

      let doctorQuery

      const hasAllData = capabilityDoctors === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
      if (doctorId && (hasAllData || capabilityDoctors.includes(doctorId)))
        doctorQuery = [{ 'details.doctorId': doctorId }]
      else
        doctorQuery = hasAllData ? [] : [{ 'details.doctorId': { $in: capabilityDoctors } }]

      const statusQuery =
        status !== 'all'
          ? [
            {
              'details.validUntil': {
                [status === 'active' ? '$gt' : '$lte']: new Date(),
              },
            },
          ]
          : []

      const andQueries = [...searchQuery,
        ...dateFromQuery,
        ...dateToQuery,
        ...doctorQuery,
        ...statusQuery] as Array<FilterQuery<Contract>>

      const total = await this.contractModel
        .countDocuments(
          andQueries.length
            ? {
              $and: andQueries,
            }
            : {},
        )
        .exec()

      let sortKey

      // XXX Again, i'm preserving the original code even though typescript
      // assures me that is completely useless to do so. We must check it asap
      switch (sortBy) {
        case null:
        case undefined:
          sortKey = 'updatedAt'
          break

        case eSortByContractsFields.contractId:
          sortKey = '_id'
          break

        default:
          sortKey = `details.${sortBy}`
          break
      }

      const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1
      const query = this.contractModel
        .find(
          andQueries.length
            ? {
              $and: andQueries,
            }
            : {},
          { __v: 0 },
        )
        .populate({
          path: 'opStandards',
        })
        .sort({
          [sortKey]: sortOrderNumeric,
        })
        .skip(pageParam * limitParam)
        .limit(limitParam)
        .lean()

      const contracts = await query.exec()
      const doctors = await this.getContractsDoctors({ contracts, userPermissions })
      const filteredContracts = await Promise.all((contracts ?? [])
        .map(async contract => {
          const formattedContract = await this.formatContract(contract,
            doctors,
            userPermissions,
            user)
          if (!forDataGrid) return formattedContract
          else return formatContractForDataGrid(formattedContract)
        }))

      return {
        results: filteredContracts,
        total,
        currentPage: page ?? 1,
        limit: limit ?? 100,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findContract (
    contractId: Identifier,
    userPermissions: UserPermissions,
    user: IUser,
    permissionCheck: boolean = true,
    noSurgerySlots: boolean = false
  ) {
    try {
      const contract = await this.contractModel.findById(contractId, { __v: 0 })
        .lean()
        .populate({
          path: 'opStandards',
        })
        .exec()

      if (!contract)
        throw new NotFoundException(`Contract with id ${contractId} not found`)

      if (permissionCheck)
        checkPermission(permissionRequests.canViewContract,
          {
            userPermissions,
            user,
            props: {
              contract: {
                details: {
                  ...contract.details,
                  doctorId: contract?.details?.doctorId
                },
                opStandards: {}
              }
            }
          })

      const doctors = await this.getContractsDoctors({
        contracts: [contract],
        userPermissions,
        permissionCheck
      })

      const formattedContract = await this.formatContract(
        contract,
        doctors,
        userPermissions,
        user,
        permissionCheck,
        noSurgerySlots,
      )

      return formattedContract
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createOpStandard (data: CreateOpStandardDto, userId: string) {
    try {
      const { contractId, ...body } = data

      // eslint-disable-next-line new-cap
      const opStandard = new this.opStandardModel(body)

      await opStandard.save()

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.OPSTANDARD,
        newObj: opStandard.toObject(),
      })

      if (body.previousContractOpStandardId) {
        const previousLinkedOpStandards = await this.opStandardModel.find({
          previousContractOpStandardId: body.previousContractOpStandardId,
          _id: { $ne: opStandard._id }
        })
        if (previousLinkedOpStandards.length)
          for (const previousLinkedOpStandard of previousLinkedOpStandards) {
            previousLinkedOpStandard.previousContractOpStandardId = opStandard._id
            await previousLinkedOpStandard.save()
          }
      }

      if (contractId) {
        const contract = await this.contractModel.findById(contractId)
        if (!contract)
          throw new BadRequestException('contract_error_contractNotExist')

        contract.opStandards = contract.opStandards
          ? [...contract.opStandards, opStandard?._id.toString()]
          : [opStandard?._id]

        await contract.save()
      }

      return opStandard
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getOpStandards (params: QueryOpStandardDto) {
    try {
      const { search, contractId } = params
      let whereConditions = {
        $or: [
          {
            name: new RegExp(search, 'gi')
          },
          {
            changeRequest: new RegExp(search, 'gi')
          },
        ]
      }
      if (contractId) {
        const contract = await this.contractModel.findById(contractId)

        if (!contract)
          throw new Error(`Contract with ${contractId} not found`)

        Object.assign(whereConditions, {
          _id: { $in: contract.opStandards }
        })
      }

      const data = await this.opStandardModel.find(whereConditions)

      return data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getNotLinkedOpStandards ({ contractId, doctorId }: {
    contractId: string,
    doctorId: string
  }) {
    try {
      const contracts: Contract[] = await this.contractModel.find({
        'details.doctorId': doctorId
      })

      const editingContract = contracts.find(contract => contract._id.toString() === contractId)
      const editingContractOpStandards = editingContract?.opStandards ?? []

      const previousContracts = !editingContract
        ? contracts
        : contracts.filter(prevContract => prevContract._id.toString() !== contractId &&
          new Date(prevContract.details.validUntil)
            .getTime() < new Date(editingContract?.details?.validUntil)
            .getTime())

      const previousContractOpStandards = previousContracts
        .map(prevContract => prevContract.opStandards ?? [])
        .reduce((acc, opStandards) => [...acc, ...opStandards], [])

      const opStandardIds = contracts
        .reduce((acc, contract) => {
          return [...acc, ...contract.opStandards]
        }, [])

      const data = (await this.opStandardModel.find({
        _id: { $in: opStandardIds }
      }))

      const opStandards = data.filter((opStandard, _index, self) =>
        !editingContractOpStandards.includes(opStandard._id.toString()) &&
        previousContractOpStandards.includes(opStandard._id.toString()) &&
        self.every(otherOpStandard =>
          otherOpStandard.previousContractOpStandardId !== opStandard._id.toString()))

      return opStandards
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getSingleOpStandard (id: string) {
    try {
      const data = await this.opStandardModel.findById(id)
      return data
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateOpStandard (id: string, data: CreateOpStandardDto, userId: string) {
    try {
      const opStandard = await this.opStandardModel.findById(id)
      const previousValue = _.cloneDeep(opStandard)

      await opStandard.set(data)

      await opStandard.save()

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.OPSTANDARD,
        prevObj: previousValue.toObject(),
        newObj: opStandard.toObject(),
      })

      const store = (global as any).als.getStore()
      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')

      return opStandard
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async removeOpStandard (opId, userId: string, contractId?: string) {
    try {
      const opStandardToDelete = await this.opStandardModel.findById(opId)

      if (contractId != null) {
        const contract = await this.contractModel.findById(contractId)

        const pattern = { role: 'cases', cmd: 'getOpstandardUtilization' }

        const payloadData = { opstandardId: opId }
        const lastCase = await callMSWithTimeoutAndRetry(this.casesClient,
          pattern,
          payloadData,
          Component.CONTRACTS)

        if (lastCase) throw new BadRequestException('opstandard_deletion_forbidden_error')

        if (contract) {
          contract.opStandards = contract.opStandards?.filter(item => item.toString() !== opId) ||
            []

          await contract.save()
        }
      }

      await this.opStandardModel.deleteOne({ _id: opId })

      await auditTrailDelete({
        logClient: this.logClient,
        userId,
        entityType: EntityType.OPSTANDARD,
        prevObj: opStandardToDelete,
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getIsOrUsedInOpstandards (id: string) {
    try {
      const opAssociatedToTheOr = await this.opStandardModel.find({
        operatingRoomIds: {
          $all: [id]
        }
      })
      return opAssociatedToTheOr.length > 0
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateChangeRequest (id: string, changeRequest: string, user: IUser) {
    try {
      const oldOpstandard = await this.opStandardModel.findById(id)
      await this.opStandardModel.findOneAndUpdate({ _id: id }, { changeRequest })
      const newOp = await this.opStandardModel.findById(id)
      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.OPSTANDARD,
        prevObj: oldOpstandard.toObject(),
        newObj: newOp.toObject(),
      })

      const contract = await this.contractModel.find({
        opStandards: id
      }).exec()

      if (!contract?.[0]?.details?.doctorId) return newOp

      const users = await getUsersByCapability(this.userClient, {
        capability: Capabilities.P_D_OPSTANDARD_EDIT,
        ownerId: contract[0].details.doctorId,
      })

      createNotifications(this.notificationsClient, {
        usersIds: users.map(user => user.id).filter(id => id !== user.id),
        type: NotificationType.D_OP_CHANGE_REQUESTED,
        title: 'notifications_dOpChangeRequested_title',
        body: 'notifications_dOpChangeRequested_body',
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: `/contracts/${contract[0]._id}?tab=opStandards`,
        },
      })
      return newOp
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDoctorOpstandards (doctorId: string, userPermissions: UserPermissions) {
    const capabilityDoctors = getCapabilityUsers(Capabilities.P_D_OPSTANDARD_VIEW, userPermissions)
    const isDoctorCapable = capabilityDoctors?.includes?.(doctorId)
    if (!(capabilityDoctors === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA) && !(isDoctorCapable))
      throw new Error('doctor_not_in_your_scope_error')

    const doctorContracts = await this.contractModel.find({
      'details.doctorId': doctorId,
    })

    const doctorOpstandardsIds: string[] = []
    for (const contract of doctorContracts)
      doctorOpstandardsIds.push(...contract.opStandards)

    const opstandards = await this.opStandardModel.find({
      _id: {
        $in: doctorOpstandardsIds
      }
    })

    return opstandards
  }

  async executeQuery ({
    query,
    select,
    sort,
    userPermissions,
    collection,
    __ignorePermissions,
  }: tExecuteQueryPayload): Promise<any> {
    try {
      let parsedQuery = query
      if (!__ignorePermissions)
        parsedQuery = applyGetQueryPermissions(
          collection as tSupportedQueriesCollections,
          query,
          userPermissions,
        )

      const contracts = await this.contractModel.find(parsedQuery).select(select)
        .sort(sort)
        .lean()

      const getContractDeps = (contract: Contract) => [{ path: `${SOURCE_SCHEMAS.CONTRACTS}.${contract._id}` }]

      const result = formatExecuteQueryValue(
        SOURCE_SCHEMAS.CONTRACTS,
        query,
        contracts,
        getContractDeps
      )

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDynamicData (version?: string) {
    const dbDynamicData = await callMSWithTimeoutAndRetry(
      this.universalReportingClient,
      { role: 'ur', cmd: 'getDynamicData' },
      { version },
      Component.SCHEDULING_CASES,
    )

    return dbDynamicData
  }
}
