import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectModel } from '@nestjs/mongoose'
import { PcMaterial } from 'src/schemas/pcMaterial.schema'
import { Model } from 'mongoose'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'
import { format } from 'date-fns'
import {
  Case,
  Component,
  IAnagraphicVersion,
  OpStandardMaterial,
  UserPermissions,
  anagraphicsTypes,
  dateString,
  callMSWithTimeoutAndRetry,
  QueryCasesDto,
  OpStandardMedication,
  IAnagraphicRow,
  MaterialUsageItem,
  IArticleConsumption,
  IUser,
  EPcMaterialsStatus,
  formatVersionForFE,
  IPcMaterial,
  Patient,
  PrescriptionsPcMaterialsRequestDTO,
  systemConfigurationSections,
  calculatePcMaterial,
} from '@smambu/lib.constantsjs'

import { SammelCheckpoint } from 'src/schemas/sammelCheckpoint.schema'
import { SammelCheckpointService } from './sammelcheckpoint.service'
import { BillingService } from './billing.service'

@Injectable()
export class PcMaterialsService {
  constructor (
    @Inject('USERS_CLIENT') private readonly usersClient: ClientProxy,
    @Inject('ANAGRAPHICS_CLIENT') private readonly anagraphicsClient: ClientProxy,
    @Inject('SYSTEM_CONFIGURATION_CLIENT') private readonly systemConfigurationClient: ClientProxy,
    @Inject('CASES_CLIENT') private readonly casesClient: ClientProxy,
    @InjectModel(PcMaterial.name) private readonly pcMaterialModel: Model<PcMaterial>,
    private readonly billingService: BillingService,
    private readonly envConfigsService: EnvConfigsService,
    private readonly loggingService: LoggingService,
    @Inject(forwardRef(() => SammelCheckpointService))
    private readonly sammelCheckpointService: SammelCheckpointService,
  ) {}

  async getAnagraphicVersion (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date,
    userPermissions
  ) {
    const payload = {
      anagraphicType,
      subType,
      date,
      userPermissions
    }

    const pattern = { role: 'anagraphic', cmd: 'getTargetAnagraphic' }

    const version = await callMSWithTimeoutAndRetry(
      this.anagraphicsClient,
      pattern,
      payload,
      Component.BILLING
    )

    return formatVersionForFE(version)
  }

