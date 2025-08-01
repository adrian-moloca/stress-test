import {
  CaseForm,
  PermissionsDec,
  QueryCasesDto,
  associatePatientDto,
  UserPermissions,
  updateAnesthesiologistsDto,
  updateMultipleCasesAnesthesiologistsDto,
  booleanPermission,
  genericPermissionError,
  IUser,
  deleteCaseFilesDto,
  CaseStatus,
  parseErrorMessage,
  UpdateCasePayload,
  UserDec,
  CloseCaseDTO,
  backendConfiguration,
  calendarNotesTypes,
  calendarNotesSettings,
  checkPermission,
  permissionRequests,
  Case,
  tExecuteQueryPayload,
  Capabilities,
  CaseBookingSection,
  Role,
} from '@smambu/lib.constantsjs';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
  Query,
  Put,
  Param,
  HttpException,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { CasesService } from 'src/services/cases.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseCreateCase } from 'src/pipes/parseCreateCase';
import { ParseUpdateCase } from 'src/pipes/parseUpdateCase';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import {
  LoggingInterceptor,
  BypassTenantInterceptor,
  MPInterceptor,
  exportData,
  AllExceptionsFilter,
} from '@smambu/lib.commons-be';
import { CasesMaterialsService, ExplorerService } from 'src/services';
import { differenceInDays } from 'date-fns';

/* global Express */

 type InputRoleFixture = Omit<
  Role,
  'createdAt' | 'updatedAt' | 'tenantId' | 'id' | 'userCount'
