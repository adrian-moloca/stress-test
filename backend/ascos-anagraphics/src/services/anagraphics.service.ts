import { anagraphicsTypes, auditTrailCreate, auditTrailDelete, auditTrailUpdate, callMSWithTimeoutAndRetry, Component, EntityType, formatVersionForFE, getAnagraphicFields, getRandomUniqueId, IAnagraphicFields, IAnagraphicRow, IAnagraphicVersion, isAnagraphicFields, IUser, staticAnagraphicsSetups, tFullAnagraphicSetup, collectionPermissionsParsers, formatExecuteQueryValue, mingoFilterArray, tExecuteQueryPayload, tExpression, tScope, tSupportedLocales, UserPermissions, tDynamicAnagraphicSetup, IAnagraphicSetup, getTabbedAnagraphicSetup, tExpressionResult, getAnagraphicKeys, SOURCE_SCHEMAS, getComposedAnagraphicKey } from '@smambu/lib.constantsjs'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { endOfDay, parseISO, isValid, startOfDay } from 'date-fns'
import { Model } from 'mongoose'
import { AnagraphicData, AnagraphicDataDocument } from '../schemas/anagraphics.schema'
import { ClientProxy } from '@nestjs/microservices'
import { BgDebtorNumber, BgDebtorNumberDocument } from 'src/schemas/bgDebtorNumber.schema'
import { generateDataIds, LoggingService, resetTenantsData } from '@smambu/lib.commons-be'

