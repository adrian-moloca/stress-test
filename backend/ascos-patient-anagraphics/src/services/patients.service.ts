import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common'
import {
  Component,
  EntityType,
  GetPatientsDto,
  Patient as IPatient,
  I_PERMISSIONS_DOMAINS_SCOPES,
  PERMISSIONS_DOMAINS_SCOPES,
  PaginatedPatientsResponse,
  UserPermissions,
  applyGetQueryPermissions,
  auditTrailCreate,
  auditTrailUpdate,
  callMSWithTimeoutAndRetry,
  formatExecuteQueryValue,
  sanitizeRegex,
  serializePatient,
  sleep,
  tExecuteQueryPayload,
  SOURCE_SCHEMAS,
} from '@smambu/lib.constantsjs'
import { InjectModel } from '@nestjs/mongoose'
import { Patient, PatientDocument } from '../schemas/patient.schema'
import { Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import { ObjectId } from 'mongodb'
import { isValid } from 'date-fns'
import { toDate } from 'date-fns-tz'
import { LoggingService, generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'
@Injectable()
export class PatientsService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @InjectModel(Patient.name)
    private readonly patientsModel: Model<PatientDocument>,
    @Inject('SYSTEM_CONFIGURATION_CLIENT')
    private readonly systemConfigurationClient: ClientProxy,
    @Inject('SCHEDULING_CASES_CLIENT')
    private readonly schedulingCasesClient: ClientProxy,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.PATIENT_ANAGRAPHICS)
    this.models = [
      { model: this.patientsModel, label: 'patients' },
    ]
  }

  async createOne (data: IPatient, userId: string) {
    try {
      const getPatientNumberPattern = { role: 'patientNumber', cmd: 'get' }

      const patientNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        getPatientNumberPattern,
        {},
        Component.PATIENT_ANAGRAPHICS)

      const patientDebtorNumberGetPattern = { role: 'patientDebtorNumber', cmd: 'get' }

      const debtorNumber = await callMSWithTimeoutAndRetry(this.systemConfigurationClient,
        patientDebtorNumberGetPattern,
        {},
        Component.PATIENT_ANAGRAPHICS)

      const patient = await this.patientsModel.create({
        ...data,
        patientNumber,
        debtorNumber,
      })

      await auditTrailCreate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.PATIENT,
        newObj: patient.toJSON(),
      })

      return patient
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async parsePatientsData ({
    patients,
  }: {
    patients: any[];
  }) {
    const patientsIds = patients.map(patient => patient._id)
    const pattern = { role: 'cases', cmd: 'getPatientsDoctorsIds' }

    const payloadData = { patientsIds }
    const getPatientsDoctorsIds = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
      pattern,
      payloadData,
      Component.PATIENT_ANAGRAPHICS)

    const parsedPatiens = await Promise.all(
      patients.map(async patient => {
        const patientJSON = patient.toJSON()
        return {
          ...serializePatient(patientJSON),
          doctorsIds: getPatientsDoctorsIds[patient._id] || [],
        }
      }),
    )
    return parsedPatiens
  }

  async getFilteredPatients (
    { cardInsuranceNumber, name, surname, birthDate, address }: GetPatientsDto,
    userPermissions: UserPermissions,
  ) {
    try {
      const date = toDate(birthDate, {
        timeZone: 'UTC',
      })
      if (!cardInsuranceNumber && !(name && surname && isValid(date)) && !address)
        return []

      const pattern = { role: 'cases', cmd: 'getDoctorsPatients' }

      const payloadData = { userPermissions }
      const permittedPatients = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
        pattern,
        payloadData,
        Component.PATIENT_ANAGRAPHICS)

      const canViewAllPatients =
        permittedPatients === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
      const patients = await this.patientsModel.find({
        ...(!canViewAllPatients && {
          _id: { $in: permittedPatients.filter(id => new ObjectId(id)) },
        }),
        ...((cardInsuranceNumber ||
          address ||
          (name && surname && isValid(date))) && {
          $or: [
            ...(cardInsuranceNumber ? [{ cardInsuranceNumber }] : []),
            ...(name && surname && isValid(date)
              ? [{ name, surname, date }]
              : []),
            ...(address
              ? [
                {
                  'address.street': address?.street,
                  'address.city': address?.city,
                  'address.country': address?.country,
                  'address.postalCode': address?.postalCode,
                  'address.houseNumber': address?.houseNumber,
                },
              ]
              : []),
          ],
        }),
      })
      return this.parsePatientsData({ patients })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async fullTextSearchPatients (
    query: string,
    page: number,
    limit: number,
    userPermissions: UserPermissions,
    sortBy: string,
    sortOrder: string,
    datePattern: string,
  ): Promise<PaginatedPatientsResponse> {
    try {
      const defaultPaginationLimit = Number(
        process.env.BE_DEFAULT_PAGINATION_LIMIT,
      )
      const pattern = { role: 'cases', cmd: 'getDoctorsPatients' }

      const payloadData = { userPermissions }
      const permittedPatients = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
        pattern,
        payloadData,
        Component.PATIENT_ANAGRAPHICS)

      const canViewAllPatients =
        permittedPatients === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
      const queryTokens = query.split(' ')
      const queryStrings = []
      const queryDates = []
      queryTokens.forEach(token => {
        // TODO: this is not good enough, we need to find a better way to parse dates
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
      const mongoQuery = {
        ...(!canViewAllPatients && {
          _id: { $in: permittedPatients.filter(id => new ObjectId(id)) },
        }),
        ...(queryStrings.length && {
          $or: [
            {
              name: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              surname: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              cardInsuranceNumber: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
            {
              patientNumber: {
                $regex: queryStrings.join('|'),
                $options: 'i',
              },
            },
          ],
        }),
        ...(queryDates.length && {
          birthDate: {
            $in: queryDates,
          },
        }),
      }
      const total = await this.patientsModel.countDocuments(mongoQuery)
      const patients = await this.patientsModel
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

      const parsedPatients = await this.parsePatientsData({
        patients,
      })
      return {
        results: parsedPatients,
        total,
        currentPage: !isNaN(Number(page)) ? Number(page) : 0,
        limit: !isNaN(Number(limit)) ? Number(limit) : defaultPaginationLimit,
      }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findPatient (id: string, userPermissions: UserPermissions) {
    try {
      const pattern = { role: 'cases', cmd: 'getDoctorsPatients' }

      const payloadData = { userPermissions }
      const permittedPatients = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
        pattern,
        payloadData,
        Component.PATIENT_ANAGRAPHICS)

      const patient = await this.patientsModel.findById(id)
      if (
        permittedPatients !== PERMISSIONS_DOMAINS_SCOPES.ALL_DATA &&
        !permittedPatients.includes(id)
      )
        throw new BadRequestException('common_no_permission')

      const parsed = await this.parsePatientsData({
        patients: [patient],
      })
      return parsed[0]
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getPatients ({
    patientsIds,
    userPermissions,
    permissionCheck = true,
  }: {
    patientsIds?: string[];
    userPermissions: UserPermissions;
    permissionCheck: boolean;
  }) {
    try {
      const pattern = { role: 'cases', cmd: 'getDoctorsPatients' }

      const payloadData = { userPermissions, permissionCheck }
      const permittedPatients = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
        pattern,
        payloadData,
        Component.PATIENT_ANAGRAPHICS)

      const patients = await this.patientsModel.find({
        _id: {
          $in: patientsIds
            .filter(
              id =>
                permittedPatients === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
                permittedPatients.includes(id),
            )
            .map(id => new ObjectId(id)),
        },
      })

      return this.parsePatientsData({ patients })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAllPatients () {
    try {
      const patients = await this.patientsModel.find({})

      return this.parsePatientsData({ patients })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updatePatient (
    data: IPatient,
    userId: string,
    userPermissions: UserPermissions,
  ) {
    try {
      const pattern = { role: 'cases', cmd: 'getDoctorsPatients' }

      const payloadData = { userPermissions, editPermission: true }
      const permittedPatients = await callMSWithTimeoutAndRetry(this.schedulingCasesClient,
        pattern,
        payloadData,
        Component.PATIENT_ANAGRAPHICS)

      if (
        permittedPatients !== PERMISSIONS_DOMAINS_SCOPES.ALL_DATA &&
        !permittedPatients.includes(data.patientId)
      )
        throw new BadRequestException('common_no_permission')

      const { patientId, ...rest } = data

      const previousValue = await this.patientsModel.findById(patientId)
      const patient = await this.patientsModel.findById(patientId)

      await patient.set(rest)
      await patient.save()

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.PATIENT,
        prevObj: previousValue.toJSON(),
        newObj: patient.toJSON(),
      })

      return this.findPatient(patientId, userPermissions)
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
  }: tExecuteQueryPayload) {
    try {
      let permittedPatients: string[] | I_PERMISSIONS_DOMAINS_SCOPES

      if (!__ignorePermissions)
        permittedPatients = await callMSWithTimeoutAndRetry(
          this.schedulingCasesClient,
          { role: 'cases', cmd: 'getDoctorsPatients' },
          { userPermissions, permissionCheck: true },
          Component.PATIENT_ANAGRAPHICS,
        )
      else
        permittedPatients = PERMISSIONS_DOMAINS_SCOPES.ALL_DATA

      const parsedQuery = applyGetQueryPermissions('patients', query, userPermissions, permittedPatients)
      const response = await this.patientsModel
        .find(parsedQuery)
        .select(select)
        .sort(sort)
        .lean()

      const getPatientDeps = patient => [{ path: `${SOURCE_SCHEMAS.PATIENTS}.${patient._id}` }]

      const result = formatExecuteQueryValue(
        SOURCE_SCHEMAS.PATIENTS,
        query,
        response,
        getPatientDeps
      )

      return result
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizeDebtorNumbers (limit: number) {
    try {
      let newDebtorNumbers = []
      let notFinished = true
      while (notFinished) {
        const patients = await this.patientsModel
          .find({}, { _id: 1, patientNumber: 1 })
          .sort({ createdAt: 1 })
          .limit(limit)
          .skip(newDebtorNumbers.length)

        const partialNewDebtorNumbers = patients.map(patient => ({
          _id: patient._id,
          patientNumber: patient.patientNumber,
          debtorNumber: String(Number(patient.patientNumber) + 550000000),
        }))

        await this.patientsModel.bulkWrite(
          partialNewDebtorNumbers.map(patient => ({
            updateOne: {
              filter: { _id: patient._id },
              update: { debtorNumber: patient.debtorNumber },
            },
          })),
        )
        newDebtorNumbers = newDebtorNumbers.concat(partialNewDebtorNumbers)

        if (patients.length < limit) notFinished = false
      }

      return newDebtorNumbers
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async normalizePatientsNumbers (limit: number, sleepTime?: number) {
    try {
      let newPatientsNumbers = []
      let notFinished = true

      while (notFinished) {
        const patients = await this.patientsModel
          .find({}, { _id: 1, debtorNumber: 1 })
          .sort({ createdAt: 1 })
          .limit(limit)
          .skip(newPatientsNumbers.length)

        const partialNewPatientsNumbers = patients.map(patient => ({
          _id: patient._id,
          debtorNumber: patient.debtorNumber,
          patientNumber: String(Number(patient.debtorNumber) - 550000000),
        }))

        await this.patientsModel.bulkWrite(
          partialNewPatientsNumbers.map(patient => ({
            updateOne: {
              filter: { _id: patient._id },
              update: { patientNumber: patient.patientNumber },
            },
          })),
        )
        newPatientsNumbers = newPatientsNumbers.concat(partialNewPatientsNumbers)

        if (patients.length < limit) notFinished = false
        if (sleepTime) await sleep(sleepTime)
      }

      // eslint-disable-next-line no-console
      console.log('PNN patients finished total ', newPatientsNumbers.length)
      return newPatientsNumbers
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
