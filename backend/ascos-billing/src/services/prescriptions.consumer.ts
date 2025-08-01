import { Processor, Process } from '@nestjs/bull'
import { forwardRef, Inject } from '@nestjs/common'
import { Job } from 'bull'
import { Component, QUEUE_NAMES, IUser, IPcMaterial, callMSWithTimeoutAndRetry, filterEmittablePcMaterials, computeSammelCheckpoint, EPrescriptionStatus, auditTrailCreate, EntityType, getParsedArticlesFromPcMaterials, auditTrailUpdate, IGeneratePrescriptionJob, NotificationType, createNotifications, NotificationActionType, EPcMaterialsStatus, IPrescription, ISammelCheckpoint } from '@smambu/lib.constantsjs'
import { LoggingService, RedisClientService } from '@smambu/lib.commons-be'
import { PcMaterialsService } from './pcMaterials.service'
import { SammelCheckpointService } from './sammelcheckpoint.service'
import { ClientProxy } from '@nestjs/microservices'
import { Prescription } from 'src/schemas/prescriptions.schema'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { PrescriptionSnapshot } from 'src/schemas/prescriptionSnapshot.schema'

@Processor(QUEUE_NAMES.PrescriptionsGeneration)
export class PrescriptionsGeneratorConsumer {
  constructor (
    @Inject(RedisClientService) private readonly redis: RedisClientService,
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('LOGS_CLIENT') private readonly logClient: ClientProxy,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notificationsClient: ClientProxy,
    private readonly pcMaterialsService: PcMaterialsService,
    private readonly loggingService: LoggingService,
    @Inject(forwardRef(() => SammelCheckpointService))
    private readonly sammelCheckpointService: SammelCheckpointService,
    @InjectModel(PrescriptionSnapshot.name)
    private readonly prescriptionSnapshotModel: Model<PrescriptionSnapshot>,
    @InjectModel(Prescription.name) private readonly prescriptionModel: Model<Prescription>,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async generatePrescriptionsammels (
    pcMaterials: IPcMaterial[],
    doctorId: string,
    userId: string,
  ) {
    const previousCheckpoint = await this.sammelCheckpointService.findLatestBySurgeon(doctorId)
    const emittablePcMaterials = filterEmittablePcMaterials(pcMaterials, previousCheckpoint)

    let data = {}

    if (emittablePcMaterials.length > 0) {
      const previousConsumption = previousCheckpoint?.consumptions ?? []
      const checkpoint = computeSammelCheckpoint(
        emittablePcMaterials,
        previousConsumption,
        doctorId
      )

      const createdCheckpoint = await this.sammelCheckpointService
        .createCheckpoint(checkpoint, userId)

      data = {
        pcMaterialsRefs: emittablePcMaterials.map(pcMaterial => pcMaterial._id),
        casesRef: emittablePcMaterials.map(pcMaterial => pcMaterial.caseId),
        patients: emittablePcMaterials.map(pcMaterial => pcMaterial.patient),
        sammelCheckpointRef: createdCheckpoint.id,
      }
    }

    return data
  }

  async sendNotification (isCancellation: boolean, userId: string) {
    const notificationType = isCancellation
      ? NotificationType.PRESCRIPTION_CANCELLATION_GENERATED
      : NotificationType.PRESCRIPTION_STANDARD_GENERATED

    const notificationTitle = isCancellation
      ? 'notifications_prescriptionCancellationGenerated_title'
      : 'notifications_prescriptionGenerated_title'

    const notificationBody = isCancellation
      ? 'notifications_billCancellationGenerated_body'
      : 'notifications_prescriptionCancellationGenerated_body'

    await createNotifications(
      this.notificationsClient,
      {
        usersIds: [userId],
        type: notificationType,
        title: notificationTitle,
        body: notificationBody,
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: '/pc-materials/prescriptions',
        },
      }
    )
  }

  async emitPrescriptions (prescriptionSnapshotRef: string, userId: string) {
    try {
      const logMessage = `Processing emission request of prescriptionSnapshot ${prescriptionSnapshotRef}`
      this.loggingService.logInfo(logMessage, false)

      const prescriptionSnapshot =
        await this.prescriptionSnapshotModel.findOne({ _id: prescriptionSnapshotRef })
      if (!prescriptionSnapshot) throw new Error('Prescription snapshot not found') // Should never happen

      const { pcMaterials, cases } = prescriptionSnapshot

      const prescriptionNumber = await callMSWithTimeoutAndRetry(
        this.systemConfigurationClient,
        { role: 'prescriptionNumber', cmd: 'get' },
        {},
        Component.BILLING,
      )

      const patients = Object.values(pcMaterials.reduce((acc, pcMaterial) => {
        acc[pcMaterial.patient.patientId] = {
          name: pcMaterial.patient.name,
          surname: pcMaterial.patient.surname,
          birthDate: pcMaterial.patient.birthDate,
          patientId: pcMaterial.patient.patientId
        }

        return acc
      }, {} as Record<string, IPcMaterial['patient']>))

      const casesRef = pcMaterials.map(pcMaterial => pcMaterial.caseId)
      const pcMaterialsRef = pcMaterials.map(pcMaterial => pcMaterial._id)
      const doctorsIds = pcMaterials.reduce((acc, pcMaterial) => {
        const doctorId = cases
          .find(c => c._id === pcMaterial.caseId)?.bookingSection?.doctorId
        if (doctorId && !acc.includes(doctorId))
          acc.push(doctorId)
        return acc
      }, [] as string[])

      let additionalData = {}

      additionalData =
        await this.generatePrescriptionsammels(pcMaterials, doctorsIds[0], userId)

      const prescription = {
        prescriptionNumber,
        creatorId: userId,
        debtor: pcMaterials[0].debtor,
        patients,
        status: EPrescriptionStatus.EMITTED,
        casesRef,
        pcMaterialsRef,
        doctorsIds,
        sammelCheckpointRef: null,
        ...additionalData,
      }

      await this.prescriptionModel.create(prescription)

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.PRESCRIPTION,
        newObj: prescription,
      })

