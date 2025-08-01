import { EnvConfigsService, LoggingService, RedisClientService, addTenantIdToString, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
import {
  AnesthesiologistPresence,
  Capabilities,
  CaseForm,
  CaseStatus,
  Component,
  EPcMaterialsStatus,
  EntityType,
  IPcMaterial,
  IUser,
  NotDeletableCaseStatus,
  NotificationActionType,
  NotificationType,
  PERMISSIONS_DOMAINS_SCOPES,
  Patient,
  SnapshottedContract,
  UserPermissions,
  activeCaseStatutes,
  applyGetQueryPermissions,
  associatePatientDto,
  auditTrailCreate,
  auditTrailUpdate,
  booleanPermission,
  calendarNotesTypes,
  callMSWithTimeoutAndRetry,
  caseStatusOrder,
  checkBookingSectionChanged,
  checkPermission,
  checkSurgerySectionChanged,
  collectionPermissionsParsers,
  createNotifications,
  deleteCaseFilesDto,
  extractCaseDataFromOpStandard,
  formatCaseToLimitedCase,
  formatExecuteQueryValue,
  getCapabilityUsers,
  getLockedWeekTimestamp,
  getUsersByCapability,
  permissionRequests,
  statusTimestamps,
  systemConfigurationSections,
  tCaseLastUpdates,
  tExecuteQueryPayload,
  tExpression,
  tExpressionResult,
  tScope,
  tSupportedLocales,
  tURConfigsData,
  updateAnesthesiologistsDto,
  updateMultipleCasesAnesthesiologistsDto,
  URConfigs,
  SOURCE_SCHEMAS,
} from '@smambu/lib.constantsjs'
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { InjectModel } from '@nestjs/mongoose'
import { add, isValid } from 'date-fns'
import { toDate } from 'date-fns-tz'
import * as _ from 'lodash'
import { get, set } from 'lodash'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { CaseLastUpdates } from 'src/schemas/caseLastUpdates'
import { CaseBackup, CaseBackupDocument } from 'src/schemas/casesBackup.schema'
import { LockedWeek, LockedWeekDocument } from 'src/schemas/lockedWeeks.schema'
import { getCaseFilesCount } from 'src/utilities/getAllCaseFilesCount'
import { generateCostEstimatePdf, generateReceiptPdf } from 'src/utilities/pdf'
import { v4 } from 'uuid'
import { Case, CaseDocument } from '../schemas/cases.schema'
import { SchedulingService } from './scheduling.service'
import { ScheduleNotes, ScheduleNotesDocument } from 'src/schemas/scheduleNotes.schema'

/* globals Express */

const path = require('node:path')

@Injectable()
export class CasesService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @Inject('BUCKET_CLIENT')
    private readonly bucketClient: ClientProxy,

    @Inject('BILLING_CLIENT')
    private readonly billingClient: ClientProxy,

    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,

    @Inject('PATIENTS_ANAGRAPHICS_CLIENT')
    private readonly patientsAnagraphicsClient: ClientProxy,

    @Inject('USERS_CLIENT')
    private readonly userClient: ClientProxy,

    @Inject('CONTRACT_CLIENT')
    private readonly contractClient: ClientProxy,

    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,

    @Inject('OR_MANAGEMENT_CLIENT')
    private readonly orManagementClient: ClientProxy,

    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,

    @Inject('UR_CLIENT')
    private readonly universalReportingClient: ClientProxy,

    @Inject(RedisClientService)
    private readonly redis: RedisClientService,

    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,

    @InjectModel(Case.name)
    private readonly caseModel: Model<CaseDocument>,
    @InjectModel(CaseLastUpdates.name)
    private readonly caseLastUpdatesModel: Model<CaseLastUpdates>,
    @InjectModel(LockedWeek.name) private readonly lockedWeekModel: Model<LockedWeekDocument>,
    private readonly loggingService: LoggingService,
    private readonly schedulingService: SchedulingService,
    @InjectModel(CaseBackup.name) private readonly caseBackupModel: Model<CaseBackupDocument>,
    @InjectModel(ScheduleNotes.name)
    private readonly scheduleNotesModel: Model<ScheduleNotesDocument>,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
    this.models = [
      { model: this.caseBackupModel, label: 'casebackups' },
      { model: this.caseLastUpdatesModel, label: 'caselastupdates' },
      { model: this.caseModel, label: 'cases' },
      { model: this.lockedWeekModel, label: 'lockedweeks' },
      { model: this.scheduleNotesModel, label: 'schedulenotes' },
    ]
  }

  createCaseResponse (
    caseDocument: CaseDocument,
    associatedPatient: Patient,
    userPermissions: UserPermissions,
    permissionCheck: boolean = true,
  ) {
    let patient: Patient = null
    const canViewPatient = permissionCheck
      ? booleanPermission(permissionRequests.canViewPatient, {
        userPermissions,
        props: {
          patient: associatedPatient,
        }
      })
      : true
    if (caseDocument?.patientRef)
      if (canViewPatient)
        patient = {
          ...caseDocument.bookingPatient,
          doctorsIds: associatedPatient?.doctorsIds,
        }
      else
        patient = null

    else
      patient = {
        ...caseDocument.bookingPatient,
      }

    return {
      ...caseDocument.toJSON(),
      associatedPatient: associatedPatient ?? null,
      bookingPatient: patient ?? null,
    }
  }

  async getSystemConfiguration (section: systemConfigurationSections) {
    const systemConfigSectionPattern = { role: 'SystemConfigurationSection', cmd: 'get' }

    const payloadData = {
      section,
    }
    const generalData = await callMSWithTimeoutAndRetry(
      this.systemConfigurationClient,
      systemConfigSectionPattern,
      payloadData,
      Component.SCHEDULING_CASES
    )

    return generalData
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

  async evaluateExpression (
    expression: tExpression,
    scope: tScope,
    selectedLocale?: tSupportedLocales,
    userPermissions?: UserPermissions,
  ): Promise<tExpressionResult> {
    const pattern = { role: 'UR', cmd: 'evaluateExpression' }
    const payloadData = { expression, scope, selectedLocale, userPermissions }
    const result: tExpressionResult = await callMSWithTimeoutAndRetry(
      this.universalReportingClient,
      pattern,
      payloadData,
      Component.SCHEDULING_CASES,
    )
    return result
  }

  async createCasesResponse (
    cases: CaseDocument[],
    userPermissions: UserPermissions,
    permissionCheck: boolean = true
  ) {
    const patients = await this.getCasesPatients({ cases, userPermissions, permissionCheck })
    const formattedCases = cases.map(currentCase => this.createCaseResponse(
      currentCase,
      patients[currentCase.patientRef] ?? null,
      userPermissions,
      permissionCheck,
    ))
    return formattedCases
  }

  async getContractSnapshot (oldCase: CaseForm | Case,
    userPermissions: UserPermissions,
    user: any) {
    const pattern = { role: 'contracts', cmd: 'getContract' }

    const payloadData = {
      id: oldCase.bookingSection.contractId,
      userPermissions,
      user,
      permissionCheck: false,
    }
    const contract = await callMSWithTimeoutAndRetry(this.contractClient,
      pattern,
      payloadData,
      Component.SCHEDULING_CASES) as SnapshottedContract

    delete contract.details.surgerySlots
    const opStandardId = oldCase.bookingSection.opStandardId

    contract.opStandards = Object.entries(contract.opStandards)
      .filter(([id]) => id === opStandardId)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    contract.opstandardsArray = Object.values(contract.opStandards)

    return contract
  }

  async createOne (data: CaseForm, user: IUser, userPermissions: UserPermissions) {
    try {
      const getCaseNumberPattern = { role: 'caseNumber', cmd: 'get' }

      const caseNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        getCaseNumberPattern,
        {},
        Component.SCHEDULING_CASES)

      const getOPSPattern = { role: 'contracts', cmd: 'getOpStandard' }

      const opsPayloadData = {
        id: data.bookingSection.opStandardId,
        userPermissions,
      }
      const opStandard = await callMSWithTimeoutAndRetry(this.contractClient,
        getOPSPattern,
        opsPayloadData,
        Component.SCHEDULING_CASES)

      const getCaseRoomPattern = { role: 'orManagement', cmd: 'getCaseRoom' }

      const caseRoomPayloadData = {
        bookingDate: data.bookingSection.date,
        opStandardId: data.bookingSection.opStandardId,
        userPermissions,
      }
      const operatingRoomId = await callMSWithTimeoutAndRetry(this.orManagementClient,
        getCaseRoomPattern,
        caseRoomPayloadData,
        Component.SCHEDULING_CASES)

      const lockedWeekTimestamp = getLockedWeekTimestamp(data.bookingSection.date,
        process.env.VITE_TIME_ZONE)
      const lockedWeek = await this.lockedWeekModel.findOne({ timeStamp: lockedWeekTimestamp })
      const status = lockedWeek ? CaseStatus.LOCKED : CaseStatus.PENDING

      const associatedDoctor = await this.getCaseDoctor({
        doctorId: data.bookingSection.doctorId,
        userPermissions,
        permissionCheck: false,
      })

      const snapshottedContract = await this.getContractSnapshot(data, userPermissions, user)

      const extraCaseData = extractCaseDataFromOpStandard(opStandard)
      const { preOpSection, intraOpSection, postOpSection } = extraCaseData

      const documentData = {
        ...data,
        caseNumber,
        operatingRoomId,
        preOpSection,
        intraOpSection,
        postOpSection,
        anesthesiaSection: {
          ...(data?.anesthesiaSection ?? {}),
          suggestedAnesthesiaList: opStandard?.bookingSection?.anesthesiaList ?? [],
        },
        status,
        associatedDoctor,
        snapshottedContract,
      }

      const newCase = await this.caseModel.create(documentData)

      const autoAnesthesiologistPresence = AnesthesiologistPresence.AUTO

      const newCaseWithAdditionalInfo = await this.caseModel.findOneAndUpdate(
        {
          _id: newCase._id
        },
        {
          anesthesiaSection: {
            ...(newCase.anesthesiaSection ?? {}),
            anesthesiologistPresence: autoAnesthesiologistPresence,
          }
        },
        {
          new: true
        }
      )

      await auditTrailCreate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CASE,
        newObj: newCaseWithAdditionalInfo.toJSON(),
      })

      const usersToNotify = await getUsersByCapability(
        this.userClient,
        {
          capability: Capabilities.P_COST_ESTIMATE_CREATE,
          ownerId: newCaseWithAdditionalInfo.bookingSection.doctorId
        }
      )

      await createNotifications(
        this.notificationsClient,
        {
          usersIds: usersToNotify.map(user => user.id).filter(id => id !== user.id),
          type: NotificationType.NEW_BOOKING_REQUEST,
          title: 'notifications_newBookingRequest_title',
          body: 'notifications_newBookingRequest_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${newCaseWithAdditionalInfo._id}`,
          },
        }
      )

      return newCaseWithAdditionalInfo
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  getCasesOwners (userPermissions: UserPermissions) {
    const casesViewOwners = getCapabilityUsers(Capabilities.P_CASES_VIEW, userPermissions)
    const bookingsViewOwners = getCapabilityUsers(Capabilities.P_BOOKINGS_VIEW, userPermissions)
    let associatedUsersIds: string[] = []
    let canViewAllCases = false
    if (casesViewOwners === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
      canViewAllCases = true
    else
      associatedUsersIds.push(...casesViewOwners)

    if (bookingsViewOwners === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
      canViewAllCases = true
    else
      associatedUsersIds.push(...bookingsViewOwners)

    associatedUsersIds = associatedUsersIds.reduce((acc, curr) => {
      if (!acc.includes(curr)) acc.push(curr)
      return acc
    }, [])
    return { canViewAllCases, associatedUsersIds }
  }

  async getCases ({
    fromTimestamp,
    toTimestamp,
    patientId,
    page,
    limit,
    userPermissions,
    statuses,
    search,
    datePattern,
    sortBy,
    sortOrder,
    doctorId,
    missingFieldsFilter,
    missingInfoFilter,
    limitedCases,
    hideClosedCases,
    pcMaterialsStatuses,
  }: {
    fromTimestamp?: number,
    toTimestamp?: number,
    patientId?: string,
    page?: number,
    limit?: number,
    userPermissions: UserPermissions,
    statuses?: CaseStatus[],
    search?: string,
    datePattern: string
    sortBy: string,
    sortOrder: string,
    doctorId: string
    missingFieldsFilter: string[]
    missingInfoFilter: string[]
    limitedCases: boolean
    hideClosedCases?: boolean,
    pcMaterialsStatuses?: EPcMaterialsStatus[],
  }) {
    try {
      const queryTokens = search ? search.split(' ') : []
      const naiveDates = []
      const timeAwareDates = []
      queryTokens.forEach(token => {
        // TODO: we might at some point want a more general approach for parsing dates
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
          naiveDates.push(date)

        const timeAwareDate = toDate(dateString, {
          timeZone: process.env.VITE_TIME_ZONE,
        })
        if (isValid(timeAwareDate))
          timeAwareDates.push(timeAwareDate)
      })

      const timeRanges = timeAwareDates.map(date => ({
        from: date,
        to: add(date, { days: 1 }),
      }))

      const defaultPaginationLimit = Number(process.env.BE_DEFAULT_PAGINATION_LIMIT)
      const { canViewAllCases, associatedUsersIds } = this.getCasesOwners(userPermissions)
      const dateFilter = fromTimestamp || toTimestamp

      const hideClosedCasesFilter = hideClosedCases ? { closed: false } : {}

      // UR TODO: get missing fields from PcMaterials or Proxies
      const mongoQuery = {
        ...(missingInfoFilter?.length && {
          'billingSection.missingData': {
            $in: missingInfoFilter
          },
        }),
        ...(dateFilter && {
          'bookingSection.date': {
            ...(fromTimestamp && { $gte: new Date(fromTimestamp) }),
            ...(toTimestamp && { $lte: new Date(toTimestamp) }),
          }
        }),
        ...(!canViewAllCases && {
          'bookingSection.doctorId': { $in: associatedUsersIds },
        }),
        ...(patientId && {
          patientRef: patientId,
        }),
        ...(statuses !== undefined && {
          status: { $in: statuses }
        }),
        ...(doctorId && {
          'associatedDoctor.id': doctorId,
        }),
        ...((search && naiveDates.length === 0) && {
          $text: { $search: `\\${search}\\` }
        }),
        ...(missingFieldsFilter?.length && {
          $or: missingFieldsFilter.map(field => ({
            $or: [
              {
                [field]: {
                  $exists: false
                }
              },
              {
                [field]: {
                  $eq: null
                }
              },
              {
                [field]: {
                  $eq: ''
                }
              }
            ]
          }))
        }),
        ...(naiveDates.length && {
          $or: [
            {
              'bookingPatient.birthDate': {
                $in: naiveDates
              }
            },
            {
              $or: timeRanges.map(timeRange => ({
                $and: [
                  {
                    'bookingSection.date': {
                      $gte: timeRange.from
                    }
                  },
                  {
                    'bookingSection.date': {
                      $lt: timeRange.to
                    }
                  }
                ]
              }))
            }

          ]
        }),
        ...pcMaterialsStatuses && {
          'pcMaterial.status': {
            $in: pcMaterialsStatuses
          }
        },
        ...hideClosedCasesFilter
      }

      const pageNumber = !isNaN(Number(page)) ? Number(page) : 0
      const limitNumber = !isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit

      const total = await this.caseModel.countDocuments(mongoQuery)
      const cases = await this.caseModel
        .find(mongoQuery)
        .sort({
          ...(sortBy &&
            sortOrder && { [sortBy]: sortOrder === 'asc' ? 1 : -1 }),
        })
        .skip(pageNumber * limitNumber)
        .limit(limitNumber)

      let formattedCases = await this.createCasesResponse(cases, userPermissions)

      return {
        results: limitedCases
          ? formattedCases.map(c => formatCaseToLimitedCase(c as any))
          : formattedCases,
        total,
        currentPage: !isNaN(Number(page)) ? Number(page) : 0,
        limit: !isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseDoctor ({
    doctorId,
    userPermissions,
    permissionCheck = true,
  }: {
    doctorId: string,
    userPermissions: UserPermissions,
    permissionCheck?: boolean,
  }) {
    const pattern = { role: 'user', cmd: 'getMultipleDoctors' }

    const payloadData = { ids: [doctorId], userPermissions, permissionCheck }

    const doctors = await callMSWithTimeoutAndRetry(this.userClient,
      pattern,
      payloadData,
      Component.SCHEDULING_CASES)

    return doctors?.[0] as IUser
  }

  async getCasesPatients ({
    cases,
    userPermissions,
    permissionCheck = true,
  }: {
    cases: Case[],
    userPermissions: UserPermissions,
    permissionCheck?: boolean,
  }): Promise<Record<string, Patient>> {
    try {
      const patientsIds = cases.reduce((acc, caseItem) => ([
        ...acc,
        ...(caseItem.patientRef && !acc.includes(caseItem.patientRef) ? [caseItem.patientRef] : []),
      ]), [])

      const pattern = { role: 'patients', cmd: 'getPatients' }

      const payloadData = {
        patientsIds,
        userPermissions,
        permissionCheck
      }
      const patients = await callMSWithTimeoutAndRetry(this.patientsAnagraphicsClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      return patients.reduce((acc, patient) => ({ ...acc, [patient.patientId]: patient }), {})
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async sendPdfToBucket (encodedPdf: string, fileName: string) {
    try {
      const pattern = { role: 'file', cmd: 'uploadBase64' }

      const payloadData = {
        fileEncoded: encodedPdf, fileName
      }

      const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      return fileResponse
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async notifyDoctorPdfGenerated ({ doctorId, caseId }: { doctorId: string, caseId: string }) {
    const pattern = { role: 'user', cmd: 'getDoctorAssistants' }

    const payloadData = { doctorId }
    const doctorAssistants = await callMSWithTimeoutAndRetry(this.userClient,
      pattern,
      payloadData,
      Component.SCHEDULING_CASES)

    const usersToNotify = [...doctorAssistants.map(user => user.id), doctorId]
    await createNotifications(
      this.notificationsClient, {
        usersIds: usersToNotify,
        type: NotificationType.COST_ESTIMATE_GENERATED,
        title: 'notifications_costEstimateGenerated_title',
        body: 'notifications_costEstimateGenerated_body',
        action: {
          type: NotificationActionType.INTERNAL_LINK,
          url: `/cases/${caseId}`,
        },
      }
    )
  }

  async handleChangeStatus (
    data: CaseForm,
  ) {
    const caseStatus = data?.status

    const caseTimestamps = data.timestamps

    const statusIsBeforePatientArrived = activeCaseStatutes.includes(caseStatus)
    const patientArrivedTS = caseTimestamps[statusTimestamps.PATIENT_ARRIVED]
    const patientHasArrived = patientArrivedTS !== null && patientArrivedTS !== undefined

    // we prevent the case from advancing "over" the patient arrived status
    // without having (at least) the patient arrived timestamp
    if (statusIsBeforePatientArrived && !patientHasArrived)
      return data

    const caseStatusIndex = caseStatusOrder.indexOf(caseStatus)

    let caseNextStatus = caseStatus
    for (let i = caseStatusIndex; i < caseStatusOrder.length; i++) {
      const currentStatus = caseStatusOrder[i]
      const currentTimeStamp = statusTimestamps[currentStatus]
      const isNewState = currentStatus !== caseStatus

      if (currentStatus === CaseStatus.READY_FOR_ANESTHESIA && isNewState)
        await this.statusChangedToReadyForAnesthesia(data)

      const currentCaseTimestamp = caseTimestamps[currentTimeStamp]
      const timestampIsReached = currentCaseTimestamp !== null && currentStatus !== undefined

      if (timestampIsReached)
        caseNextStatus = currentStatus
    }

    data.status = caseNextStatus

    return data
  }

  async statusChangedToReadyForAnesthesia (caseObj: CaseForm) {
    const pattern = { role: 'countControlItems', cmd: 'get' }

    const countControlItems = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
      pattern,
      {},
      Component.SCHEDULING_CASES)

    caseObj.snapshottedCountControl = countControlItems
  }

  async updateCasePcMaterials (
    dynamicDataConfigs: tURConfigsData[typeof URConfigs.DYNAMIC_DATA],
    data: CaseForm,
    patients: Patient[],
  ) {
    // We don't know if the dynamic data config is loaded in the tenant
    // @ts-expect-error change this when the dynamic config type are done
    if (dynamicDataConfigs?.cases?.pcMaterials?.checkValidCase == null)
      return null

    // @ts-expect-error change this when the dynamic config type are done
    const checkValidCase = dynamicDataConfigs.cases.pcMaterials.checkValidCase
    const isValidCase = await this.evaluateExpression(
      checkValidCase,
      // @ts-expect-error - self is not typed
      { self: data },
    )

    if (isValidCase.value !== true) return null

    const pcMaterial: IPcMaterial = await callMSWithTimeoutAndRetry(
      this.billingClient,
      { role: 'pcMaterials', cmd: 'updatePcMaterial' },
      {
        caseItem: data,
        patient: patients?.[0],
      },
      Component.SCHEDULING_CASES,
    )

    const result = {
      _id: pcMaterial._id,
      status: pcMaterial.status,
      elaborationInProgress: pcMaterial.elaborationInProgress,
      cancelled: pcMaterial.cancelled,
    }

    return result
  }

  async updateOne (data: CaseForm, userPermissions: UserPermissions, user: IUser) {
    try {
      const generalData =
        await this.getSystemConfiguration(systemConfigurationSections.GENERAL_DATA)
      const dynamicDataConfigs =
        await this.getDynamicData()

      const updatedCase = await this.caseModel.findById(data.caseId)
      const previousValue = _.cloneDeep(updatedCase)

      const documentData = await this.handleChangeStatus(data)
      const statusChanged = (data.status !== documentData.status) ||
        (previousValue.status !== data.status)

      const costEstimate = documentData?.costEstimate
      if (costEstimate?.dateOfGeneration && !costEstimate?.file?.fileId) {
        const translator = await this.envConfigClient.getTranslator()

        if (!generalData?.data) throw new BadRequestException('general_data_not_found')

        const currencySymbol = await this.envConfigClient.getAppCurrency()
        const encodedFile = await generateCostEstimatePdf(translator,
          costEstimate,
          generalData.data,
          currencySymbol)
        const pdfName = path.join('cases', `${documentData.caseId}`, 'costEstimate.pdf')

        await this.sendPdfToBucket(encodedFile, pdfName)

        documentData.costEstimate.file = {
          fileId: pdfName,
        }
        await this.notifyDoctorPdfGenerated({
          doctorId: updatedCase.bookingSection.doctorId,
          caseId: documentData.caseId,
        })
      }
      const receipts = await Promise.all(documentData.receipts?.map(async receipt => {
        if (!generalData?.data) throw new BadRequestException('general_data_not_found')
        if (receipt?.amount == null) throw new BadRequestException('amount_not_found')
        if (receipt?.number) return receipt

        const recepitNumberPattern = { role: 'receiptNumber', cmd: 'get' }

        const number = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
          recepitNumberPattern,
          {},
          Component.SCHEDULING_CASES)

        const translator = await this.envConfigClient.getTranslator()
        const currencySymbol = await this.envConfigClient.getAppCurrency()

        const updatedReceipt = { ...receipt, number }

        const encodedFile = await generateReceiptPdf(translator,
          updatedReceipt,
          generalData.data,
          currencySymbol)
        const pdfName = path.join('cases', `${documentData.caseId}`, 'receipts', `${number}.pdf`)

        await this.sendPdfToBucket(encodedFile, pdfName)

        return {
          ...receipt,
          number,
          file: {
            fileId: pdfName,
          }
        }
      }))

      documentData.receipts = receipts

      const patientsPattern = { role: 'patients', cmd: 'getPatients' }

      const patientsPayloadData = {
        patientsIds: [documentData.patientRef],
        userPermissions,
      }
      const patients = documentData.patientRef
        ? await callMSWithTimeoutAndRetry(this.patientsAnagraphicsClient,
          patientsPattern,
          patientsPayloadData,
          Component.SCHEDULING_CASES)
        : null

      const canViewPatient = booleanPermission(permissionRequests.canViewPatient, {
        userPermissions,
        props: {
          patient: patients?.[0],
        }
      })
      const canViewPatientSection = (documentData?.patientRef && canViewPatient) ||
        !previousValue?.patientRef

      const bookingSectionDate = new Date(documentData?.bookingSection?.date)

      documentData.pcMaterial =
        await this.updateCasePcMaterials(dynamicDataConfigs?.data, data, patients)

      updatedCase.set({
        ...documentData,
        patientRef: previousValue?.patientRef,
        ...(canViewPatientSection
          ? {
            bookingPatient: documentData.bookingPatient,
          }
          : {
            bookingPatient: previousValue.bookingPatient,
          }),
        ...(statusChanged && { lastStatusEdit: new Date() }),
        bookingSection: {
          ...documentData?.bookingSection ?? {},
          date: isValid(bookingSectionDate)
            ? bookingSectionDate
            : documentData?.bookingSection?.date,
        },
      })
      await updatedCase.save()

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CASE,
        prevObj: previousValue.toJSON(),
        newObj: updatedCase.toJSON(),
      })

      // US 118: Notify users with P_BOOKINGS_SCHEDULE capability when a case BOOKING INFORMATION is edited
      if (checkBookingSectionChanged(previousValue as Case, updatedCase as Case)) {
        const usersToNotify = await getUsersByCapability(
          this.userClient,
          {
            capability: Capabilities.P_BOOKINGS_SCHEDULE,
            ownerId: updatedCase.bookingSection.doctorId,
          }
        )

        await createNotifications(
          this.notificationsClient,
          {
            usersIds: usersToNotify.map(user => user.id).filter(id => id !== user.id),
            type: NotificationType.CASE_BOOKING_EDITED,
            title: 'notifications_bookingSectionEdited_title',
            body: 'notifications_bookingSectionEdited_body',
            action: {
              type: NotificationActionType.INTERNAL_LINK,
              url: `/cases/${data.caseId}`,
            },
          }
        )
      }
      // US 149: notify doctor/assistant when a surgery section is edited not by the doctor/assistant
      if (checkSurgerySectionChanged(previousValue as Case, updatedCase as Case)) {
        const getDoctorAssistantPattern = { role: 'user', cmd: 'getDoctorAssistants' }

        const payloadData = { doctorId: updatedCase.bookingSection.doctorId }
        const doctorAssistants = await callMSWithTimeoutAndRetry(this.userClient,
          getDoctorAssistantPattern,
          payloadData,
          Component.SCHEDULING_CASES)

        const usersToNotify = [
          ...doctorAssistants.map(user => user.id),
          updatedCase.bookingSection.doctorId,
        ]
        if (!usersToNotify.includes(user.id))
          await createNotifications(
            this.notificationsClient,
            {
              usersIds: usersToNotify,
              type: NotificationType.CASE_SURGERY_EDITED,
              title: 'notifications_surgerySectionEdited_title',
              body: 'notifications_surgerySectionEdited_body',
              action: {
                type: NotificationActionType.INTERNAL_LINK,
                url: `/cases/${data.caseId}`,
              },
            }
          )
      }

      const caseItem = await this.getCaseById(data.caseId, userPermissions)

      return caseItem
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async associatePatient (data: associatePatientDto,
    userPermissions: UserPermissions,
    user: IUser) {
    try {
      const pattern = { role: 'patients', cmd: 'getPatients' }

      const payloadData = {
        patientsIds: [data.patientId],
        userPermissions,
      }
      const patients = await callMSWithTimeoutAndRetry(this.patientsAnagraphicsClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      const oldCaseItem = await this.getCaseById(data.caseId, userPermissions)

      if (patients[0] == null) throw new NotFoundException('patient_not_found')

      await this.caseModel.updateOne({ _id: new ObjectId(data.caseId) }, {
        patientRef: data.patientId,
        bookingPatient: {
          ...oldCaseItem.bookingPatient,
          patientId: data.patientId,
        }
      })

      const newCaseItem = await this.getCaseById(data.caseId, userPermissions)

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CASE,
        prevObj: oldCaseItem,
        newObj: newCaseItem,
      })

      return newCaseItem
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getDoctorsPatients ({
    userPermissions,
    editPermission,
    permissionCheck = true,
  }: {
    userPermissions: UserPermissions
    editPermission?: boolean
    permissionCheck: boolean
  }) {
    try {
      const doctorsOfWhichPatientsICanSee = permissionCheck
        ? getCapabilityUsers(
          editPermission ? Capabilities.P_PATIENTS_EDIT : Capabilities.P_PATIENTS_VIEW,
          userPermissions,
        )
        : PERMISSIONS_DOMAINS_SCOPES.ALL_DATA

      if (doctorsOfWhichPatientsICanSee === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA)
        return PERMISSIONS_DOMAINS_SCOPES.ALL_DATA

      const patientsIds = await this.caseModel.find({
        'bookingSection.doctorId': { $in: doctorsOfWhichPatientsICanSee },
      }, {
        patientRef: 1,
      }).then(cases => cases.map(c => c.patientRef).filter(Boolean))
      return patientsIds
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPatientsDoctorsIds ({
    patientsIds,
  }: {
    patientsIds: string[],
  }) {
    try {
      const cases = await this.caseModel.find({
        patientRef: { $in: patientsIds },
      }, {
        'bookingSection.doctorId': 1,
        patientRef: 1,
      })

      const patientsDoctorsIds = cases.reduce((acc, c) => {
        if (!acc[c.patientRef]) acc[c.patientRef] = []
        if (c.bookingSection?.doctorId) acc[c.patientRef].push(c.bookingSection.doctorId)
        return acc
      }, {}) as Record<string, string[]>

      return patientsDoctorsIds
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateCaseWithQuery ({
    caseId,
    newDataQuery,
    userId,
  }: {
    caseId: string,
    newDataQuery: any,
    userId: string,
  }) {
    const previousValue = await this.caseModel.findById(caseId)

    await this.caseModel.updateOne({
      _id: new ObjectId(caseId)
    }, newDataQuery)

    const newValue = await this.caseModel.findById(caseId)

    await auditTrailUpdate({
      logClient: this.logClient,
      userId,
      entityType: EntityType.CASE,
      prevObj: previousValue.toJSON(),
      newObj: newValue.toJSON(),
    })
  }

  async uploadCaseDocuments ({
    caseId,
    files,
    userId,
  }: {
    caseId: string,
    files: Express.Multer.File[],
    userId: string,
  }) {
    try {
      const fileConfigs =
        await this.getSystemConfiguration(systemConfigurationSections.FILE_CONFIGS)

      const currentCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      const caseFileCount = getCaseFilesCount(currentCase.toJSON())

      if (fileConfigs?.data?.numberUploadLimit &&
        caseFileCount + files.length > fileConfigs?.data?.numberUploadLimit)
        throw new BadRequestException('too_many_files_error')

      let filesResponse = []
      if (files?.length > 0)
        filesResponse = await Promise.all(
          files.map(async file => {
            const fileName = `cases/${caseId}/${v4()}${file.originalname}`

            const uploadPattern = { role: 'file', cmd: 'upload' }

            const uploadPayloadData = {
              file,
              fileName,
              userId,
            }

            const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
              uploadPattern,
              uploadPayloadData,
              Component.SCHEDULING_CASES)

            return fileResponse
          }),
        )

      const newFiles = filesResponse.map(file => ({
        fileId: file.fileId,
      }))
      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          $push: {
            uploads: { $each: newFiles }
          }
        },
        userId,
      })
      return newFiles
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async uploadCheckinDocuments ({
    caseId,
    files,
    userId,
  }: {
    caseId: string,
    files: Express.Multer.File[],
    userId: string,
  }) {
    try {
      const fileConfigs =
        await this.getSystemConfiguration(systemConfigurationSections.FILE_CONFIGS)

      const currentCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      const caseFilesCount = getCaseFilesCount(currentCase.toJSON())
      if (fileConfigs?.data?.numberUploadLimit &&
        caseFilesCount + files.length > fileConfigs?.data?.numberUploadLimit
      )
        throw new BadRequestException('too_many_files_error')
      let filesResponse = []
      if (files?.length > 0)
        filesResponse = await Promise.all(
          files.map(async file => {
            const fileName = `cases/${caseId}/${v4()}${file.originalname}`

            const uploadPattern = { role: 'file', cmd: 'upload' }

            const uploadPayloadData = {
              file,
              userId,
              fileName,
            }

            const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
              uploadPattern,
              uploadPayloadData,
              Component.SCHEDULING_CASES)

            return fileResponse
          }),
        )

      const newFiles = filesResponse.map(file => ({
        fileId: file.fileId,
      }))
      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          $push: {
            checkinUploads: { $each: newFiles }
          }
        },
        userId,
      })
      return newFiles
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async uploadCheckoutDocuments ({
    caseId,
    files,
    userId,
  }: {
    caseId: string,
    files: Express.Multer.File[],
    userId: string,
  }) {
    try {
      const fileConfigs =
        await this.getSystemConfiguration(systemConfigurationSections.FILE_CONFIGS)

      const currentCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      const caseFilesCount = getCaseFilesCount(currentCase.toJSON())
      if (fileConfigs?.data?.numberUploadLimit &&
        caseFilesCount + files.length > fileConfigs?.data?.numberUploadLimit
      )
        throw new BadRequestException('too_many_files_error')
      let filesResponse = []
      if (files?.length > 0)
        filesResponse = await Promise.all(
          files.map(async file => {
            const fileName = `cases/${caseId}/${v4()}${file.originalname}`

            const uploadPattern = { role: 'file', cmd: 'upload' }

            const uploadPayloadData = {
              file,
              fileName,
              userId,
            }

            const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
              uploadPattern,
              uploadPayloadData,
              Component.SCHEDULING_CASES)

            return fileResponse
          }),
        )

      const newFiles = filesResponse.map(file => ({
        fileId: file.fileId,
      }))
      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          $push: {
            checkoutUploads: { $each: newFiles }
          }
        },
        userId,
      })
      return newFiles
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async uploadIntraOpDocuments ({
    caseId,
    files,
    userId,
  }: {
    caseId: string,
    files: Express.Multer.File[],
    userId: string,
  }) {
    try {
      const fileConfigs =
        await this.getSystemConfiguration(systemConfigurationSections.FILE_CONFIGS)

      const currentCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      const caseFilesCount = getCaseFilesCount(currentCase.toJSON())
      if (fileConfigs?.data?.numberUploadLimit &&
        caseFilesCount + files.length > fileConfigs?.data?.numberUploadLimit
      )
        throw new BadRequestException('too_many_files_error')
      let filesResponse = []
      if (files?.length > 0)
        filesResponse = await Promise.all(
          files.map(async file => {
            const fileName = `cases/${caseId}/${v4()}${file.originalname}`

            const uploadPattern = { role: 'file', cmd: 'upload' }

            const uploadPayloadData = {
              file,
              fileName,
              userId,
            }

            const fileResponse = await callMSWithTimeoutAndRetry(this.bucketClient,
              uploadPattern,
              uploadPayloadData,
              Component.SCHEDULING_CASES)

            return fileResponse
          }),
        )

      const newFiles = filesResponse.map(file => ({
        fileId: file.fileId,
      }))

      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          $push: {
            intraOpUploads: { $each: newFiles }
          }
        },
        userId,
      })
      return newFiles
    } catch (error) {
      await this.loggingService.throwErrorAndLog(error)
    }
  }

  async getCaseById (caseId: string,
    userPermissions: UserPermissions,
    permissionCheck: boolean = true) {
    try {
      const caseItem = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      const formattedCases = await this.createCasesResponse([caseItem],
        userPermissions,
        permissionCheck)
      return formattedCases[0]
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getContractLastActiveCase (contractId: string) {
    try {
      const caseItem = await this.caseModel.findOne({
        'bookingSection.contractId': contractId,
        status: { $in: activeCaseStatutes }
      }, {
        'bookingSection.date': 1,
      })
        .sort({ 'bookingSection.date': -1 })
      return caseItem
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getContractLastCase (contractId: string) {
    try {
      const caseItem = await this.caseModel.findOne({
        'bookingSection.contractId': contractId,
      }, {
        'bookingSection.date': 1,
      })
        .sort({ 'bookingSection.date': -1 })

      return caseItem
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateAnesthesiologists (caseId: string, data: updateAnesthesiologistsDto, userId: string) {
    try {
      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          anesthesiologistsId: data.anesthesiologistsId
        },
        userId,
      })
      return caseId
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateMultipleCasesAnesthesiologists (data: updateMultipleCasesAnesthesiologistsDto,
    userId: string) {
    try {
      const caseIds = Object.keys(data)
      const res = await Promise.all(caseIds.map(async caseId => {
        await this.updateCaseWithQuery({
          caseId,
          newDataQuery: {
            anesthesiologistsId: data[caseId]
          },
          userId,
        })
        return caseId
      }))
      return res
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editCaseDuration (userPermissions: UserPermissions, caseId: string, duration: number) {
    try {
      const dbCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })
      checkPermission(permissionRequests.canEditCaseDuration, {
        userPermissions,
        props: {
          caseItem: dbCase,
        }
      })

      await this.caseModel.updateOne({
        _id: new ObjectId(caseId)
      }, {
        $set: { 'bookingSection.duration': duration }
      })

      return { caseId, duration }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async editCaseCalendarNotes (caseId: string, notes: string, type: calendarNotesTypes) {
    try {
      if (typeof notes !== 'string') throw new BadRequestException('calendar_notes_must_be_string')

      await this.caseModel.updateOne({
        _id: new ObjectId(caseId)
      }, {
        $set: { [`bookingSection.${type}`]: notes }
      })

      return { caseId, notes }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async approveChangeNotified (caseId: string, userId: string) {
    try {
      const dbCase = await this.caseModel.findOne({ _id: new ObjectId(caseId) })

      await this.updateCaseWithQuery({
        caseId,
        newDataQuery: {
          status: CaseStatus.CONFIRMED,
          confirmationRequestor: null
        },
        userId,
      })

      if (dbCase.confirmationRequestor)
        createNotifications(
          this.notificationsClient,
          {
            usersIds: [dbCase.confirmationRequestor],
            type: NotificationType.CASE_CONFIRMED,
            title: 'notifications_caseConfirmed_title',
            body: 'notifications_caseConfirmed_body',
            action: {
              type: NotificationActionType.INTERNAL_LINK,
              url: `/cases/${caseId}`,
            },
          }
        )

      return CaseStatus.CONFIRMED
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getIsOrUsedInCases (id: string) {
    try {
      const casesAssociatedToTheSelectedOr = await this.caseModel.find({
        operatingRoomId: id,
      })
      return casesAssociatedToTheSelectedOr.length > 0
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateCasesPcMaterials (casesPcMaterials: Case['pcMaterial'][]) {
    try {
      await Promise.all(casesPcMaterials.map(async pcMaterial => {
        await this.caseModel.updateOne({
          'pcMaterial._id': pcMaterial._id
        }, {
          $set: {
            ...(pcMaterial.status != null ? { 'pcMaterial.status': pcMaterial.status } : {}),
            ...(pcMaterial.elaborationInProgress != null
              ? { 'pcMaterial.elaborationInProgress': pcMaterial.elaborationInProgress }
              : {}),
          }
        })
      }))
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesByPcMaterialsIds (pcMaterialIds: string[]) {
    try {
      const cases = await this.caseModel.find({
        'pcMaterial._id': { $in: pcMaterialIds }
      })
      return cases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getLastCases ({
    userPermissions,
    limit,
  }: {
    userPermissions: UserPermissions,
    limit: number,
  }) {
    try {
      const { canViewAllCases, associatedUsersIds } = this.getCasesOwners(userPermissions)
      const cases = await this.caseModel.find({
        'bookingSection.date': { $lte: new Date() },
        ...(!canViewAllCases && {
          'bookingSection.doctorId': { $in: associatedUsersIds },
        }),
      })
        .sort({ 'bookingSection.date': -1 })
        .limit(limit ?? 5)

      const formattedCases = await this.createCasesResponse(cases, userPermissions)
      return formattedCases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteCaseFiles (data: deleteCaseFilesDto) {
    try {
      const { caseId, filesToDelete } = data

      const pattern = { role: 'file', cmd: 'deleteFiles' }

      const payloadData = { fileIds: filesToDelete.map(f => f.fileId) }

      await callMSWithTimeoutAndRetry(this.bucketClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      const filesDeletedSplittedBySection = filesToDelete.reduce((acc, f) => {
        const section = f.fileSection
        if (!acc[section])
          acc[section] = []

        acc[section].push(f.fileId)
        return acc
      }, {})

      await Promise.all(Object.keys(filesDeletedSplittedBySection).map(async section => {
        await this.caseModel.findOneAndUpdate(
          { _id: new ObjectId(caseId) },
          {
            $pull: {
              [section]: {
                fileId: {
                  $in: filesDeletedSplittedBySection[section]
                }
              }
            }
          },
        )
      }))
      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async reviewCase (caseId: string, user: IUser, userPermissions: UserPermissions) {
    const caseObj = await this.getCaseById(caseId, userPermissions)

    if (caseObj.status !== CaseStatus.DISCHARGED)
      throw new BadRequestException('Case is not in reviewable status') // Should never happen

    const newCaseItem = await this.getCaseById(caseId, userPermissions)
    newCaseItem.status = CaseStatus.REVIEWED

    if (newCaseItem.pcMaterial != null) {
      if (newCaseItem.pcMaterial.status !== EPcMaterialsStatus.NOT_READY)
        throw new BadRequestException('Pc material is not in reviewable status') // Should never happen

      const pcMaterial: IPcMaterial = await callMSWithTimeoutAndRetry(
        this.billingClient,
        { role: 'pcMaterials', cmd: 'reviewPcMaterial' },
        { pcMaterialId: newCaseItem.pcMaterial._id },
        Component.SCHEDULING_CASES,
      )
      newCaseItem.pcMaterial.status = pcMaterial.status
    }

    await this.caseModel.updateOne({
      _id: new ObjectId(caseId)
    }, {
      $set: newCaseItem
    })

    await auditTrailUpdate({
      logClient: this.logClient,
      userId: user.id,
      entityType: EntityType.CASE,
      prevObj: caseObj,
      newObj: newCaseItem,
    })

    return newCaseItem
  }

  async getCasesById (casesIds: string[],
    userPermissions: UserPermissions,
    permissionCheck: boolean = true) {
    try {
      const objectifiedIds = casesIds.map(caseId => new ObjectId(caseId))

      const casesItems = await this.caseModel.find({ _id: { $in: objectifiedIds } })

      const formattedCases = await this.createCasesResponse(casesItems,
        userPermissions,
        permissionCheck)

      return formattedCases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getMostRecentCaseInIds (casesIds: string[], userPermissions: UserPermissions) {
    try {
      const objectifiedIds = casesIds.map(caseId => new ObjectId(caseId))

      const casesItems = await this.caseModel
        .find({ _id: { $in: objectifiedIds } })
        .sort({ 'bookingSection.date': -1 })
        .limit(1)

      const formattedCases = await this.createCasesResponse(casesItems, userPermissions)

      return formattedCases
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCaseDoctorId (caseId: string) {
    const caseItem = await this.caseModel.findOne({
      _id: new ObjectId(caseId)
    })
    return caseItem.bookingSection.doctorId
  }

  async getCasesWithotAnesthesiologistPresence (): Promise<Case[]> {
    const cases = await this.caseModel.find({
      'anesthesiaSection.anesthesiologistPresence': {
        $exists: false
      }
    }).lean()
    return cases
  }

  async getCaseLastUpdates (caseId: string) {
    try {
      const caseLastUpdates = await this.caseLastUpdatesModel.find({ caseId }).limit(1)

      return caseLastUpdates[0]
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async createOrUpdateCaseLastUpdates (caseId: string,
    changedFields: string[],
    lastCaseUpdate: Date) {
    try {
      const caseLastUpdates = await this.caseLastUpdatesModel.findOne({ caseId })
      const originalTS = caseLastUpdates?.timestamps ?? {}

      const updatedCaseTS: tCaseLastUpdates = {}

      changedFields.forEach(current => {
        updatedCaseTS[current] = lastCaseUpdate
      })

      const timestampsExists = caseLastUpdates != null

      const timestampsPayload = {
        timestamps: {
          ...originalTS,
          ...updatedCaseTS
        }
      }

      let timestampsDocument
      if (timestampsExists)
        timestampsDocument = await this.caseLastUpdatesModel.updateOne({
          caseId
        }, timestampsPayload)
      else
        timestampsDocument = await this.caseLastUpdatesModel.create(timestampsPayload)

      return timestampsDocument
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateCaseAndTimestamps (caseId: string, caseItem: any, caseData: CaseForm,
    caseLoadedAtTS: Date, acceptedConflicts: string[], changedFields: string[],
    userPermissions: UserPermissions, user: IUser) {
    try {
      const lockDuration = parseInt(process.env.REDISLOCK_REQUESTED_LOCK_DURATION)
      const lockName = `${caseId}_update_lock`
      return await this.redis.redislock.using([addTenantIdToString(lockName)],
        lockDuration,
        async () => {
          const caseLastUpdates = await this.getCaseLastUpdates(caseData.caseId)

          const changedsAt = new Date(caseLoadedAtTS)

          const fieldsMap = {}

          changedFields.forEach(current => {
            if (!acceptedConflicts.includes(current)) fieldsMap[current] = changedsAt
          })

          const conflicting = []

          const timestamps = caseLastUpdates?.timestamps ?? {}

          Object.entries(timestamps).forEach(current => {
            const [field, timestamp] = current

            const updatedField = fieldsMap[field]
            if (updatedField === undefined) return

            if (timestamp <= changedsAt)
              return

            conflicting.push(field)
          })

          const weHaveConflicts = conflicting.length > 0

          if (weHaveConflicts) {
            const updatedConflicts = [...acceptedConflicts, ...conflicting]
            return ({
              updated: false,
              conflictingFields: updatedConflicts,
              caseData: null
            })
          }

          const originalOpstandardId = caseItem.bookingSection.opStandardId
          const maybeEditedOpstandardId = caseData.bookingSection.opStandardId

          const needsNewSnapshot = originalOpstandardId !== maybeEditedOpstandardId

          const actuallyChangedFields = Object.keys(fieldsMap)

          actuallyChangedFields.forEach(current => {
            const updatedValue = get(caseData, current)
            set(caseItem, current, updatedValue)
          })

          // All this manipulating and "formatting" functions are a mess!!
          const updatedCase = {
            ...caseItem,
            documentsToUpload: caseData.documentsToUpload,
            checkinDocumentsToUpload: caseData.checkinDocumentsToUpload,
            checkoutDocumentsToUpload: caseData.checkoutDocumentsToUpload,
            intraOpDocumentsToUpload: caseData.intraOpDocumentsToUpload,
            filesToDelete: caseData.filesToDelete,
            caseId
          }

          if (needsNewSnapshot) {
            const snapshottedContract = await this.getContractSnapshot(caseItem,
              userPermissions,
              user)
            updatedCase.snapshottedContract = snapshottedContract
          }

          const res = await this.updateOne(updatedCase, userPermissions, user)

          await this.createOrUpdateCaseLastUpdates(caseData.caseId,
            actuallyChangedFields,
            res.updatedAt)

          return ({
            updated: true,
            conflictingFields: [],
            caseData: res
          })
        })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  getCaseFileIds (caseItem: Case) {
    const fileIds = []
    if (caseItem.uploads) fileIds.push(...caseItem.uploads.map(f => f.fileId))
    if (caseItem.checkinUploads) fileIds.push(...caseItem.checkinUploads.map(f => f.fileId))
    if (caseItem.checkoutUploads) fileIds.push(...caseItem.checkoutUploads.map(f => f.fileId))
    if (caseItem.intraOpUploads) fileIds.push(...caseItem.intraOpUploads.map(f => f.fileId))
    if (caseItem.costEstimate?.file?.fileId) fileIds.push(caseItem.costEstimate.file.fileId)
    if (caseItem.receipts) fileIds.push(...caseItem.receipts.map(r => r.file.fileId))
    if (caseItem.bookingSection.documents) fileIds
      .push(...caseItem.bookingSection.documents.map(d => d.fileId))
    if (caseItem.surgerySection.documents) fileIds
      .push(...caseItem.surgerySection.documents.map(d => d.fileId))
    if (caseItem.preOpSection.documents) fileIds
      .push(...caseItem.preOpSection.documents.map(d => d.fileId))
    if (caseItem.anesthesiaSection.documents) fileIds
      .push(...caseItem.anesthesiaSection.documents.map(d => d.fileId))
    if (caseItem.intraOpSection.documents) fileIds
      .push(...caseItem.intraOpSection.documents.map(d => d.fileId))
    if (caseItem.postOpSection.documents) fileIds
      .push(...caseItem.postOpSection.documents.map(d => d.fileId))

    return fileIds
  }

  async deleteCase (caseId: string, user: IUser) {
    try {
      const pattern = { role: 'credential', cmd: 'getCredentialsByEmail' }

      const payloadData = { email: user.email }
      const credentials = await callMSWithTimeoutAndRetry(this.userClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      if (!credentials.isSuperAdmin)
        throw new ForbiddenException('user_not_authorized')

      const caseItem = await this.caseModel.findById(caseId)
      if (!caseItem)
        throw new NotFoundException('case_not_found')

      if (NotDeletableCaseStatus.includes(caseItem.status))
        throw new BadRequestException('case_not_deletable')

      await this.schedulingService.deleteCaseFromBackups(caseId)

      await this.caseLastUpdatesModel.deleteMany({ caseId })

      const fileIds = this.getCaseFileIds(caseItem)
      // XXX investigate this, looks like something deleted by mistake
      const _filesObservable = await this.bucketClient.send({ role: 'file', cmd: 'deleteFiles' }, { fileIds })

      await this.caseModel.deleteOne({ _id: new ObjectId(caseId) })

      return `Case ${caseId} deleted`
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getCasesWithoutDoctor () {
    const cases = await this.caseModel.find({
      associatedDoctor: { $exists: false }
    })
    return cases
  }

  async getCasesWithoutContractSnapshot () {
    const cases = await this.caseModel.find({
      $or: [
        { snapshottedContract: { $exists: false } },
        { snapshottedContract: { $exists: true, $eq: {} } }
      ]
    })
    return cases
  }

  async getCasesWithBookingDateOfTypeString () {
    const cases = await this.caseModel.find({
      'bookingSection.date': { $type: 'string' }
    })

    return cases
  }

  async getCasesWithoutOpstandardsArray () {
    const cases = await this.caseModel.find({
      'snapshottedContract.opstandardsArray': {
        $exists: false
      }
    })

    return cases
  }

  async getCasesWithMoreThanOneOp () {
    const pipeline = this.caseModel.aggregate([
      { $match: { 'snapshottedContract.opStandards': { $exists: true } } },
      { $addFields: { opArray: { $objectToArray: '$snapshottedContract.opStandards' } } },
      { $match: { $expr: { $gt: [{ $size: '$opArray' }, 1] } } }
    ])

    const cases = await pipeline.exec()
    return cases
  }

  async getOpstandardUtilization (opstandardId: string) {
    try {
      const casesUsingIt = await this.caseModel.find({
        'bookingSection.opStandardId': opstandardId
      }).countDocuments()

      return casesUsingIt
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async executeQuery ({
    query,
    select,
    sort,
    userPermissions,
    __ignorePermissions,
  }: tExecuteQueryPayload): Promise<any> {
    try {
      let parsedQuery = query
      if (!__ignorePermissions)
        applyGetQueryPermissions('cases', query, userPermissions)

      const response = await this.caseModel
        .find(parsedQuery)
        .select(select)
        .sort(sort)
        .lean()

      const getCaseDeps = caseItem => [{ path: `${SOURCE_SCHEMAS.CASES}.${caseItem._id}` }]

      if (__ignorePermissions) {
        const result = await formatExecuteQueryValue(
          SOURCE_SCHEMAS.CASES,
          query,
          response,
          getCaseDeps
        )

        return result
      }

      const parsedCases = collectionPermissionsParsers.cases(
        // @ts-ignore here there is a type mismatch between the type of the response and the type of the cases
        response as Case[],
        userPermissions,
      )

      const result = await formatExecuteQueryValue(
        'cases',
        query,
        parsedCases,
        getCaseDeps
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

  async closeCase (caseId: string, doctorId: string) {
    try {
      await this.caseModel.updateOne({ _id: new ObjectId(caseId) }, { closed: true })

      const pattern = { role: 'user', cmd: 'getDoctorAssistants' }

      const payloadData = { doctorId }
      const doctorAssistants = await callMSWithTimeoutAndRetry(this.userClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      const doctorAssistantsId = doctorAssistants.map(({ id }) => id)

      const usersToNotify = [...doctorAssistantsId, doctorId]

      await createNotifications(
        this.notificationsClient,
        {
          usersIds: usersToNotify,
          type: NotificationType.CASE_BOOKING_EDITED,
          title: 'notifications_caseClosed_title',
          body: 'notifications_caseClosed_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${caseId}`,
          },
        }
      )

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async reOpenCase (caseId: string, doctorId: string) {
    try {
      await this.caseModel.updateOne({ _id: new ObjectId(caseId) }, { closed: false })

      const pattern = { role: 'user', cmd: 'getDoctorAssistants' }

      const payloadData = { doctorId }
      const doctorAssistants = await callMSWithTimeoutAndRetry(this.userClient,
        pattern,
        payloadData,
        Component.SCHEDULING_CASES)

      const doctorAssistantsId = doctorAssistants.map(({ id }) => id)

      const usersToNotify = [...doctorAssistantsId, doctorId]

      await createNotifications(
        this.notificationsClient,
        {
          usersIds: usersToNotify,
          type: NotificationType.CASE_BOOKING_EDITED,
          title: 'notifications_caseReopened_title',
          body: 'notifications_caseReopened_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${caseId}`,
          },
        }
      )

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
