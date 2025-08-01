import { ISystemConfiguration, systemConfigurationSections, NumberingSystemTypes, Component, IUser, EntityType, systemConfigurationSaveControl, auditTrailCreate, auditTrailUpdate, generateInvoiceNumber, callMSWithTimeoutAndRetry, tExecuteQueryPayload, formatExecuteQueryValue, IFormattedCapability, tPermissionDomains, formatCapabilities, tSystemEnvironmentConfig, Translator, SOURCE_SCHEMAS } from '@smambu/lib.constantsjs'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { SystemConfigurationDataDocument } from '../schemas/systemConfiguration.schema'
import { NumberingSystem, NumberingSystemDocument } from 'src/schemas/numberingSystem.schema'
import { ClientProxy } from '@nestjs/microservices'
import { getYear } from 'date-fns'
import { ReceiptNumbers, ReceiptNumbersDocument } from 'src/schemas/ReceiptNumbers'
import { createNumberingDocumentIfNotExists, updateNumberingDocument } from 'src/utilities/mongo-utilities'
import { LoggingService, RedisClientService, addTenantIdToString, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'

@Injectable()
export class SystemConfigurationService {
  private models: {
    model: Model<any>;
    label: string;
    schema: systemConfigurationSections | string
  }[]

  constructor (
    @InjectModel(systemConfigurationSections.FILE_CONFIGS)
    private fileConfigs: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.PRICE_POINT_CONFIGS)
    private pricePointConfigs: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.SUBJECT_AREAS)
    private subjectAreas: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.CASE_NUMBERS_CONFIGS)
    private caseNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS)
    private pcMaterialsNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.PATIENT_NUMBERS_CONFIGS)
    private patientNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS)
    private debtorNumbersConfiguration: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.SUPPLIER_CODES)
    private supplierCodes: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.COUNT_CONTROL)
    private countControl: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.GENERAL_DATA)
    private generalData: Model<SystemConfigurationDataDocument>,
    @InjectModel(systemConfigurationSections.ENVIRONMENT_CONFIG)
    private environmentConfigurations: Model<SystemConfigurationDataDocument>,
    @InjectModel(NumberingSystem.name)
    private readonly numberingSystemModel: Model<NumberingSystemDocument>,
    @InjectModel(ReceiptNumbers.name)
    private readonly receiptNumbersModel: Model<ReceiptNumbersDocument>,
    @Inject(RedisClientService)
    private readonly redis: RedisClientService,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    @Inject('SCHEDULING_CASES_CLIENT')
    private readonly casesClient: ClientProxy,
    @Inject('USERS_CLIENT')
    private readonly usersClient: ClientProxy,
    @Inject('PATIENTS_ANAGRAPHICS_CLIENT')
    private readonly patientsClient: ClientProxy,
    @Inject('UR_CLIENT')
    private readonly urClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.SYSTEM_CONFIGURATION)
    this.models = [
      { model: this.caseNumbersConfiguration, label: 'casenumbersconfigurations', schema: systemConfigurationSections.CASE_NUMBERS_CONFIGS },
      { model: this.pcMaterialsNumbersConfiguration, label: 'pcmaterialsnumbersconfiguration', schema: systemConfigurationSections.PC_MATERIALS_NUMBERS_CONFIGS },
      { model: this.countControl, label: 'countcontrols', schema: systemConfigurationSections.COUNT_CONTROL },
      { model: this.debtorNumbersConfiguration, label: 'debtornumbersconfigurations', schema: systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS },
      { model: this.environmentConfigurations, label: 'environmentconfigurations', schema: systemConfigurationSections.ENVIRONMENT_CONFIG },
      { model: this.fileConfigs, label: 'fileconfigs', schema: systemConfigurationSections.FILE_CONFIGS },
      { model: this.generalData, label: 'generaldatas', schema: systemConfigurationSections.GENERAL_DATA },
      { model: this.numberingSystemModel, label: 'numberingsystems', schema: NumberingSystem.name },
      { model: this.patientNumbersConfiguration, label: 'patientnumbersconfigurations', schema: systemConfigurationSections.PATIENT_NUMBERS_CONFIGS },
      { model: this.pricePointConfigs, label: 'pricepointconfigs', schema: systemConfigurationSections.PRICE_POINT_CONFIGS },
      { model: this.receiptNumbersModel, label: 'receiptnumbers', schema: ReceiptNumbers.name },
      { model: this.subjectAreas, label: 'subjectareas', schema: systemConfigurationSections.SUBJECT_AREAS },
      { model: this.supplierCodes, label: 'suppliercodes', schema: systemConfigurationSections.SUPPLIER_CODES },
    ]
  }

  getSchema (subType: string) {
    const schema = this.models.find(m => m.schema === subType)?.model
    if (!schema) throw new Error(`Schema ${subType} not found`)

    return schema
  }

  async getSystemConfiguration (): Promise<Partial<ISystemConfiguration>> {
    try {
      const results = await Promise.all(
        Object.values(systemConfigurationSections)
          .map(section => this.getSchema(section).findOne({ section })),
      )

      return results.reduce(
        (acc, curr) => ({
          ...acc,
          ...(curr?.section ? { [curr.section]: curr.data } : {}),
        }),
        {},
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getSystemConfigurationSection (
    section: systemConfigurationSections,
  ): Promise<ISystemConfiguration[systemConfigurationSections]> {
    try {
      const schema = this.getSchema(section)

      const result = await schema.findOne({ section })

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editSystemConfigurationSection (
    section: systemConfigurationSections,
    data: any,
    user?: IUser,
  ): Promise<boolean> {
    try {
      const store = global.als.getStore()

      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')

      const schema = this.getSchema(section)
      const oldData = await schema.find({ section })
      if (!systemConfigurationSaveControl[section]?.(data))
        throw new BadRequestException('systemConfiguration_invalidData')

      if (oldData?.[0]) {
        await schema.updateOne({ section }, { data })
        const newValue = await schema.findOne({ section })

        await auditTrailUpdate({
          logClient: this.logClient,
          userId: user?.id ?? '',
          entityType: EntityType.SYSTEM_CONFIGURATION,
          prevObj: oldData[0]._doc,
          newObj: newValue._doc,
        })
      } else {
        await schema.create({ section, data })
        const newValue = await schema.findOne({ section })
        await auditTrailCreate({
          logClient: this.logClient,
          userId: user?.id ?? '',
          entityType: EntityType.SYSTEM_CONFIGURATION,
          newObj: newValue._doc,
        })
      }

      await this.loggingService.logWarn('System Configuration is changed')

      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCountControlItems () {
    try {
      const schema = this.getSchema('countControl')
      const countControl = await schema.findOne({ section: 'countControl' })
      return countControl?.data ?? []
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateCaseNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('caseNumbersConfiguration')
        const caseNumbersConfiguration = await schema.findOne({ section: 'caseNumbersConfiguration' })
        const pattern = caseNumbersConfiguration?.data?.caseNumber ?? '{number}'

        newNumber = await this.getNumber(pattern, NumberingSystemTypes.CASE)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPrescriptionNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generatePrescriptionNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('pcMaterialsNumbersConfiguration')
        const pcMaterialsNumbersConfiguration = await schema.findOne({ section: 'pcMaterialsNumbersConfiguration' })
        const pattern = pcMaterialsNumbersConfiguration?.data?.prescriptionNumber ?? '{number}'

        newNumber = await this.getNumber(pattern, NumberingSystemTypes.PRESCRIPTION)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPatientNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generatePatientNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('patientNumbersConfiguration')
        const patientNumbersConfiguration = await schema.findOne({ section: 'patientNumbersConfiguration' })
        const pattern = patientNumbersConfiguration?.data?.patientNumber ?? '{number}'

        newNumber = await this.getNumber(pattern, NumberingSystemTypes.PATIENT)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPatientDebtorNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateDebtorNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('debtorNumbersConfiguration')
        const debtorNumbersConfiguration = await schema.findOne({ section: 'debtorNumbersConfiguration' })
        const pattern = debtorNumbersConfiguration?.data?.patientNumber ?? '{number}'

        newNumber = await this.getNumber(pattern,
          NumberingSystemTypes.DEBTOR,
          NumberingSystemTypes.PATIENT_DEBTOR)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getUserDebtorNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateDebtorNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('debtorNumbersConfiguration')
        const debtorNumbersConfiguration = await schema.findOne({ section: 'debtorNumbersConfiguration' })
        const pattern = debtorNumbersConfiguration?.data?.userNumber ?? '{number}'

        newNumber = await this.getNumber(pattern,
          NumberingSystemTypes.DEBTOR,
          NumberingSystemTypes.USER_DEBTOR)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getThirdPartyDebtor () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateDebtorNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('debtorNumbersConfiguration')
        const debtorNumbersConfiguration = await schema.findOne({ section: 'debtorNumbersConfiguration' })
        const pattern = debtorNumbersConfiguration?.data?.thirdPartyNumber ?? '{number}'

        newNumber = await this.getNumber(pattern,
          NumberingSystemTypes.DEBTOR,
          NumberingSystemTypes.THIRD_PARTY_DEBTOR)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getBgDebtorNumber () {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateDebtorNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('debtorNumbersConfiguration')
        const debtorNumbersConfiguration = await schema.findOne({ section: 'debtorNumbersConfiguration' })
        const pattern = debtorNumbersConfiguration?.data?.bgNumber ?? '{number}'
        newNumber = await this.getNumber(pattern,
          NumberingSystemTypes.DEBTOR,
          NumberingSystemTypes.BG_DEBTOR)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getInvoiceNumber (type: NumberingSystemTypes) {
    try {
      let newNumber = null
      await this.redis.redislock.using([addTenantIdToString('generateInvoiceNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        const schema = this.getSchema('invoiceNumbersConfiguration')
        const invoiceNumbersConfiguration = await schema.findOne({ section: 'invoiceNumbersConfiguration' })
        const pattern = invoiceNumbersConfiguration?.data?.[type] ?? '{number}'
        newNumber = await this.getNumber(pattern, NumberingSystemTypes.INVOICE, type)
      })
      return newNumber
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getNumber (pattern: string,
    globalNumbersType: NumberingSystemTypes,
    typedNumbersType?: NumberingSystemTypes) {
    const year = getYear(new Date())
    const yearFieldName = `lastYearlyNumber.${year}`
    let typedNumbers = null
    if (typedNumbersType)
      typedNumbers = await createNumberingDocumentIfNotExists(
        this.numberingSystemModel,
        { type: typedNumbersType },
        {
          type: typedNumbersType,
          lastGlobalNumber: 0,
          lastYearlyNumber: {
            [year]: 0,
          },
        }
      )

    const globalNumbers = await createNumberingDocumentIfNotExists(
      this.numberingSystemModel,
      { type: globalNumbersType },
      {
        type: globalNumbersType,
        lastGlobalNumber: 0,
        lastYearlyNumber: {
          [year]: 0,
        },
      }
    )

    const [number, newNumbers] = generateInvoiceNumber(pattern, new Date(), {
      lastGlobalNumber: globalNumbers?.lastGlobalNumber,
      lastTypedNumber: typedNumbers?.lastGlobalNumber,
      lastYearlyNumber: globalNumbers?.lastYearlyNumber?.[year],
      lastTypedYearlyNumber: typedNumbers?.lastYearlyNumber?.[year],
    })

    if (typedNumbersType)
      await updateNumberingDocument(
        this.numberingSystemModel,
        { type: typedNumbersType },
        {
          lastGlobalNumber: newNumbers.lastTypedNumber,
          [yearFieldName]: newNumbers.lastTypedYearlyNumber,
        },
      )

    await updateNumberingDocument(
      this.numberingSystemModel,
      { type: globalNumbersType },
      {
        lastGlobalNumber: newNumbers.lastGlobalNumber,
        [yearFieldName]: newNumbers.lastYearlyNumber,
      },
    )
    return number
  }

  async getGeneralData () {
    return await this.generalData.findOne({ section: 'debtorNumbersConfiguration' })
  }

  async normalizeDebtorNumbers (limit: number) {
    try {
      const store = (global as any).als.getStore()

      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')

      // change debtorNumbersConfiguration
      const section = systemConfigurationSections.DEBTOR_NUMBERS_CONFIGS
      const schema = this.getSchema(section)
      const oldData = await schema.find({ section })
      await this.editSystemConfigurationSection(section, {
        ...oldData[0].data,
        userNumber: '50{type.number:7}',
        patientNumber: '55{type.number:7}',
        thirdPartyNumber: '51{type.number:7}',
        bgNumber: '52{type.number:7}',
      }, undefined)

      // Empty the last used debtorNumber for users and patients
      await this.numberingSystemModel.deleteOne({ type: NumberingSystemTypes.PATIENT_DEBTOR })
      await this.numberingSystemModel.deleteOne({ type: NumberingSystemTypes.USER_DEBTOR })
      await this.numberingSystemModel.deleteOne({ type: NumberingSystemTypes.BG_DEBTOR })
      await this.numberingSystemModel.deleteOne({ type: NumberingSystemTypes.THIRD_PARTY_DEBTOR })

      // Call users to change debtorNumber to new configuration
      const lastDebtorNumberPattern = { role: 'user', cmd: 'getLastDebtorNumber' }

      const lastDebtorPayloadData = { limit }
      const lastUsedUserDebtorNumber = await callMSWithTimeoutAndRetry(this.usersClient,
        lastDebtorNumberPattern,
        lastDebtorPayloadData,
        Component.SYSTEM_CONFIGURATION)

      // Call patients to change debtorNumber to new configuration
      const nornalizeDebtorNumberPattern = { role: 'patients', cmd: 'normalizeDebtorNumbers' }

      const normalizeDebtorNumberPayloadData = { limit }
      const newPatientsDebtorNumbers = await callMSWithTimeoutAndRetry(this.patientsClient,
        nornalizeDebtorNumberPattern,
        normalizeDebtorNumberPayloadData,
        Component.SYSTEM_CONFIGURATION)

      const lastUsedPatientDebtorNumber =
        newPatientsDebtorNumbers[newPatientsDebtorNumbers.length - 1]

      const pattern = { role: 'cases', cmd: 'normalizeDebtorNumbers' }

      const payloadData = { limit, newPatientsDebtorNumbers }
      const { newBGDebtorNumbers, newTPDebtorNumbers, newPDDebtorNumbers } =
        await callMSWithTimeoutAndRetry(this.casesClient,
          pattern,
          payloadData,
          Component.SYSTEM_CONFIGURATION)

      const lastUsedBGDebtorNumber = newBGDebtorNumbers[newBGDebtorNumbers.length - 1]
      const lastUsedTPDebtorNumber = newTPDebtorNumbers[newTPDebtorNumbers.length - 1]

      await createNumberingDocumentIfNotExists(
        this.numberingSystemModel,
        { type: NumberingSystemTypes.USER_DEBTOR },
        {
          type: NumberingSystemTypes.USER_DEBTOR,
          lastGlobalNumber: lastUsedUserDebtorNumber - 500000000,
          lastYearlyNumber: {
            2024: lastUsedUserDebtorNumber - 500000000,
          },
        }
      )

      await createNumberingDocumentIfNotExists(
        this.numberingSystemModel,
        { type: NumberingSystemTypes.PATIENT_DEBTOR },
        {
          type: NumberingSystemTypes.PATIENT_DEBTOR,
          lastGlobalNumber: lastUsedPatientDebtorNumber.debtorNumber - 550000000,
          lastYearlyNumber: {
            2024: lastUsedPatientDebtorNumber.debtorNumber - 550000000,
          },
        }
      )

      await createNumberingDocumentIfNotExists(
        this.numberingSystemModel,
        { type: NumberingSystemTypes.BG_DEBTOR },
        {
          type: NumberingSystemTypes.BG_DEBTOR,
          lastGlobalNumber: lastUsedBGDebtorNumber.debtorNumber - 520000000,
          lastYearlyNumber: {
            2024: lastUsedBGDebtorNumber.debtorNumber - 520000000,
          },
        }
      )

      await createNumberingDocumentIfNotExists(
        this.numberingSystemModel,
        { type: NumberingSystemTypes.THIRD_PARTY_DEBTOR },
        {
          type: NumberingSystemTypes.THIRD_PARTY_DEBTOR,
          lastGlobalNumber: lastUsedTPDebtorNumber.debtorNumber - 510000000,
          lastYearlyNumber: {
            2024: lastUsedTPDebtorNumber.debtorNumber - 510000000,
          },
        }
      )

      return {
        patient: newPatientsDebtorNumbers,
        bg: newBGDebtorNumbers,
        tp: newTPDebtorNumbers,
        cases: newPDDebtorNumbers
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizePatientsNumbers (limit: number, sleepTime?: number) {
    try {
      const patientNumbersConfiguration = await this.patientNumbersConfiguration.findOne({ section: 'patientNumbersConfiguration' })
      const patientNumberPattern = patientNumbersConfiguration.data.patientNumber
      // eslint-disable-next-line no-console
      console.log('PNN systemConfigurations patientNumberPattern', patientNumberPattern)

      if (patientNumberPattern.includes('year'))
        throw new Error('PNN patientNumberPattern should not include year')

      const debtornumbersconfigurations = await this.debtorNumbersConfiguration.findOne({ section: 'debtorNumbersConfiguration' })
      const patientDebtorNumberPattern = debtornumbersconfigurations.data.patientNumber
      // eslint-disable-next-line no-console
      console.log('PNN systemConfigurations patientDebtorNumberPattern', patientDebtorNumberPattern)

      if (patientDebtorNumberPattern.includes('year'))
        throw new Error('PNN patientDebtorNumberPattern should not include year')

      // eslint-disable-next-line no-console
      console.log('PNN systemConfigurations callPatientsClient')
      const pattern = { role: 'patients', cmd: 'normalizePatientsNumbers' }

      const payloadData = { limit }
      const newPatientsNumbers = await callMSWithTimeoutAndRetry(this.patientsClient,
        pattern,
        payloadData,
        Component.SYSTEM_CONFIGURATION)

      const lastUsedPatientNumber =
        newPatientsNumbers
          .sort((a, b) => a.debtorNumber - b.debtorNumber)[newPatientsNumbers.length - 1]
      // eslint-disable-next-line no-console
      console.log('PNN systemConfigurations lastUsedPatientNumber', lastUsedPatientNumber)

      const year = getYear(new Date())

      await updateNumberingDocument(
        this.numberingSystemModel,
        { type: NumberingSystemTypes.PATIENT },
        {
          lastGlobalNumber: Number(lastUsedPatientNumber.patientNumber),
          [year]: Number(lastUsedPatientNumber.patientNumber)
        },
      )

      // eslint-disable-next-line no-console
      console.log('PNN systemConfigurations finished')
      return newPatientsNumbers
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getReceiptNumber () {
    try {
      let number = null
      await this.redis.redislock.using([addTenantIdToString('generateReceiptNumber')], parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION), async () => {
        await createNumberingDocumentIfNotExists(
          this.receiptNumbersModel,
          {},
          { lastNumber: 0 },
        )
        const updatedDocument = await updateNumberingDocument(
          this.receiptNumbersModel,
          {},
          { $inc: { lastNumber: 1 } },
        )
        number = updatedDocument.lastNumber
      })
      return number
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getLanguage () {
    try {
      const response =
        await this.getSystemConfigurationSection(systemConfigurationSections.ENVIRONMENT_CONFIG)

      // @ts-expect-error have i have ever told you how types are a mess?
      const envConfigs = response.data as tSystemEnvironmentConfig
      return envConfigs.language
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCapabilitiesList (): Promise<{
    capabilitiesList: IFormattedCapability[],
    domains: tPermissionDomains
  }> {
    try {
      const language = await this.getLanguage()
      const translator = new Translator(language)

      const dynamicDataConfigs = await callMSWithTimeoutAndRetry(
        this.urClient,
        { role: 'ur', cmd: 'getDynamicData' },
        { },
        Component.SCHEDULING_CASES,
      )

      return formatCapabilities(
        translator.fromLabel,
        language,
        dynamicDataConfigs?.data?.capabilitiesList
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async executeQuery ({ select, collection }: tExecuteQueryPayload): Promise<any> {
    try {
      // applyGetQueryPermissions, where and sort not needed
      // note: query doesn't have any meaning here, as we have only one document for target for tenant

      const schema = this.getSchema(collection)

      const dataSelect = select.map(s => `data.${s}`)

      const response = await schema.find().select(dataSelect)

      const getSystemConfigurationDeps = () => [{ path: `${SOURCE_SCHEMAS.SYSTEM_CONFIGURATIONS}.${collection}` }]

      const data = response[0]?.data

      return formatExecuteQueryValue(
        SOURCE_SCHEMAS.SYSTEM_CONFIGURATIONS,
        {},
        [data],
        getSystemConfigurationDeps
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