      const pcMaterialsIds = pcMaterials.map(pcMaterial => pcMaterial._id)
      await this.pcMaterialsService.setPcMaterials(
        pcMaterialsIds, {
          status: EPcMaterialsStatus.PROCESSED,
          cancelled: false,
          elaborationInProgress: false,
        }
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async cancelPrescriptionsammels (
    prescriptionToRefund: IPrescription,
    sammelCheckpoint: ISammelCheckpoint,
    userId: IUser['_id'],
    pcMaterials: IPcMaterial[]
  ) {
    if (!prescriptionToRefund.doctorsIds.length) throw new Error('error_pc_materials_without_doctor')
    if (prescriptionToRefund.doctorsIds.length > 1) throw new Error('error_pc_materials_to_much_doctors')

    const lastDoctorCheckpoint = await this.sammelCheckpointService
      .findLatestBySurgeon(prescriptionToRefund.doctorsIds[0])

    const positionsArticles = getParsedArticlesFromPcMaterials(pcMaterials)
    const newConsumptions = Object.values(positionsArticles).map(s => {
      const lastChekpointRemainder = lastDoctorCheckpoint?.consumptions
        ?.find(c => c.itemCode === s.materialId)?.remainder ?? 0
      const totalRevenue = sammelCheckpoint?.consumptions
        ?.find(c => c.itemCode === s.materialId)?.usedAmount
      const newRemainder = lastChekpointRemainder - (s.total - totalRevenue)

      return {
        totalAmount: 0,
        totalAmountWithPrevious: 0,
        billingAmount: 0,
        usedAmount: 0,
        remainder: newRemainder,
        description: s.description,
        itemCode: s.materialId,
      }
    })

    const consumptions = newConsumptions
      .concat(lastDoctorCheckpoint.consumptions
        .filter(consumption => !newConsumptions
          .find(newConsumption => newConsumption.itemCode === consumption.itemCode)))

    await this.sammelCheckpointService.createCheckpoint({
      doctorId: prescriptionToRefund.doctorsIds[0],
      consumptions,
      createdAt: new Date()
    }, userId)
  }

  async cancelPrescriptions (prescriptionSnapshotRef: string, userId: string) {
    try {
      const prescriptionSnapshot =
        await this.prescriptionSnapshotModel.findOne({ _id: prescriptionSnapshotRef })
      if (!prescriptionSnapshot) throw new Error('Prescription snapshot not found') // Should never happen

      const logMessage = `Processing cancellation request of prescriptionSnapshot ${prescriptionSnapshotRef}`
      this.loggingService.logInfo(logMessage, false)

      const prescriptionToRefund = prescriptionSnapshot.prescriptionToRefund
      const sammelCheckpoint = prescriptionSnapshot.sammelCheckpoint
      const pcMaterials = prescriptionSnapshot.pcMaterials

      await this.cancelPrescriptionsammels(
        prescriptionToRefund, sammelCheckpoint, userId, pcMaterials
      )

      await this.prescriptionModel.findByIdAndUpdate(
        prescriptionToRefund._id,
        { status: EPrescriptionStatus.CANCELLED }
      )

      const newValue = await this.prescriptionModel.findOne({ _id: prescriptionToRefund._id })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.PRESCRIPTION,
        prevObj: prescriptionToRefund,
        newObj: newValue.toJSON(),
      })

      const pcMaterialsIds = pcMaterials.map(pcMaterial => pcMaterial._id)
      await this.pcMaterialsService.setPcMaterials(
        pcMaterialsIds, {
          status: EPcMaterialsStatus.READY,
          cancelled: true,
          elaborationInProgress: false,
        }
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  @Process()
  async generatePrescription (job: Job<IGeneratePrescriptionJob>) {
    try {
      const data = job.data
      const { prescriptionSnapshotRef, isCancellation, userId, tenantId } = data
      const als = (global as any).als
      const store = { tenantId }
      als.enterWith(store)

      const lockDuration = parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION)

      await this.redis.redislock
        .using(['generatePrescriptions'], lockDuration, async () => {
          if (isCancellation)
            await this.cancelPrescriptions(prescriptionSnapshotRef, userId)
          else
            await this.emitPrescriptions(prescriptionSnapshotRef, userId)

          await this.sendNotification(isCancellation, userId)
        })

      await job.progress(100)
    } catch (error) {
      await this.loggingService.throwErrorAndLog(error)
    }
  }
}
