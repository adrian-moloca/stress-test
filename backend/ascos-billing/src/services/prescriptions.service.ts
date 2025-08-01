import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { auditTrailUpdate, callMSWithTimeoutAndRetry, Component, EntityType, EPcMaterialsStatus, EPrescriptionStatus, IGeneratePrescriptionJob, IGeneratePrescriptionsDTO, IHydratedPrescription, IPaginatedInvoiceResponse, IPcMaterial, IPrescription, IUser, QUEUE_NAMES, sanitizeRegex, UserPermissions } from '@smambu/lib.constantsjs'
import { ClientProxy } from '@nestjs/microservices'
import { LoggingService } from '@smambu/lib.commons-be'
import { SammelCheckpointService } from './sammelcheckpoint.service'
import { InjectModel } from '@nestjs/mongoose'
import { Prescription } from 'src/schemas/prescriptions.schema'
import { Model } from 'mongoose'
import { toDate } from 'date-fns-tz'
import { isValid } from 'date-fns'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { PcMaterialsService } from './pcMaterials.service'
import { PrescriptionSnapshot } from 'src/schemas/prescriptionSnapshot.schema'
import { attempts } from 'src/utilities/constants'

@Injectable()
export class PrescriptionsService {
  constructor (
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('CASES_CLIENT') private readonly casesClient: ClientProxy,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
    @Inject(forwardRef(() => SammelCheckpointService))
    private readonly sammelCheckpointService: SammelCheckpointService,
    @Inject(forwardRef(() => PcMaterialsService))
    private readonly pcMaterialsService: PcMaterialsService,
    @InjectModel(Prescription.name) private readonly prescriptionsModel: Model<Prescription>,
    @InjectModel(PrescriptionSnapshot.name)
    private readonly prescriptionSnapshotModel: Model<PrescriptionSnapshot>,
    @InjectQueue(QUEUE_NAMES.PrescriptionsGeneration) private prescriptionGenerationQueue: Queue,
  ) {}