  async getPcMaterialsByCasesIds (
    caseIds: string[],
    status?: EPcMaterialsStatus
  ): Promise<IPcMaterial[]> {
    try {
      return this.pcMaterialModel.find({
        caseId: { $in: caseIds },
        ...(status ? { status } : {})
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPcMaterialsByIds (ids: string[]): Promise<IPcMaterial[]> {
    try {
      return this.pcMaterialModel.find({ _id: { $in: ids } })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async setPcMaterials (pcMaterialsIds: string[], body: Partial<IPcMaterial>): Promise<boolean> {
    try {
      await this.pcMaterialModel.updateMany(
        { _id: { $in: pcMaterialsIds } },
        body
      )

      if (body.status != null || body.elaborationInProgress != null) {
        const status = body.status != null ? body.status : undefined
        const elaborationInProgress = body.elaborationInProgress != null
          ? body.elaborationInProgress
          : undefined
        const cancelled = body.cancelled != null ? body.cancelled : undefined

        const casesPcMaterials = pcMaterialsIds
          .map(_id => ({
            _id,
            status,
            elaborationInProgress,
            cancelled,
          }))

        const data = { casesPcMaterials }
        await callMSWithTimeoutAndRetry(
          this.casesClient,
          { role: 'cases', cmd: 'updateCasesPcMaterials' },
          data,
          Component.BILLING
        )
      }

      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updatePcMaterial (caseItem: Case, patient: Patient | null) {
    try {
      const oldData = await this.pcMaterialModel.findOne({ caseId: caseItem.caseId })

      if (oldData?.status === EPcMaterialsStatus.PROCESSED ||
          oldData?.status === EPcMaterialsStatus.READY)
        return oldData

      const translator = await this.envConfigsService.getTranslator()

      const doctor = await callMSWithTimeoutAndRetry(
        this.usersClient,
        { role: 'user', cmd: 'getUserDetail' },
        { id: caseItem.bookingSection.doctorId },
        Component.BILLING,
      )

      const materialAnagraphic = await this.getAnagraphicVersion(
        anagraphicsTypes.MATERIALS_DATABASE,
        anagraphicsTypes.MATERIALS_DATABASE,
        format(new Date(caseItem.bookingSection.date), dateString),
        {},
      )

      const supplierCodes = (await callMSWithTimeoutAndRetry(
        this.systemConfigurationClient,
        { role: 'SystemConfigurationSection', cmd: 'get' },
        { section: systemConfigurationSections.SUPPLIER_CODES },
        Component.BILLING
      )).data

      const newData = calculatePcMaterial(
        translator,
        caseItem,
        doctor,
        materialAnagraphic,
        supplierCodes,
        patient,
        // @ts-expect-error difformity between types
        oldData,
      )

      if (oldData)
        return this.pcMaterialModel.findOneAndUpdate(
          { caseId: caseItem.caseId },
          newData,
          { new: true }
        )
      else
        return this.pcMaterialModel.create(newData)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async reviewPcMaterial (pcMaterialId: string) {
    try {
      const pcMaterial = await this.pcMaterialModel.findOne({ _id: pcMaterialId })
      if (!pcMaterial)
        throw new Error('Pc material not found') // Should never happen

      if (pcMaterial.status !== EPcMaterialsStatus.NOT_READY)
        throw new Error('Pc material is not ready') // Should never happen

      pcMaterial.reviewed = true
      pcMaterial.status = EPcMaterialsStatus.READY
      await pcMaterial.save()

      return pcMaterial
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPrescriptionsPcMaterials (
    request: PrescriptionsPcMaterialsRequestDTO,
    userPermissions: UserPermissions
  ): Promise<MaterialUsageItem[]> {
    try {
      const getCasesByDoctorID = async (
        request: PrescriptionsPcMaterialsRequestDTO,
        userPermissions: UserPermissions
      ) => {
        const queryCaseDTO: QueryCasesDto = {
          doctorId: request.doctorId,
          datePattern: request.datePattern,
          toTimestamp: request.toTimestamp,
        }
        const pattern = { role: 'cases', cmd: 'getCases' }

        const payloadData = { query: queryCaseDTO, userPermissions }
        const casesByDoctorId: { results: Case[] } =
          await callMSWithTimeoutAndRetry(
            this.casesClient,
            pattern,
            payloadData,
            Component.BILLING
          )

        return casesByDoctorId.results
      }

      const filterCasesWithNotProcessedPcMaterial = async (cases: Case[]) =>
        cases
          .filter(
            caseItem => caseItem.pcMaterial?.status != null &&
            caseItem.pcMaterial?.status !== EPcMaterialsStatus.PROCESSED
          )

      const countMaterialsUsageByCase = (
        caseMaterialsMap: {id: string, material: OpStandardMaterial[]} | {},
        materials: Omit<OpStandardMaterial | OpStandardMedication, 'prefill'>[]
      ) => {
        const getMaterialKey = (material: Omit<OpStandardMaterial | OpStandardMedication, 'prefill'>): string => {
          if ('materialId' in material)
            return (material as OpStandardMaterial).materialId
          else
            return (material as OpStandardMedication).medicationId
        }

        materials.reduce((acc, current) => {
          if (!acc[getMaterialKey(current)])
            acc[getMaterialKey(current)] = 0

          acc[getMaterialKey(current)] = acc[getMaterialKey(current)] + current.amount
          return acc
        }, caseMaterialsMap)
      }

      const materialsUsedByCase = (cases: Case[]) => {
        let materials: {id: string, material: OpStandardMaterial[]} | {} = {}

        cases
          .forEach(cas => {
            countMaterialsUsageByCase(materials, cas.preOpSection.materials)
            countMaterialsUsageByCase(materials, cas.preOpSection.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.gloves.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.gloves.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.positioningTools.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.positioningTools.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.equipment.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.equipment.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.disinfection.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.disinfection.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.covering.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.covering.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.surgicalInstruments.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.surgicalInstruments.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.disposableMaterial.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.disposableMaterial.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.sutureMaterial.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.sutureMaterial.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.medication_rinse.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.medication_rinse.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.extras.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.extras.medications)

            countMaterialsUsageByCase(materials, cas.intraOpSection.particularities.materials)
            countMaterialsUsageByCase(materials, cas.intraOpSection.particularities.medications)

            countMaterialsUsageByCase(materials, cas.postOpSection.materials)
            countMaterialsUsageByCase(materials, cas.postOpSection.medications)
            countMaterialsUsageByCase(materials, cas.anesthesiaSection.materials)
            countMaterialsUsageByCase(materials, cas.anesthesiaSection.medications)
            countMaterialsUsageByCase(materials, cas.anesthesiaSection.ventilationMaterials)
          })
        return materials
      }

      const getSammelMaterialAnagraphic = async (userPermissions: UserPermissions) => {
        const bookingDate = format(new Date(), dateString)
        const result: IAnagraphicVersion = await this.billingService.getAnagraphicVersion(
          anagraphicsTypes.MATERIALS_DATABASE,
          anagraphicsTypes.MATERIALS_DATABASE,
          bookingDate,
          userPermissions
        )
        return result.rows.reduce((accumulator, current) => {
          if (current.sprechstundenbedarf)
            accumulator[`${current.artikelnummer}`] = current
          return accumulator
        }, {})
      }

      const getSammelCheckpointMap = async (
        doctorId: string
      ): Promise<{[key: string]: IArticleConsumption}> => {
        const sammelCheckpoint: SammelCheckpoint = await this.sammelCheckpointService
          .findLatestBySurgeon(doctorId)

        if (!sammelCheckpoint)
          return {}

        const consumptionsMap = sammelCheckpoint.consumptions.reduce((accumulator, current) => {
          accumulator[current.itemCode] = current
          return accumulator
        }, {})

        return consumptionsMap
      }

      const computeMaterialUsage = (
        materialsUsage: {id: string, material: OpStandardMaterial[]} | {},
        sammelMaterialsAnagraphic: {[key: string]: IAnagraphicRow},
        consumptionsMap: {[key: string]: IArticleConsumption},
        doc: IUser
      ) => {
        const result: MaterialUsageItem[] = []
        Object.keys(materialsUsage).forEach(key => {
          if (Object.keys(sammelMaterialsAnagraphic).includes(key)) {
            const materialUsage = materialsUsage[key]
            const surplus = consumptionsMap[key]?.remainder ?? 0

            if (materialUsage > 0 || surplus > 0) {
              const materialAnagraphic: IAnagraphicRow = sammelMaterialsAnagraphic[key]
              const total = parseInt(materialUsage) + surplus

              const billableUnits = materialAnagraphic.faktor &&
                !isNaN(parseInt(materialAnagraphic?.faktor as string))
                ? Math.floor(total / parseInt(materialAnagraphic.faktor as string))
                : 0

              const remainingAmount = total - (billableUnits *
                (parseInt(materialAnagraphic.faktor as string) || 0))

              const materialUsageItem: MaterialUsageItem = {
                ...materialAnagraphic,
                doctor: doc,
                amount_used: materialUsage,
                total,
                surplus,
                billableUnits,
                remainingAmount,
              } as unknown as MaterialUsageItem

              result.push(materialUsageItem)
            }
            delete consumptionsMap[key]
          }
        })

        Object.keys(consumptionsMap).forEach(key => {
          if (Object.keys(sammelMaterialsAnagraphic).includes(key)) {
            const surplus = consumptionsMap[key].remainder
            if (surplus > 0) {
              const materialAnagraphic: IAnagraphicRow = sammelMaterialsAnagraphic[key]
              const total = surplus
              const remainingAmount = total

              const materialUsageItem: MaterialUsageItem = {
                ...materialAnagraphic,
                doctor: doc,
                amount_used: 0,
                total,
                surplus,
                billableUnits: 0,
                remainingAmount,
              } as unknown as MaterialUsageItem

              result.push(materialUsageItem)
            }
          }
        })

        return result
      }

      const casesByDoctorId: Case[] = await getCasesByDoctorID(request, userPermissions)

      const casesWithGeneratedPcMaterial: Case[] =
        await filterCasesWithNotProcessedPcMaterial(casesByDoctorId)
      const materialsUsage: {id: string, material: OpStandardMaterial[]} | {} =
        materialsUsedByCase(casesWithGeneratedPcMaterial)

      const doc = casesByDoctorId.find(cas => cas.associatedDoctor)?.associatedDoctor

      const sammelMaterialsAnagraphic: {[key: string]: IAnagraphicRow} =
        await getSammelMaterialAnagraphic(userPermissions)

      const consumptionsMap = await getSammelCheckpointMap(request.doctorId)

      const result =
        await computeMaterialUsage(materialsUsage, sammelMaterialsAnagraphic, consumptionsMap, doc)

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