>;

  const ALL_PERMISSIONS_ROLE = (role_name: string): InputRoleFixture => ({
    name: role_name,
    capabilities: [
      'P:USERS:VIEW',
      'P:USERS:EDIT',
      'P:USERS:ACTIVATE',
      'P:USERS:CREATE',
      'P:DOCTORS:VIEW',
      'P:ANESTHESIOLOGISTS:VIEW',
      'P:ROLES:VIEW',
      'P:ROLES:EDIT',
      'P:ROLES:DELETE',
      'P:ROLES:CREATE',
      'U:IS_DOCTOR',
      'U:IS_ANESTHESIOLOGIST',
      'P:PATIENTS:VIEW',
      'P:PATIENTS:EDIT',
      'P:TIMERANGE:EDIT',
      'P:FILE_UPLOAD:EDIT',
      'P:PRICE_PER_POINT_VALUE:EDIT',
      'P:VAT:EDIT',
      'P:CONTRACT_DEFAULT_PRICES:VIEW',
      'P:CONTRACT_DEFAULT_PRICES:EDIT',
      'P:DEFAULT_SUBJECT_AREAS:EDIT',
      'P:INVOICE_NUMBERS:EDIT',
      'P:CASE_NUMBERS:EDIT',
      'P:PATIENT_NUMBERS:EDIT',
      'P:DEBTOR_NUMBERS:EDIT',
      'P:SUPPLIER_CODES:EDIT',
      'P:COUNT_CONTROL:EDIT',
      'P:INVOICE_GENERAL_DATA:EDIT',
      'P:REVENUE_ACCOUNT:EDIT',
      'P:ENVIRONMENT_CONFIGS:EDIT',
      'V:CONTRACTS:HIDE',
      'P:CONTRACTS:VIEW',
      'P:CONTRACTS:EDIT',
      'P:CONTRACTS:CREATE',
      'P:CONTRACTS:DELETE',
      'P:D_OPSTANDARD:VIEW',
      'P:D_OPSTANDARD_NAMES:VIEW',
      'P:D_OPSTANDARD:EDIT',
      'P:D_OPSTANDARD:DELETE',
      'P:D_OPSTANDARD:CREATE',
      'P:D_OPSTANDARD:REQUESTCHANGE',
      'P:A_OPSTANDARD:VIEW',
      'P:A_OPSTANDARD_NAMES:VIEW',
      'P:A_OPSTANDARD:CREATE',
      'P:A_OPSTANDARD:DELETE',
      'P:A_OPSTANDARD:EDIT',
      'P:BOOKINGS:CREATE',
      'P:BOOKING_PATIENT_DETAILS:EDIT',
      'P:BOOKINGS:SCHEDULE',
      'P:BOOKINGS_ROOMS:SCHEDULE',
      'P:DAY_BOOKINGS:SCHEDULE',
      'P:BOOKINGS:REJECT',
      'P:BOOKINGS:HOLD',
      'P:BOOKINGS:VIEW',
      'P:CASES:VIEW',
      'P:CASES:EDIT',
      'P:CASES:DURATION:EDIT',
      'P:CASES_STATUS:VIEW',
      'P:CASES_DATABASE_ID:VIEW',
      'P:CASES_CHECKIN:VIEW',
      'P:CASES_CHECKIN:EDIT',
      'P:CASES_BOOKING_INFO:VIEW',
      'P:CASES_BOOKING_INFO:EDIT',
      'P:CASES_SURGERY_INFO:VIEW',
      'P:CASES_SURGERY_INFO:EDIT',
      'P:CASES_BILLING_DETAILS:VIEW',
      'P:CASES_BILLING_DETAILS:EDIT',
      'P:CASES_BILLING:VIEW',
      'P:CASES_PREOP_DOCUMENTATION:VIEW',
      'P:CASES_PREOP_DOCUMENTATION:EDIT',
      'P:CASES_ANESTHESIA_DOCUMENTATION:VIEW',
      'P:CASES_ANESTHESIA_DOCUMENTATION:EDIT',
      'P:CASES_ANESTHESIOLOGIST:ASSIGN',
      'P:CASE_ANESTHESIOLOGIST:ASSIGN_SELF',
      'P:CASES_INTRAOP_DOCUMENTATION:VIEW',
      'P:CASES_INTRAOP_DOCUMENTATION:EDIT',
      'P:CASES_POSTOP_DOCUMENTATION:VIEW',
      'P:CASES_POSTOP_DOCUMENTATION:EDIT',
      'P:CASES_CHECKOUT:VIEW',
      'P:CASES_CHECKOUT:EDIT',
      'P:CASES:EXPORT',
      'V:PREOP:TAB',
      'V:ANESTHESIA:TAB',
      'V:INTRAOP:TAB',
      'V:POSTOP:TAB',
      'V:BILLING:CODES',
      'V:BILLING:CONTACTS',
      'V:CASES:LIST',
      'V:ALL:COLUMNS',
      'V:PATIENTS:COLUMNS',
      'V:STATUS:COLUMNS',
      'V:BOOKING_INFO:COLUMNS',
      'V:DOCTOR:COLUMNS',
      'V:BILLING:COLUMNS',
      'P:CASES:REVIEW',
      'P:PC_MATERIALS:EXPORT',
      'V:BILLING:WARNINGS',
      'P:CASES:CLOSE',
      'P:CASES:REOPEN',
      'P:CALENDAR:VIEW',
      'V:ALL:CALENDAR',
      'V:DAILY:CALENDAR',
      'V:WEEKLY:CALENDAR',
      'V:MONTHLY:CALENDAR',
      'V:ALL_ROOMS:CALENDAR',
      'V:ALL:BOOKINGS',
      'V:CONFIRMED:BOOKINGS',
      'V:ASSIGNED:BOOKINGS',
      'V:PATIENT:STATUS',
      'V:CASE:STATUS',
      'V:INTRAOP:PHASES',
      'P:CALENDAR_NOTES:VIEW',
      'P:CALENDAR_NOTES:EDIT',
      'P:CALENDAR_PREOP_NOTES:VIEW',
      'P:CALENDAR_PREOP_NOTES:EDIT',
      'P:CALENDAR_POSTOP_NOTES:VIEW',
      'P:CALENDAR_POSTOP_NOTES:EDIT',
      'P:BOOKING_NOTES:VIEW',
      'P:BOOKING_NOTES:EDIT',
      'P:PREOP_NOTES:VIEW',
      'P:PREOP_NOTES:EDIT',
      'P:INTRAOP_NOTES:VIEW',
      'P:INTRAOP_NOTES:EDIT',
      'P:POSTOP_NOTES:VIEW',
      'P:POSTOP_NOTES:EDIT',
      'P:SURGERY_NOTES:VIEW',
      'P:SURGERY_NOTES:EDIT',
      'P:CHECKIN_TIMESTAMP:SET',
      'P:CHECKIN_TIMESTAMP:VIEW',
      'P:CHECKIN_TIMESTAMP:EDIT',
      'P:CHECKOUT_TIMESTAMP:SET',
      'P:CHECKOUT_TIMESTAMP:VIEW',
      'P:CHECKOUT_TIMESTAMP:EDIT',
      'P:PREOP_TIMESTAMP:SET',
      'P:PREOP_TIMESTAMP:VIEW',
      'P:PREOP_TIMESTAMP:EDIT',
      'P:ANESTHESIA_TIMESTAMP:SET',
      'P:ANESTHESIA_TIMESTAMP:VIEW',
      'P:ANESTHESIA_TIMESTAMP:EDIT',
      'P:PATIENT_TIMESTAMP:SET',
      'P:PATIENT_TIMESTAMP:VIEW',
      'P:PATIENT_TIMESTAMP:EDIT',
      'P:SURGERY_TIMESTAMP:SET',
      'P:SURGERY_TIMESTAMP:VIEW',
      'P:SURGERY_TIMESTAMP:EDIT',
      'P:POSTOP_TIMESTAMP:SET',
      'P:POSTOP_TIMESTAMP:VIEW',
      'P:POSTOP_TIMESTAMP:EDIT',
      'P:COST_ESTIMATE:CREATE',
      'P:COST_ESTIMATE:VIEW',
      'P:COST_ESTIMATE:DOWNLOAD',
      'P:RECEIPT:VIEW',
      'P:RECEIPT:CREATE',
      'P:RECEIPT:DOWNLOAD',
      'P:BILLS:EDIT',
      'P:BILLS:VIEW',
      'P:BILLS:EXPORT',
      'P:BILLS:GENERATE',
      'P:BILLS:DOWNLOAD',
      'P:BILLS:PRESCRIBED',
      'P:BILLS:CANCEL',
      'P:BILLS:POST',
      'P:BILLS:PAID',
      'V:CANCELLED:BILLS',
      'V:POSTED:BILLS',
      'P:ANESTHESIOLOGIST_SCHEDULE:VIEW',
      'P:ANESTHESIOLOGIST_SCHEDULE:EDIT',
      'P:OR:CREATE',
      'P:OR:VIEW',
      'P:OR:EDIT',
      'P:OR:DELETE',
      'P:AUDITTRAIL:CREATE',
      'P:AUDITTRAIL:DELETE',
      'P:AUDITTRAIL:EDIT',
      'P:AUDITTRAIL:VIEW',
      'P:LOGS:CREATE',
      'P:LOGS:DELETE',
      'P:LOGS:EDIT',
      'P:LOGS:VIEW',
      'P:MATERIALS_DATABASE_NAMES:VIEW',
      'P:MATERIALS_DATABASE:VIEW',
      'P:MATERIALS_DATABASE:EDIT',
      'P:MATERIALS_DATABASE:DELETE',
      'P:MATERIALS_DATABASE:UPLOAD',
      'P:MATERIALS_DATABASE:EXPORT',
      'P:STERILE_GOODS_NAMES:VIEW',
      'P:STERILE_GOODS:VIEW',
      'P:STERILE_GOODS:EDIT',
      'P:STERILE_GOODS:DELETE',
      'P:STERILE_GOODS:UPLOAD',
      'P:STERILE_GOODS:EXPORT',
      'P:OPS_CATALOGUE:VIEW',
      'P:OPS_CATALOGUE:EDIT',
      'P:OPS_CATALOGUE:DELETE',
      'P:OPS_CATALOGUE:UPLOAD',
      'P:OPS_CATALOGUE:EXPORT',
      'P:EBM:VIEW',
      'P:EBM:EDIT',
      'P:EBM:DELETE',
      'P:EBM:UPLOAD',
      'P:EBM:EXPORT',
      'P:GOA:VIEW',
      'P:GOA:EDIT',
      'P:GOA:DELETE',
      'P:GOA:UPLOAD',
      'P:GOA:EXPORT',
      'P:DASHBOARD:VIEW',
      'P:DOCUMENTS:VIEW',
      'P:DOCUMENTS:UPLOAD',
      'P:DOCUMENTS:DOWNLOAD',
      'P:CHECKIN_DOCUMENTS:VIEW',
      'P:CHECKIN_DOCUMENTS:UPLOAD',
      'P:CHECKIN_DOCUMENTS:DOWNLOAD',
      'P:CHECKOUT_DOCUMENTS:VIEW',
      'P:CHECKOUT_DOCUMENTS:UPLOAD',
      'P:CHECKOUT_DOCUMENTS:DOWNLOAD',
      'P:INTRAOP_DOCUMENTS:VIEW',
      'P:INTRAOP_DOCUMENTS:UPLOAD',
      'P:INTRAOP_DOCUMENTS:DOWNLOAD',
      'V:DOCUMENTATION:WARNING',
    ],
    scope: 'ALL_DATA',
    domain_scopes: {
      USERS: 'ALL_DATA',
      DOCTORS: 'ALL_DATA',
      ANESTHESIOLOGISTS: 'ALL_DATA',
      ROLES: 'ALL_DATA',
      USER_TYPE: 'ALL_DATA',
      PATIENTS: 'ALL_DATA',
      SYSTEM: 'ALL_DATA',
      CONTRACTS: 'ALL_DATA',
      DOCTORS_OP_STANDARD: 'ALL_DATA',
      ANESTHESIOLOGIST_OP_STANDARD: 'ALL_DATA',
      BOOKING: 'ALL_DATA',
      CASES: 'ALL_DATA',
      CALENDAR: 'ALL_DATA',
      NOTES: 'ALL_DATA',
      TIMESTAMPS: 'ALL_DATA',
      COST_ESTIMATE: 'ALL_DATA',
      RECEIPT: 'ALL_DATA',
      BILLS: 'ALL_DATA',
      OR_MANAGEMENT: 'ALL_DATA',
      AUDIT_TRAIL: 'ALL_DATA',
      LOGS: 'ALL_DATA',
      MATERIALS_DATABASE: 'ALL_DATA',
      STERILE_GOODS: 'ALL_DATA',
      OPS_CATALOGUE: 'ALL_DATA',
      EBM: 'ALL_DATA',
      GOA: 'ALL_DATA',
      DASHBOARD: 'ALL_DATA',
      DOCUMENTS: 'ALL_DATA',
    },
  })