  async createPrescriptionSnapshot ({
    pcMaterialsIds,
    pcMaterials,
    isCancellation,
    prescriptionToRefund,
  }: {
    pcMaterialsIds: string[],
    pcMaterials: IPcMaterial[],
    isCancellation: boolean,
    prescriptionToRefund?: Prescription,
  }) {
    try {
      const cases = await callMSWithTimeoutAndRetry(
        this.casesClient,
        { role: 'cases', cmd: 'getCasesByPcMaterialsIds' },
        { pcMaterialsIds },
        Component.BILLING,
      )

      let sammelCheckpoint = null
      if (prescriptionToRefund != null)
        sammelCheckpoint = await this.sammelCheckpointService
          .findById(prescriptionToRefund.sammelCheckpointRef)

      const data = {
        pcMaterials,
        cases,
        sammelCheckpoint,
        isCancellation,
        prescriptionToRefund,
      }

      return await this.prescriptionSnapshotModel.create(data)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createGeneratePrescriptionsJob ({
    isCancellation,
    user,
    pcMaterialsIds,
    pcMaterials,
    prescriptionToRefund,
  }: {
    isCancellation: boolean,
    user: IUser,
    pcMaterialsIds: string[],
    pcMaterials: IPcMaterial[],
    prescriptionToRefund?: Prescription,
  }) {
    const prescriptionSnapshot = await this.createPrescriptionSnapshot({
      pcMaterialsIds,
      pcMaterials,
      isCancellation,
      prescriptionToRefund,
    })

    this.pcMaterialsService.setPcMaterials(pcMaterialsIds, {
      elaborationInProgress: true,
    })

    const store = global.als.getStore()
    const tenantId = store.tenantId

    return this.prescriptionGenerationQueue.add({
      isCancellation,
      userId: user.id,
      tenantId,
      prescriptionSnapshotRef: prescriptionSnapshot._id.toString(),
    } as IGeneratePrescriptionJob, { removeOnComplete: true, removeOnFail: true, attempts })
  }

  async generateCancellationPrescriptions (body: IGeneratePrescriptionsDTO, user: IUser) {
    // The errors in this function should never happen
    if (body.prescriptionsToRefundIds?.length == null ||
      body.prescriptionsToRefundIds.length === 0)
      throw new Error('prescriptionsToRefundIds is required')

    const prescriptionsToRefund = await this.prescriptionsModel.find({
      _id: { $in: body.prescriptionsToRefundIds },
    })

    if (prescriptionsToRefund.length !== body.prescriptionsToRefundIds.length)
      throw new Error('Some prescriptions to refund were not found')

    const cancelledPrescriptions = prescriptionsToRefund
      .some(prescription => prescription.status === EPrescriptionStatus.CANCELLED)
    if (cancelledPrescriptions)
      throw new Error('Some prescriptions to refund are already cancelled')

    for (const prescriptionToRefund of prescriptionsToRefund) {
      const pcMaterials =
        await this.pcMaterialsService.getPcMaterialsByIds(prescriptionToRefund.pcMaterialsRef)

      const invalidPcMaterials = pcMaterials.some(pcMaterial =>
        pcMaterial.status !== EPcMaterialsStatus.PROCESSED ||
        pcMaterial.cancelled ||
        pcMaterial.elaborationInProgress)

      if (invalidPcMaterials)
        throw new Error('Some pcMaterials are invalid')

      await this.createGeneratePrescriptionsJob({
        isCancellation: true,
        user,
        pcMaterialsIds: prescriptionToRefund.pcMaterialsRef,
        pcMaterials,
        prescriptionToRefund,
      })
    }
  }

  async generateEmittedPrescriptions (body: IGeneratePrescriptionsDTO, user: IUser) {
    // The errors in this function should never happen
    if (body.pcMaterialsIds?.length == null || body.pcMaterialsIds.length === 0)
      throw new Error('pcMaterials is required')

    const pcMaterials = await this.pcMaterialsService.getPcMaterialsByIds(body.pcMaterialsIds)

    if (pcMaterials.length !== body.pcMaterialsIds.length)
      throw new Error('Some pcMaterials were not found')

    const invalidPcMaterials = pcMaterials.some(pcMaterial =>
      (pcMaterial.status === EPcMaterialsStatus.PROCESSED &&
      !pcMaterial.cancelled) ||
      pcMaterial.status === EPcMaterialsStatus.INFORMATION_INCOMPLETE ||
      pcMaterial.status === EPcMaterialsStatus.NOT_READY ||
      pcMaterial.elaborationInProgress)

    if (invalidPcMaterials)
      throw new Error('Some pcMaterials are invalid')

    const pcMaterialsByDebtor = pcMaterials.reduce((acc, pcMaterial) => {
      const debtorNumber = pcMaterial.debtor.debtorNumber
      if (acc[debtorNumber] == null)
        acc[debtorNumber] = []

      acc[debtorNumber].push(pcMaterial)

      return acc
    }, {} as Record<string, IPcMaterial[]>)

    for (const pcMaterials of Object.values(pcMaterialsByDebtor)) {
      const pcMaterialsIds = pcMaterials.map(pcMaterial => pcMaterial._id)
      await this.createGeneratePrescriptionsJob({
        isCancellation: false,
        user,
        pcMaterialsIds,
        pcMaterials,
      })
    }
  }

  async generatePrescriptions (body: IGeneratePrescriptionsDTO, user: IUser) {
    try {
      if (body.isCancellation)
        await this.generateCancellationPrescriptions(body, user)
      else
        await this.generateEmittedPrescriptions(body, user)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setPrescriptionPrescribed (prescriptionId: string, user: IUser) {
    try {
      const prescription = await this.prescriptionsModel.findOne({ _id: prescriptionId })
      if (!prescription) throw new Error('Prescription not found')

      prescription.status = EPrescriptionStatus.PRESCRIBED
      await prescription.save()
      const newPrescription = await this.prescriptionsModel.findOne({ _id: prescriptionId })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.PRESCRIPTION,
        prevObj: prescription.toJSON(),
        newObj: newPrescription.toJSON(),
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesById (
    casesIds: string[],
    userPermissions: UserPermissions
  ) {
    try {
      const caseObj = await callMSWithTimeoutAndRetry(
        this.casesClient,
        { role: 'cases', cmd: 'getCasesbyId' },
        {
          casesIds,
          userPermissions,
        },
        Component.BILLING,
      )

      return caseObj
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async hydratePrescriptions (
    prescriptions: IPrescription[],
    userPermissions: UserPermissions
  ): Promise<IHydratedPrescription[]> {
    const casesIds = new Set<string>()
    prescriptions
      .forEach(prescription => prescription.casesRef.forEach(caseId => casesIds.add(caseId)))
    const caseItems = await this.getCasesById([...casesIds], userPermissions)

    const sammelCheckpointsIds = prescriptions.map(current => current.sammelCheckpointRef)
    const sammelCheckpoints = await this.sammelCheckpointService
      .findMultiplesById(sammelCheckpointsIds)

    const pcMaterialsIds = prescriptions.reduce((acc, current) => {
      acc.push(...current.pcMaterialsRef)
      return acc
    }, [])

    const pcMaterials = await this.pcMaterialsService.getPcMaterialsByIds(pcMaterialsIds)
    const pcMaterialsObj = pcMaterials.reduce((acc, current) => {
      acc[current._id] = current
      return acc
    }, {})

    return prescriptions
      .map(prescription => {
        const cases = caseItems.filter(caseItem => prescription
          .casesRef.includes(caseItem.id))

        const sammelCheckpoint = sammelCheckpoints
          .find(current => current.id === prescription.sammelCheckpointRef)

        const pcMaterialsList = prescription.pcMaterialsRef
          .map(pcMaterialId => pcMaterialsObj[pcMaterialId])

        return {
          ...prescription,
          cases,
          sammelCheckpoint,
          pcMaterials: pcMaterialsList,
        }
      })
  }

  async fullTextSearch (
    userPermissions: UserPermissions,
    query: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    datePattern: string,
    defaultPaginationLimit: number,
    fromTimestamp?: number,
    toTimestamp?: number,
    casesIds?: string[],
  ): Promise<IPaginatedInvoiceResponse> {
    try {
      const queryTokens = query?.split(' ')
      const queryStrings = []
      const queryDates = []
      queryTokens?.forEach(token => {
        const datePatternParts = datePattern.split('/')
        const dateParts = token.split('/')

        const month = dateParts?.[datePatternParts.indexOf('MM')]
        const day = dateParts?.[datePatternParts.indexOf('dd')]
        const year = dateParts?.[datePatternParts.indexOf('yyyy')]

        const dateString = `${year}-${month}-${day}`
        const date = toDate(dateString, {
          timeZone: 'UTC',
        })

        if (isValid(date))
          queryDates.push(date)
        else
          if (token)
            queryStrings.push(sanitizeRegex(token))
      })

      const dateFilter = fromTimestamp || toTimestamp

      const mongoQuery = {
        ...(casesIds && { casesRef: { $in: casesIds } }),
        ...(dateFilter && {
          generatedAt: {
            ...(fromTimestamp && { $gte: new Date(fromTimestamp) }),
            ...(toTimestamp && { $lte: new Date(toTimestamp) }),
          }
        }),
        ...(queryStrings.length && {
          $or: [
            {
              _id: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              prescriptionNumber: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              status: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              'debtor.debtorNumber': {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              'debtor.firstName': {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              'debtor.lastName': {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              casesRef: {
                $elemMatch: {
                  $regex: queryStrings.join('|'),
                  $options: 'i',
                }
              }
            },
          ],
        }),
        ...(queryDates.length && {
          $or: [
            {
              generatedAt: {
                $in: queryDates,
              },
            },
            {
              dueDate: {
                $in: queryDates,
              }
            }],
        }),
      }
      const total = await this.prescriptionsModel.countDocuments(mongoQuery)

      const invoices = await this.prescriptionsModel
        .find(mongoQuery)
        .sort({
          ...(sortBy &&
          sortOrder && { [sortBy]: sortOrder === 'asc' ? 1 : -1 }),
        })
        .skip(
          (!isNaN(Number(page)) ? Number(page) : 0) *
        (!isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit),
        )
        .limit(!isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit)
        .lean()

      const hydratedInvoices =
        await this.hydratePrescriptions(invoices as unknown as IPrescription[], userPermissions)

      return {
        results: hydratedInvoices,
        total,
        currentPage: !isNaN(Number(page)) ? Number(page) : 0,
        limit: !isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getByCaseId (caseId: string) {
    try {
      return await this.prescriptionsModel.find({ casesRef: caseId })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