@Injectable()
export class AnagraphicsService {
  private models: { model: Model<any>; label: string }[]
  constructor (
    @InjectModel(anagraphicsTypes.MATERIALS_DATABASE)
    private materialsDatabase: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.PRIVATEINSURANCES)
    private privateInsurances: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.PUBLICINSURANCES)
    private publicInsurances: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.BGINSURANCES)
    private BGInsurances: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.SIEBE)
    private siebe: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.SETS)
    private sets: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.EINZELINSTRUMENTE)
    private einzelInstrumente: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.OPSCATALOGUE)
    private opsCatalogue: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.EBM)
    private ebm: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.GOACATA)
    private goaCatA: Model<AnagraphicDataDocument>,
    @InjectModel(anagraphicsTypes.GOACATB)
    private goaCatB: Model<AnagraphicDataDocument>,
    @InjectModel(BgDebtorNumber.name)
    private bgDebtorNumber: Model<BgDebtorNumberDocument>,
    @InjectModel('DynamicAnagraphics')
    private dynamicAnagraphics: Model<AnagraphicDataDocument>,
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    @Inject('UR_CLIENT')
    private readonly universalReportingClient: ClientProxy,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.ANAGRAPHICS)
    this.models = [
      { model: this.bgDebtorNumber, label: 'bgdebtornumbers' },
      { model: this.materialsDatabase, label: 'materialsdatabases' },
      { model: this.privateInsurances, label: 'privateinsurances' },
      { model: this.publicInsurances, label: 'publicinsurances' },
      { model: this.BGInsurances, label: 'bginsurances' },
      { model: this.siebe, label: 'siebes' },
      { model: this.sets, label: 'sets' },
      { model: this.einzelInstrumente, label: 'einzelinstrumentes' },
      { model: this.opsCatalogue, label: 'opscatalogues' },
      { model: this.ebm, label: 'ebms' },
      { model: this.goaCatA, label: 'goacatas' },
      { model: this.goaCatB, label: 'goacatbs' },
    ]
  }

  getSchema (collectionName: IAnagraphicSetup['collectionName']) {
    const schema = this[collectionName]
    if (schema == null)
      return this.dynamicAnagraphics

    return schema
  }

  async getAnagraphicSetup (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
  ): Promise<IAnagraphicSetup> {
    const data = await callMSWithTimeoutAndRetry(
      this.universalReportingClient,
      { role: 'ur', cmd: 'getDynamicData' },
      {},
      Component.ANAGRAPHICS,
    )

    const dynamicAnagraphics: tDynamicAnagraphicSetup[] = data?.anagraphics ?? []

    const anagraphicsSetups = [
      ...staticAnagraphicsSetups,
      ...dynamicAnagraphics,
    ].reduce((acc, curr) => {
      acc[curr.anagraphicType] = curr

      return acc
    }, {} as Record<string, tFullAnagraphicSetup>)

    if (anagraphicsSetups[anagraphicType] === undefined)
      throw new Error(`Error: anagraphic type "${anagraphicType}" does not have a matching setup`)

    const tabbed = getTabbedAnagraphicSetup(anagraphicsSetups[anagraphicType], subType)

    return tabbed
  }

  async getAnagraphicFields (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
  ) {
    const anagraphicSetup = await this.getAnagraphicSetup(anagraphicType, subType)
    const staticFields = getAnagraphicFields(anagraphicSetup, subType)

    return staticFields
  }

  async getAnagraphicSetupPermissions (
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    userPermissions: UserPermissions,
  ) {
    const anagraphicSetup = await this.getAnagraphicSetup(anagraphicType, subType)
    const canViewAll = await this.evaluateExpression({
      expression: anagraphicSetup.permissionsRequests.view,
      userPermissions,
      scope: { self: { userPermissions } },
    })
    if (canViewAll.value) return { canViewAll: true, canViewNames: true, anagraphicSetup }

    const canViewNames = await this.evaluateExpression({
      expression: anagraphicSetup.permissionsRequests.viewNames,
      userPermissions,
      scope: { self: { userPermissions } },
    })
    if (canViewNames.value) return { canViewAll: false, canViewNames: true }

    return { canViewAll: false, canViewNames: false, anagraphicSetup }
  }

  async getNextVersion (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    fromDate: Date
  ): Promise<AnagraphicData> {
    const schema = this.getSchema(anagraphicSetup.collectionName)

    const results = await schema.aggregate([
      { $match: { anagraphicType, subType, fromDate: { $gt: fromDate } } },
      { $sort: { fromDate: 1 } },
      { $limit: 1 },
    ])

    const nextVersion = results?.[0]
    delete nextVersion?.rows

    return nextVersion
  }

  async getPreviousVersion (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    fromDate: Date
  ): Promise<AnagraphicData> {
    const schema = this.getSchema(anagraphicSetup.collectionName)

    const results = await schema.aggregate([
      { $match: { anagraphicType, subType, fromDate: { $lt: fromDate } } },
      { $sort: { fromDate: -1 } },
      { $limit: 1 },
    ])

    const previousVersion = results?.[0]
    delete previousVersion?.rows

    return previousVersion
  }

  async filterNameAndKey (data: AnagraphicData,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes) {
    if (!data._id || !data.rows) return null
    let filteredData: IAnagraphicRow[] = []
    const fields = await this.getAnagraphicFields(anagraphicType, subType)

    if (Array.isArray(fields) && isAnagraphicFields(fields[0])) {
      filteredData = data.rows.map((row, index) => {
        const filteredRow: IAnagraphicRow = {
          id: index,
          key: getRandomUniqueId()
        }

        fields.forEach((field, fieldId) => {
          if (field.isKey || field.isName || field.isPrice)
            filteredRow[field.name] = row[fieldId]
        })

        return filteredRow
      })
    } else {
      const fieldsArray = fields[subType]

      filteredData = data.rows.map((row, index) => {
        const filteredRow: IAnagraphicRow = {
          id: index,
          key: getRandomUniqueId()
        }

        fieldsArray.forEach(field => {
          if (field.isKey || field.isName || field.isPrice)
            filteredRow[field.name] = row[field.name]
        })

        return filteredRow
      })
    }
    return {
      ...data,
      rows: filteredData
    }
  }

  async getVersionMetadata (
    anagraphicSetup: IAnagraphicSetup,
    subType: anagraphicsTypes,
    versionId: string
  ) {
    try {
      const schema = this.getSchema(anagraphicSetup.collectionName)

      const version = await schema.findById(versionId, { rows: 0 })
      if (!version) return undefined
      return formatVersionForFE(version)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getVersion (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    versionId: string,
    canViewOnlyNames: boolean = false
  ) {
    try {
      const schema = this.getSchema(anagraphicSetup.collectionName)

      const version = await schema.findById(versionId)
      if (!version) return undefined

      const fromDate = version.fromDate
      const nextVersion = await this.getNextVersion(
        anagraphicSetup, anagraphicType, subType, fromDate
      )
      const previousVersion = await this.getPreviousVersion(
        anagraphicSetup, anagraphicType, subType, fromDate
      )

      if (canViewOnlyNames) {
        const versionFiltered = await this.filterNameAndKey(version._doc, anagraphicType, subType)
        return ({
          ...formatVersionForFE(versionFiltered),
          nextVersion,
          previousVersion,
        })
      } else {
        return ({
          ...formatVersionForFE(version._doc),
          nextVersion,
          previousVersion,
        })
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getActiveVersionMetadata (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date: Date,
  ): Promise<IAnagraphicVersion> {
    try {
      const schema = this.getSchema(anagraphicSetup.collectionName)

      const results = await schema
        .find({ anagraphicType, subType, fromDate: { $lte: endOfDay(date) } }, { rows: 0 })
        .sort({ fromDate: -1 })
        .limit(1)

      let version = results?.[0]
      if (!version) {
        const futureResults = await schema
          .find({ anagraphicType, subType, fromDate: { $gte: startOfDay(date) } }, { rows: 0 })
          .sort({ fromDate: 1 })
          .limit(1)
        version = futureResults?.[0]
        if (!version) return undefined
      }

      return formatVersionForFE(version)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getActiveVersion (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    date: Date,
    canViewOnlyNames: boolean = false,
    skipOtherVersions: boolean = false
  ): Promise<IAnagraphicVersion> {
    try {
      const schema = this.getSchema(anagraphicSetup.collectionName)

      const results = await schema
        .find({ anagraphicType, subType, fromDate: { $lte: endOfDay(date) } })
        .sort({ fromDate: -1 })
        .limit(1)
      let version = results?.[0]
      if (!version) {
        const futureResults = await schema
          .find({ anagraphicType, subType, fromDate: { $gte: startOfDay(date) } })
          .sort({ fromDate: 1 })
          .limit(1)

        version = futureResults?.[0]
        if (!version) return undefined
      }

      const fromDate = version.fromDate
      let nextVersion
      let previousVersion
      if (!skipOtherVersions) {
        nextVersion = await this.getNextVersion(anagraphicSetup, anagraphicType, subType, fromDate)
        previousVersion = await this.getPreviousVersion(
          anagraphicSetup, anagraphicType, subType, fromDate
        )
      }

      if (canViewOnlyNames) {
        const versionFiltered = this.filterNameAndKey(version._doc, anagraphicType, subType)

        const result = {
          ...formatVersionForFE(versionFiltered),
          nextVersion,
          previousVersion,
        }
        return result
      } else {
        const result = {
          ...formatVersionForFE(version._doc),
          nextVersion,
          previousVersion,
        }
        return result
      }
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getBGDebtorNumber (key: string) {
    const dbDebtorNumber = await this.bgDebtorNumber.findOne({ key })
    if (dbDebtorNumber?.bgDebtorNumber) {
      return dbDebtorNumber.bgDebtorNumber
    } else {
      const pattern = { role: 'bgDebtorNumber', cmd: 'get' }

      const bgDebtorNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        pattern,
        {},
        Component.ANAGRAPHICS)

      await this.bgDebtorNumber.create({ key, bgDebtorNumber })
      return bgDebtorNumber
    }
  }

  async checkRows (
    rows: IAnagraphicVersion['rows'],
    anagraphicFields: IAnagraphicFields,
  ) {
    const keysFields = anagraphicFields
      .reduce((acc, field) => (field.isKey ? [...acc, field.name] : acc)
        , [])
    const requiredFields = anagraphicFields
      .reduce((acc, field) => (field.required ? [...acc, field.name] : acc)
        , [])

    const alreadyUsedKeys: string[] = []

    const checkedRows = Promise.all(rows.map(async row => {
      requiredFields.forEach(fieldName => {
        if (!row[fieldName]) throw new BadRequestException('anagraphics_field_is_required_error')
      })

      const key = keysFields.map(fieldName => row[fieldName]).join('')

      if (alreadyUsedKeys.includes(key)) throw new Error('anagraphics_duplicate_key_error')
      alreadyUsedKeys.push(key)

      const checkedRow = Promise.all(anagraphicFields.map(async field => {
        if (field?.specialField === 'bgDebtorNumber')
          return this.getBGDebtorNumber(key)

        return row[field.name]
      }))

      return checkedRow
    }))

    return checkedRows
  }

  async editVersion (
    anagraphicSetup: IAnagraphicSetup,
    anagraphicType: anagraphicsTypes,
    subType: anagraphicsTypes,
    version: IAnagraphicVersion,
    user: IUser,
  ): Promise<IAnagraphicVersion> {
    try {
      const anagraphicFields = await this.getAnagraphicFields(anagraphicType, subType)
      const checkedRows = await this.checkRows(version.rows, anagraphicFields)
      const schema = this.getSchema(anagraphicSetup.collectionName)

      const anagraphicFieldsNames = anagraphicFields.map(field => field.name)
      const data = {
        ...version,
        anagraphicType,
        subType,
        rows: checkedRows,
        anagraphicFields: anagraphicFieldsNames,
      }

      const oldData = await schema.findOne({ _id: data._id })

      let newId
      if (oldData) {
        await schema.updateOne({ _id: data._id }, {
          ...data,
          rows: checkedRows,
          updatedAt: new Date(),
        })
        const newValue = await schema.findOne({ _id: data._id })

        await this.loggingService.logInfo(`Anagraphic ${anagraphicType} ${subType} edited`)

        await auditTrailUpdate({
          logClient: this.logClient,
          userId: user.id,
          entityType: EntityType.ANAGRAPHIC,
          prevObj: oldData._doc,
          newObj: newValue._doc,
          anagraphicSetup,
        })

        newId = data._id
      } else {
        const fromDate = parseISO(data.fromDate as unknown as string)
        const endOfDayFromDate = endOfDay(fromDate)
        const startOfDayFromDate = startOfDay(fromDate)
        const anagraphicSameDate = await schema
          .find({
            anagraphicType,
            subType,
            fromDate:
            { $lte: endOfDayFromDate, $gte: startOfDayFromDate }
          })
        if (anagraphicSameDate?.[0]) throw new Error('anagraphics_sameDateVersionAlreadyPresent_error')

        const newAnagraphicData = await schema.create({
          ...data,
          rows: checkedRows,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await auditTrailCreate({
          logClient: this.logClient,
          userId: user.id,
          entityType: EntityType.ANAGRAPHIC,
          newObj: newAnagraphicData._doc,
          anagraphicSetup,
        })

        newId = newAnagraphicData._id
      }

      const store = (global as any).als.getStore()
      const tenantId = store?.tenantId

      if (tenantId === null || tenantId === undefined)
        throw new Error('Missing tenant')

      return this.getVersion(anagraphicSetup, anagraphicType, subType, newId)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteVersion (
    anagraphicSetup: IAnagraphicSetup,
    subType: anagraphicsTypes,
    id: string,
    user: IUser
  ): Promise<Boolean> {
    try {
      const schema = this.getSchema(anagraphicSetup.collectionName)
      const version = await schema.findById(id)
      if (!version) throw new Error('anagraphics_deleteNotFound_error')

      await schema.deleteOne({ _id: id })

      await auditTrailDelete({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.ANAGRAPHIC,
        prevObj: version._doc,
        anagraphicSetup,
      })

      return true
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async evaluateExpression ({
    expression,
    userPermissions,
    scope,
    selectedLocale,
  }: {
    expression: tExpression,
    userPermissions: UserPermissions,
    scope?: tScope,
    selectedLocale?: tSupportedLocales,
  }): Promise<tExpressionResult> {
    const pattern = { role: 'UR', cmd: 'evaluateExpression' }
    const payload = { expression, scope, selectedLocale, userPermissions }

    const result: tExpressionResult = await callMSWithTimeoutAndRetry(
      this.universalReportingClient,
      pattern,
      payload,
      Component.ANAGRAPHICS,
    )
    return result
  }

  async executeQuery ({
    query,
    select,
    anagraphicType,
    subType,
    atDate,
    userPermissions,
    __ignorePermissions,
  }: tExecuteQueryPayload) {
    try {
      // Sort not needed
      const anagraphicSetup = await this.getAnagraphicSetup(anagraphicType, subType)
      const parsedAtDate = new Date(atDate)

      if (!isValid(parsedAtDate))
        throw new Error('invalidAtDate')

      const version = await this.getActiveVersion(
        anagraphicSetup,
        anagraphicType,
        subType,
        parsedAtDate,
        false,
        true
      )

      const anagraphicKeys = getAnagraphicKeys(
        anagraphicSetup,
        subType as anagraphicsTypes
      )

      let filteredRows = []

      if (!__ignorePermissions) {
        const {
          canViewAll,
          canViewNames,
          anagraphicSetup,
        } = await this.getAnagraphicSetupPermissions(
          anagraphicType,
          subType,
          userPermissions
        )

        filteredRows = await collectionPermissionsParsers.anagraphics(
          mingoFilterArray(
            version.rows,
            query
          ) as IAnagraphicRow[],
          userPermissions,
          anagraphicSetup,
          subType,
          canViewAll,
          canViewNames,
        )
      } else {
        filteredRows = mingoFilterArray(version.rows, query)
      }

      const rowsKeys = filteredRows.map(row => {
        const keys = anagraphicKeys.map((key: string) => row[key])
        const composedKeys = getComposedAnagraphicKey(keys)

        return composedKeys
      })

      const getRowDeps = (_row, index) => [{ path: `${SOURCE_SCHEMAS.ANAGRAPHICS}.${rowsKeys[index]}` }]

      if (select.length === 0) {
        const result = await formatExecuteQueryValue(
          SOURCE_SCHEMAS.ANAGRAPHICS,
          query,
          filteredRows,
          getRowDeps
        )

        return result
      }

      const limitedRows = filteredRows.map(row =>
        select.reduce((acc, field) => ({
          ...acc,
          [field]: row[field]
        }), {} as IAnagraphicRow))

      const result = await formatExecuteQueryValue(
        'anagraphics',
        query,
        limitedRows,
        getRowDeps
      )

      return result
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async generateIds (data: Record<string, IAnagraphicRow[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetData (data: Record<string, IAnagraphicRow[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