@UseInterceptors(LoggingInterceptor)
@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly casesMaterialsService: CasesMaterialsService,
    private readonly explorerService: ExplorerService,
  ) {}

  @Get('getExplorerData')
  @UseFilters(AllExceptionsFilter)
  async getExplorerData(
    @PermissionsDec() userPermissions: UserPermissions,
    @Query()
    query: {
      startDate: string;
      endDate: string;
    },
  ) {
    try {
      checkPermission(permissionRequests.canViewExplorer, { userPermissions });

      const startDateObj = new Date(query.startDate);
      const endDateObj = new Date(query.endDate);

      if (
        differenceInDays(endDateObj, startDateObj) >
        Number(process.env.VITE_EXPLORER_MAXIMUM_DAYS)
      )
        throw new HttpException('explorer_days_limit_exceeded', 400); // This should never happen

      const res = await this.explorerService.getData({
        startDate: startDateObj,
        endDate: endDateObj,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Post('reviewCase/:caseId')
  @UseFilters(AllExceptionsFilter)
  async reviewCase(
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any,
    @Param('caseId') caseId: string,
  ) {
    try {
      const caseItem = await this.casesService.getCaseById(
        caseId,
        userPermissions,
        request.user,
      );
      checkPermission(permissionRequests.canReviwCase, {
        userPermissions,
        props: {
          caseItem,
        },
      });
      if (caseItem.status !== CaseStatus.DISCHARGED)
        throw new HttpException('case_making_review_with_wrong_status', 400);
      const res = await this.casesService.reviewCase(
        caseId,
        request.user,
        userPermissions,
      );
      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @Post()
  @UseFilters(AllExceptionsFilter)
  async create(
    @Body(new ParseCreateCase()) data: CaseForm,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() req,
  ) {
    checkPermission(permissionRequests.canCreateBooking, { userPermissions });
    try {
      const res = await this.casesService.createOne(
        data,
        req.user,
        userPermissions,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }


@Post('stress-test')
@UseFilters(AllExceptionsFilter)
async createForStressTest(@Body(new ParseCreateCase()) data: CaseForm) {
  try {
    const realAdminUser: IUser = {
      id: 'user_WDqQvLeCkd99uGQFh',
      _id: 'user_WDqQvLeCkd99uGQFh',
      title: '',
      firstName: 'Luca',
      lastName: 'Santi',
      email: 'luca@ambuflow.com',
      phoneNumber: '',
      birthDate: new Date('1990-01-01'),
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: '',
      },
      roleAssociations: [
        {
          tenantId: '66045e2350e8d495ec17bbe9',
          id: 'ra_BsWPMoYba4jqaq7E7',
          role: '660e83b0e8fec65c796c5d71',
          users: [],
        },
      ],
      createdAt: new Date('2025-02-03T09:42:26.294Z'),
      updatedAt: new Date('2025-07-30T14:22:20.705Z'),
      tenantId: '66045e2350e8d495ec17bbe9',
      active: true,
      activatedAt: new Date('2025-02-03T09:42:26.289Z'),
      roles: [],
      debtorNumber: '57',
      isDoctor: true,
      practiceName: '',
      verified: true,
    };

    // Dynamically build permissions
    const allCapabilities = ALL_PERMISSIONS_ROLE('Stress Test Admin').capabilities;

    const fullAdminPermissions: UserPermissions = allCapabilities.reduce((acc, capability) => {
      acc[capability] = {
        scope: 'ALL_DATA',
        users: [realAdminUser.id],
      };
      return acc;
    }, {} as UserPermissions);

    // Provide only the minimal set of permissions for downstream services
    const scopedPermissions: UserPermissions = {
      'P:BOOKINGS:CREATE': fullAdminPermissions['P:BOOKINGS:CREATE'],
      'P:CASES:VIEW': fullAdminPermissions['P:CASES:VIEW'],
      'P:CASES:EDIT': fullAdminPermissions['P:CASES:EDIT'],
      'P:PATIENTS:VIEW': fullAdminPermissions['P:PATIENTS:VIEW'],
      'P:DOCTORS:VIEW': fullAdminPermissions['P:DOCTORS:VIEW'],
      'P:D_OPSTANDARD:VIEW': fullAdminPermissions['P:D_OPSTANDARD:VIEW'],
      'P:COST_ESTIMATE:CREATE': fullAdminPermissions['P:COST_ESTIMATE:CREATE'],
    } as UserPermissions;

    const defaultBookingSection: CaseBookingSection = {
      doctorId: 'user_6EnqFa5TaWCtuy4wD',
      contractId: 'contract_DSg8orNxSST5FKjpz',
      opStandardId: 'op_TdqjJp7oNJiG6oRbF',
      date: new Date('2024-12-01T10:00:00.000Z'),
      duration: 120,
      name: '',
      roomType: null,
      calendarNotes: '',
      calendarPreOpNotes: '',
      calendarPostOpNotes: '',
    };

    data.bookingSection = {
      ...defaultBookingSection,
      ...data.bookingSection,
    };

    const res = await this.casesService.createOne(
      data,
      realAdminUser,
      scopedPermissions
    );

    return res;
  } catch (error) {
    console.error('❌ Stress test case creation error:', error.message);

    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);

    const message = parseErrorMessage(error);
    throw new HttpException(message, error?.status ?? 500);
  }
}



  @Put('editCaseDuration/:caseId')
  @UseFilters(AllExceptionsFilter)
  async editCaseDuration(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: { body: { duration: number } },
  ) {
    try {
      const duration = request.body.duration;
      checkPermission(permissionRequests.canEditCasesDuration, {
        userPermissions,
      });
      const res = await this.casesService.editCaseDuration(
        userPermissions,
        caseId,
        duration,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('editCaseCalendarNotes/:caseId')
  @UseFilters(AllExceptionsFilter)
  async editCaseCalendarNotes(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req()
    request: { body: { calendarNotes: string; type: calendarNotesTypes } },
  ) {
    try {
      const type = request.body.type;
      const settings = calendarNotesSettings[request.body.type];
      const calendarNotes = request.body.calendarNotes;
      checkPermission(settings.editPermission, { userPermissions });
      const res = await this.casesService.editCaseCalendarNotes(
        caseId,
        calendarNotes,
        type,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('approveChangeNotified/:caseId')
  @UseFilters(AllExceptionsFilter)
  async approveChangeNotified(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canEditCasesBookingInfo, {
        userPermissions,
      });
      const res = await this.casesService.approveChangeNotified(
        caseId,
        request.user.id,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('updateMultipleCasesAnesthesiologists')
  @UseFilters(AllExceptionsFilter)
  async updateMultipleCasesAnesthesiologists(
    @Body() data: updateMultipleCasesAnesthesiologistsDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canEditAnesthesiologistsScheduling, {
        userPermissions,
      });
      const res = await this.casesService.updateMultipleCasesAnesthesiologists(
        data,
        request.user.id,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('updateAnesthesiologists/:caseId')
  @UseFilters(AllExceptionsFilter)
  async updateAnesthesiologists(
    @Param('caseId') caseId: string,
    @Body() data: updateAnesthesiologistsDto,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canEditAnesthesiologistsScheduling, {
        userPermissions,
      });
      const res = await this.casesService.updateAnesthesiologists(
        caseId,
        data,
        request.user.id,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('uploadCaseDocuments/:caseId')
  @UseFilters(AllExceptionsFilter)
  @UseInterceptors(FilesInterceptor('documentsToUpload[]'))
  async uploadCaseDocuments(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canUploadDocuments, {
        userPermissions,
      });
      const res = await this.casesService.uploadCaseDocuments({
        caseId,
        files,
        userId: request.user.id,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('uploadCheckinDocuments/:caseId')
  @UseFilters(AllExceptionsFilter)
  @UseInterceptors(FilesInterceptor('documentsToUpload[]'))
  async uploadCheckinDocuments(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canUploadCheckinDocuments, {
        userPermissions,
      });
      const res = await this.casesService.uploadCheckinDocuments({
        caseId,
        files,
        userId: request.user.id,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('uploadCheckoutDocuments/:caseId')
  @UseFilters(AllExceptionsFilter)
  @UseInterceptors(FilesInterceptor('documentsToUpload[]'))
  async uploadCheckoutDocuments(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canUploadCheckoutDocumets, {
        userPermissions,
      });
      const res = await this.casesService.uploadCheckoutDocuments({
        caseId,
        files,
        userId: request.user.id,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put('uploadIntraOpDocuments/:caseId')
  @UseFilters(AllExceptionsFilter)
  @UseInterceptors(FilesInterceptor('documentsToUpload[]'))
  async uploadIntraOpDocuments(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      checkPermission(permissionRequests.canUploadIntraOpDocuments, {
        userPermissions,
      });
      const res = await this.casesService.uploadIntraOpDocuments({
        caseId,
        files,
        userId: request.user.id,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Put(':caseId')
  @UseFilters(AllExceptionsFilter)
  async update(
    @Param('caseId') caseId: string,
    @Body(new ParseUpdateCase()) data: UpdateCasePayload,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any, // if i want to acces the user objet in the request i need to use any
  ) {
    try {
      const caseItem = await this.casesService.getCaseById(
        caseId,
        userPermissions,
        request.user,
      );
      checkPermission(permissionRequests.canEditCase, {
        userPermissions,
        user: request.user,
        props: {
          caseItem,
        },
      });

      const response = await this.casesService.updateCaseAndTimestamps(
        caseId,
        caseItem,
        data.caseData,
        data.caseLoadedAtTS,
        data.acceptedConflicts,
        data.changedFields,
        userPermissions,
        request.user,
      );

      return response;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get('getLastCases')
  @UseFilters(AllExceptionsFilter)
  async getLastCases(
    @PermissionsDec() userPermissions: UserPermissions,
    @Query()
    query: {
      limit?: string;
    },
  ) {
    try {
      const canViewCases = booleanPermission(permissionRequests.canViewCases, {
        userPermissions,
      });
      const canViewBookings = booleanPermission(
        permissionRequests.canViewBookings,
        { userPermissions },
      );
      if (!canViewCases && !canViewBookings)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN);

      const res = await this.casesService.getLastCases({
        limit: parseInt(query.limit),
        userPermissions,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get()
  @UseFilters(AllExceptionsFilter)
  async getCases(
    @PermissionsDec() userPermissions: UserPermissions,
    @Query() query: QueryCasesDto,
  ) {
    try {
      const canViewCases = booleanPermission(permissionRequests.canViewCases, {
        userPermissions,
      });
      const canViewBookings = booleanPermission(
        permissionRequests.canViewBookings,
        { userPermissions },
      );
      if (!canViewCases && !canViewBookings)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN);

      const defaultPaginationLimit = Number(
        process.env.BE_DEFAULT_PAGINATION_LIMIT,
      );
      const res = await this.casesService.getCases({
        ...(query.fromTimestamp && {
          fromTimestamp: parseInt(query.fromTimestamp),
        }),
        ...(query.toTimestamp && { toTimestamp: parseInt(query.toTimestamp) }),
        page: query.page ? Number(query.page) : 0,
        limit: query.limit ? Number(query.limit) : defaultPaginationLimit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        patientId: query.patientId,
        statuses: query.statuses,
        search: query.search,
        datePattern: query.datePattern,
        userPermissions,
        doctorId: query.doctorId,
        missingFieldsFilter: query.missingFieldsFilter,
        missingInfoFilter: query.missingInfoFilter,
        limitedCases: query.limitedCases,
        hideClosedCases: query.hideClosedCases,
        pcMaterialsStatuses: query.pcMaterialsStatuses,
      });
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get('getCasesCSV')
  @UseFilters(AllExceptionsFilter)
  async getCasesCSV(
    @PermissionsDec() userPermissions: UserPermissions,
    @Query() query: QueryCasesDto,
  ) {
    try {
      const canViewCases = booleanPermission(permissionRequests.canViewCases, {
        userPermissions,
      });
      const canViewBookings = booleanPermission(
        permissionRequests.canViewBookings,
        {
          userPermissions,
        },
      );
      if (!canViewCases && !canViewBookings)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN);

      const res = await this.casesService.getCases({
        ...(query.fromTimestamp && {
          fromTimestamp: parseInt(query.fromTimestamp),
        }),
        ...(query.toTimestamp && { toTimestamp: parseInt(query.toTimestamp) }),
        page: 0,
        // this is a hack to get all the possible cases in the db without the
        // need to rewrite and entire function with just a limit removed
        limit: 99999999,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        patientId: query.patientId,
        statuses: query.statuses,
        search: query.search,
        datePattern: query.datePattern,
        userPermissions,
        doctorId: query.doctorId,
        missingFieldsFilter: query.missingFieldsFilter,
        missingInfoFilter: query.missingInfoFilter,
        limitedCases: query.limitedCases,
        hideClosedCases: query.hideClosedCases,
        pcMaterialsStatuses: query.pcMaterialsStatuses,
      });

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get(':caseId')
  @UseFilters(AllExceptionsFilter)
  async getCasebyId(
    @PermissionsDec() userPermissions: UserPermissions,
    @Param('caseId') caseId: string,
    @Req() request: any,
  ) {
    try {
      checkPermission(permissionRequests.canViewCases, { userPermissions });
      const res = await this.casesService.getCaseById(
        caseId,
        userPermissions,
        request.user,
      );
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get('contractLastActiveCase/:contractId')
  @UseFilters(AllExceptionsFilter)
  async getContractLastActiveCase(@Param('contractId') contractId: string) {
    try {
      const res = await this.casesService.getContractLastActiveCase(contractId);
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get('contractLastCase/:contractId')
  @UseFilters(AllExceptionsFilter)
  async getContractLastCase(@Param('contractId') contractId: string) {
    try {
      const res = await this.casesService.getContractLastCase(contractId);
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Get('getOpstandardUtilization/:opstandardId')
  @UseFilters(AllExceptionsFilter)
  async getOpstandardUtilization(@Param('opstandardId') opstandardId: string) {
    try {
      const caseUsingIt = await this.casesService.getOpstandardUtilization(
        opstandardId,
      );

      return caseUsingIt;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @Post('associatePatient')
  @UseFilters(AllExceptionsFilter)
  async associatePatient(
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() data: associatePatientDto,
    @UserDec() user: IUser,
  ) {
    try {
      checkPermission(permissionRequests.canSetCheckinTimestamp, {
        userPermissions,
      });
      const res = await this.casesService.associatePatient(
        {
          patientId: data.patientId,
          caseId: data.caseId,
        },
        userPermissions,
        user,
      );
      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @Delete('caseFiles')
  @UseFilters(AllExceptionsFilter)
  async caseFiles(@Body() data: deleteCaseFilesDto) {
    try {
      const res = await this.casesService.deleteCaseFiles(data);
      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @Delete(':caseId')
  @UseFilters(AllExceptionsFilter)
  async deleteCase(@Param('caseId') caseId: string, @UserDec() user: IUser) {
    try {
      const als = global.als;
      const store = { bypassTenant: true };
      als.enterWith(store);
      const res = await this.casesService.deleteCase(caseId, user);
      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @Post('closeCase')
  @UseFilters(AllExceptionsFilter)
  async closeCase(
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() data: CloseCaseDTO,
  ) {
    try {
      const caseItem = await this.casesService.getCaseById(
        data.caseId,
        userPermissions,
      );
      checkPermission(permissionRequests.canReviwCase, {
        userPermissions,
        props: {
          caseItem,
        },
      });

      const doctorId = caseItem.bookingSection.doctorId;

      const res = await this.casesService.closeCase(data.caseId, doctorId);

      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @Post('reOpenCase')
  @UseFilters(AllExceptionsFilter)
  async reOpenCase(
    @PermissionsDec() userPermissions: UserPermissions,
    @Body() data: CloseCaseDTO,
  ) {
    try {
      const caseItem = await this.casesService.getCaseById(
        data.caseId,
        userPermissions,
      );
      checkPermission(permissionRequests.canReviwCase, {
        userPermissions,
        props: {
          caseItem,
        },
      });

      const doctorId = caseItem.bookingSection.doctorId;

      const res = await this.casesService.reOpenCase(data.caseId, doctorId);

      return res;
    } catch (e) {
      console.error(e);

      const message = parseErrorMessage(e);
      throw new HttpException(message, e?.status ?? 500);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getDoctorsPatients' })
  async getDoctorsPatients({
    userPermissions,
    editPermission,
    permissionCheck = true,
  }: {
    userPermissions: UserPermissions;
    editPermission?: boolean;
    permissionCheck: boolean;
  }) {
    try {
      return this.casesService.getDoctorsPatients({
        userPermissions,
        editPermission,
        permissionCheck,
      });
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getPatientsDoctorsIds' })
  async getPatientsDoctorsIds({ patientsIds }: { patientsIds: string[] }) {
    try {
      return this.casesService.getPatientsDoctorsIds({ patientsIds });
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'isOrUsedInCases' })
  async getIsOrUsedInCases({ id }: { id: string }) {
    try {
      return this.casesService.getIsOrUsedInCases(id);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'updateCasesPcMaterials' })
  async updateCasesPcMaterials({
    casesPcMaterials,
  }: {
    casesPcMaterials: Case['pcMaterial'][];
  }) {
    try {
      return this.casesService.updateCasesPcMaterials(casesPcMaterials);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesByPcMaterialsIds' })
  async getCasesByPcMaterialsIds({
    pcMaterialsIds,
  }: {
    pcMaterialsIds: string[];
  }) {
    try {
      return this.casesService.getCasesByPcMaterialsIds(pcMaterialsIds);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getContractLastActiveCase' })
  async getContractLastActiveCaseMP({ contractId }: { contractId: string }) {
    try {
      const res = await this.casesService.getContractLastActiveCase(contractId);
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getContractLastCase' })
  async getContractLastCaseMP({ contractId }: { contractId: string }) {
    try {
      const res = await this.casesService.getContractLastCase(contractId);
      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasebyId' })
  async getCasebyIdMP({
    caseId,
    userPermissions,
    permissionCheck = true,
  }: {
    caseId: string;
    userPermissions: UserPermissions;
    permissionCheck: boolean;
  }) {
    try {
      const res = await this.casesService.getCaseById(
        caseId,
        userPermissions,
        permissionCheck,
      );

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesbyId' })
  async getCasesbyIdMP({
    casesIds,
    userPermissions,
  }: {
    casesIds: string[];
    userPermissions: UserPermissions;
  }) {
    try {
      const res = await this.casesService.getCasesById(
        casesIds,
        userPermissions,
      );

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCases' })
  async getCasesMP({
    query,
    userPermissions,
  }: {
    query: QueryCasesDto;
    userPermissions: UserPermissions;
  }) {
    try {
      const defaultPaginationLimit = Number(
        process.env.BE_DEFAULT_PAGINATION_LIMIT,
      );
      const res = await this.casesService.getCases({
        ...(query.fromTimestamp && {
          fromTimestamp: parseInt(query.fromTimestamp),
        }),
        ...(query.toTimestamp && { toTimestamp: parseInt(query.toTimestamp) }),
        page: query.page ? Number(query.page) : 0,
        limit: query.limit ? Number(query.limit) : defaultPaginationLimit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        patientId: query.patientId,
        statuses: query.statuses,
        search: query.search,
        datePattern: query.datePattern,
        userPermissions,
        doctorId: query.doctorId,
        missingFieldsFilter: query.missingFieldsFilter,
        missingInfoFilter: query.missingInfoFilter,
        limitedCases: query.limitedCases,
        hideClosedCases: query.hideClosedCases,
      });

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesbyIdsWithotPermission' })
  async getCasesbyIdsWithotPermissionMP({ caseIds }: { caseIds: string[] }) {
    try {
      const res = await this.casesService.getCasesById(caseIds, null, false);

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getMostRecentCaseInIds' })
  async getMostRecentCaseInIdsMP({
    casesIds,
    userPermissions,
  }: {
    casesIds: string[];
    userPermissions: UserPermissions;
  }) {
    try {
      const res = await this.casesService.getMostRecentCaseInIds(
        casesIds,
        userPermissions,
      );

      if (res && res.length > 0) return res[0];

      return null;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getOpstandardUtilization' })
  async getOpstandardUtilizationMP({ opstandardId }: { opstandardId: string }) {
    try {
      const caseUsingIt = await this.casesService.getOpstandardUtilization(
        opstandardId,
      );

      return caseUsingIt;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCaseDoctorId' })
  async getCaseDoctorIdMP({ caseId }: { caseId: string }) {
    try {
      return await this.casesService.getCaseDoctorId(caseId);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({
    role: 'cases',
    cmd: 'getCasesWithotAnesthesiologistPresence',
  })
  async getCasesWithotAnesthesiologistPresenceMP() {
    try {
      return await this.casesService.getCasesWithotAnesthesiologistPresence();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesWithoutDoctor' })
  async getCasesWithoutDoctorMP() {
    try {
      return await this.casesService.getCasesWithoutDoctor();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesWithoutContractSnapshot' })
  async getCasesWithoutContractSnapshotMP() {
    try {
      return await this.casesService.getCasesWithoutContractSnapshot();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesWithBookingDateOfTypeString' })
  async getCaseswithBookingDateOfTypeStringMP() {
    try {
      return await this.casesService.getCasesWithBookingDateOfTypeString();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesWithoutOpstandardsArray' })
  async getCasesWithoutOpstandardsArrayMP() {
    try {
      return await this.casesService.getCasesWithoutOpstandardsArray();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(BypassTenantInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasesWithMoreThanOneOp' })
  async getCasesWithMoreThanOneOpMP() {
    try {
      return await this.casesService.getCasesWithMoreThanOneOp();
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @Get(':caseId/caseMaterialsPrices')
  @UseFilters(AllExceptionsFilter)
  async getCaseMaterialPrices(
    @Param('caseId') caseId: string,
    @PermissionsDec() userPermissions: UserPermissions,
    @Req() request: any,
  ) {
    try {
      const canViewMaterialsDatabase = booleanPermission(
        permissionRequests.canViewMaterialsDatabase,
        { userPermissions },
      );
      const canViewMaterialsDatabaseNames = booleanPermission(
        permissionRequests.canViewMaterialsDatabaseNames,
        { userPermissions },
      );

      if (!canViewMaterialsDatabase && !canViewMaterialsDatabaseNames)
        throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN);

      const caseMaterials =
        await this.casesMaterialsService.getCaseMaterialPrices(
          caseId,
          request.user,
          userPermissions,
        );

      return caseMaterials;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new HttpException(message, error?.status ?? 500);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'query' })
  async executeQuery(data: tExecuteQueryPayload) {
    try {
      return this.casesService.executeQuery(data);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'exportData' })
  async mpExportData() {
    try {
      return exportData(backendConfiguration().mongodb_uri_scheduling_cases);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'generateIds' })
  async mpGenerateIds({ data }: { data: Record<string, any[]> }) {
    try {
      return this.casesService.generateIds(data);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'resetData' })
  async mpResetData({ data }: { data: Record<string, any[]> }) {
    try {
      return this.casesService.resetData(data);
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }

  @UseInterceptors(MPInterceptor)
  @MessagePattern({ role: 'cases', cmd: 'getCasebyIdWithoutPermissions' })
  async getCasebyIdWithoutPermissionsMP({ caseId }: { caseId: string }) {
    try {
      const res = await this.casesService.getCaseById(caseId, null, false);

      return res;
    } catch (error) {
      console.error(error);

      const message = parseErrorMessage(error);
      throw new RpcException(message);
    }
  }
}
