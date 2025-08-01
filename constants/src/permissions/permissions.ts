/* eslint-disable max-len */
import { Capabilities, genericPermissionError, permissionRequests, PERMISSIONS_DOMAINS_SCOPES } from '../enums'
import {
  ICapabilityName,
  IUser,
  I_PERMISSIONS_DOMAINS_SCOPES,
  permissionRequestProps,
  permissionRequestsFunctionProps,
  UserPermissions,
} from '../types'
import { HttpException, HttpStatus } from '@nestjs/common'
export const disablePermissionsCheck = false

const checkHasCapability = (userPermissions: UserPermissions, capability: ICapabilityName) => {
  if (!userPermissions) throw new Error('userPermissions_undefined')

  return userPermissions[capability]
}

const checkHasCapabilityAndScope = (
  userPermissions: UserPermissions,
  capability: ICapabilityName,
  scope: I_PERMISSIONS_DOMAINS_SCOPES,
) => checkHasCapability(userPermissions, capability) && userPermissions[capability].scope === scope

const checkOwnerIsInScope = (
  userPermissions: UserPermissions,
  capability: ICapabilityName,
  ownerID?: string,
): boolean =>
  !!ownerID &&
  checkHasCapability(userPermissions, capability) &&
  (userPermissions[capability].scope === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
    userPermissions[capability].users.includes(ownerID!))

const checkOwnerIsInArrayScope = (
  userPermissions: UserPermissions,
  capability: ICapabilityName,
  ownerIds?: string[],
): boolean =>
  !!ownerIds?.length &&
  checkHasCapability(userPermissions, capability) &&
  (userPermissions[capability].scope === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA ||
    userPermissions[capability].users.some(user => ownerIds.includes(user)))

const canViewUser = ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
  checkOwnerIsInScope(userPermissions, Capabilities.P_USERS_VIEW, props.user?.id)

export const permissionRequestsFunctions: Record<permissionRequests, Function> = {
  [permissionRequests.canViewUser]: canViewUser,
  [permissionRequests.canViewUsers]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_USERS_VIEW),
  [permissionRequests.canCreateUser]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_USERS_CREATE),
  [permissionRequests.canActivateUser]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_USERS_ACTIVATE),
  [permissionRequests.canEditUsers]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_USERS_EDIT),
  [permissionRequests.canEditUser]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_USERS_EDIT,
      props.user?.id,
    ),
  [permissionRequests.canViewRoles]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapabilityAndScope(userPermissions, Capabilities.P_ROLES_VIEW, PERMISSIONS_DOMAINS_SCOPES.ALL_DATA),
  [permissionRequests.canCreateRole]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapabilityAndScope(userPermissions, Capabilities.P_ROLES_CREATE, PERMISSIONS_DOMAINS_SCOPES.ALL_DATA),
  [permissionRequests.canEditRoles]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapabilityAndScope(userPermissions, Capabilities.P_ROLES_EDIT, PERMISSIONS_DOMAINS_SCOPES.ALL_DATA),
  [permissionRequests.canDeleteRole]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapabilityAndScope(userPermissions, Capabilities.P_ROLES_DELETE, PERMISSIONS_DOMAINS_SCOPES.ALL_DATA),

  // Anagraphics permissions
  [permissionRequests.canViewMaterialsDatabase]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_VIEW),
  [permissionRequests.canViewMaterialsDatabaseNames]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_NAMES_VIEW),
  [permissionRequests.canCreateMaterialsDatabase]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_EDIT),
  [permissionRequests.canEditMaterialsDatabase]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_EDIT),
  [permissionRequests.canExportMaterialsDatabase]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_EXPORT),
  [permissionRequests.canUploadMaterialsDatabase]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_UPLOAD),
  [permissionRequests.canDeleteMaterialsDatabaseVersion]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_MATERIALS_DATABASE_DELETE),

  [permissionRequests.canViewContracts]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACTS_VIEW),
  [permissionRequests.canCreateContract]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACTS_CREATE),
  [permissionRequests.canEditContracts]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACTS_EDIT),
  [permissionRequests.canEditContract]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_CONTRACTS_EDIT, props.contract?.details?.doctorId),
  [permissionRequests.canViewContract]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_CONTRACTS_VIEW, props.contract?.details?.doctorId),
  [permissionRequests.canDeleteContracts]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACTS_DELETE) &&
    checkHasCapability(userPermissions, Capabilities.P_DOCTORS_VIEW),
  [permissionRequests.canDeleteContract]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CONTRACTS_DELETE,
      props.contract?.details?.doctorId,
    ) && checkHasCapability(userPermissions, Capabilities.P_DOCTORS_VIEW),

  [permissionRequests.canViewOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_D_OPSTANDARD_VIEW),
  [permissionRequests.canViewOpStandard]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_D_OPSTANDARD_VIEW, props.contract?.details?.doctorId),
  [permissionRequests.canCreateOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_D_OPSTANDARD_CREATE),
  [permissionRequests.canEditOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_D_OPSTANDARD_EDIT),
  [permissionRequests.canEditOpStandard]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_D_OPSTANDARD_EDIT, props.contract?.details?.doctorId),
  [permissionRequests.canRequestChangeOpStandard]: ({
    userPermissions,
    user,
    props,
  }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_D_OPSTANDARD_REQUESTCHANGE,
      props.contract?.details?.doctorId,
    ),
  [permissionRequests.canDeleteOpStandards]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_D_OPSTANDARD_DELETE),
  [permissionRequests.canDeleteOpStandard]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_D_OPSTANDARD_DELETE,
      props.contract?.details?.doctorId,
    ),

  [permissionRequests.canViewDoctors]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DOCTORS_VIEW),
  [permissionRequests.canViewDoctor]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_DOCTORS_VIEW, props.doctor?.id),
  [permissionRequests.canViewCaseDoctor]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_DOCTORS_VIEW,

      props.caseItem?.bookingSection.doctorId!,
    ),

  [permissionRequests.canViewSterileGoods]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_VIEW),
  [permissionRequests.canViewSterileGoodNames]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_NAMES_VIEW),
  [permissionRequests.canEditSterileGoods]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_EDIT),
  [permissionRequests.canDeleteSterileGoodsVersion]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_DELETE),
  [permissionRequests.canExportSterileGoods]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_EXPORT),
  [permissionRequests.canUploadSterileGoods]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_STERILE_GOODS_UPLOAD),

  [permissionRequests.canViewOpsCatalogue]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OPS_CATALOGUE_VIEW),
  [permissionRequests.canEditOpsCatalogue]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OPS_CATALOGUE_EDIT),
  [permissionRequests.canDeleteOpsCatalogueVersion]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OPS_CATALOGUE_DELETE),
  [permissionRequests.canExportOpsCatalogue]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OPS_CATALOGUE_EXPORT),
  [permissionRequests.canUploadOpsCatalogue]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OPS_CATALOGUE_UPLOAD),

  [permissionRequests.canViewEbm]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EBM_VIEW),
  [permissionRequests.canEditEbm]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EBM_EDIT),
  [permissionRequests.canDeleteEbmVersion]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EBM_DELETE),
  [permissionRequests.canExportEbm]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EBM_EXPORT),
  [permissionRequests.canUploadEbm]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EBM_UPLOAD),

  [permissionRequests.canViewGoa]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_GOA_VIEW),
  [permissionRequests.canEditGoa]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_GOA_EDIT),
  [permissionRequests.canDeleteGoaVersion]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_GOA_DELETE),
  [permissionRequests.canExportGoa]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_GOA_EXPORT),
  [permissionRequests.canUploadGoa]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_GOA_UPLOAD),

  [permissionRequests.canViewOr]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OR_VIEW),
  [permissionRequests.canEditOr]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OR_EDIT),
  [permissionRequests.canCreateOr]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OR_CREATE),
  [permissionRequests.canDeleteOr]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_OR_DELETE),
  [permissionRequests.canCreateBooking]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_CREATE),
  [permissionRequests.canUploadDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DOCUMENTS_UPLOAD),
  [permissionRequests.canViewDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DOCUMENTS_VIEW),
  [permissionRequests.canViewCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_VIEW),
  [permissionRequests.canViewAllCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_CALENDAR),
  [permissionRequests.canViewConfirmedBookings]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_CONFIRMED_BOOKINGS),
  [permissionRequests.canViewAllBookings]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_BOOKINGS),
  [permissionRequests.canViewIntraOpPhases]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_INTRAOP_PHASES),
  [permissionRequests.canViewCalendarNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_NOTES_VIEW),
  [permissionRequests.canEditCalendarNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_NOTES_EDIT),
  [permissionRequests.canViewCalendarPreOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_PREOP_NOTES_VIEW),
  [permissionRequests.canEditCalendarPreOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_PREOP_NOTES_EDIT),
  [permissionRequests.canViewCalendarPostOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_POSTOP_NOTES_VIEW),
  [permissionRequests.canEditCalendarPostOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CALENDAR_POSTOP_NOTES_EDIT),
  [permissionRequests.canViewPatientStatus]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_PATIENT_STATUS),
  [permissionRequests.canViewAssignedBookings]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ASSIGNED_BOOKINGS),
  [permissionRequests.canViewAllRoomsCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_ROOMS_CALENDAR),
  [permissionRequests.canViewDailyCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_DAILY_CALENDAR),
  [permissionRequests.canViewWeeklyCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_WEEKLY_CALENDAR),
  [permissionRequests.canViewMonthlyCalendar]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_MONTHLY_CALENDAR),
  [permissionRequests.canViewCases]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_VIEW),
  [permissionRequests.canViewCase]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_CASES_VIEW, props.caseItem?.bookingSection?.doctorId),
  [permissionRequests.canReviwCase]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_REVIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewPcMaterials]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PC_MATERIALS_VIEW),
  [permissionRequests.canExportPcMaterials]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_PC_MATERIALS_EXPORT,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCostEstimate]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_COST_ESTIMATE_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canCreateCostEstimate]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_COST_ESTIMATE_CREATE,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCostEstimates]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_COST_ESTIMATE_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canDownloadCostEstimates]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_COST_ESTIMATE_DOWNLOAD,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canCreateReceipt]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_RECEIPT_CREATE,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewReceipts]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_RECEIPT_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canDownloadReceipts]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_RECEIPT_DOWNLOAD,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCasesList]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_CASES_LIST),
  [permissionRequests.canEditCases]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_EDIT),
  [permissionRequests.canEditCase]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_CASES_EDIT, props.caseItem?.bookingSection?.doctorId),
  [permissionRequests.canEditCasesDuration]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_DURATION_EDIT),
  [permissionRequests.canEditCaseDuration]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_DURATION_EDIT,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canReviewCase]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_REVIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCasesBilling]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_BILLING_VIEW),
  [permissionRequests.canViewCaseBilling]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_BILLING_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canGenerateBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_GENERATE),
  [permissionRequests.canCancelBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_CANCEL),
  [permissionRequests.canCancelBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_CANCEL,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canExportBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_EXPORT),
  [permissionRequests.canDownloadBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_DOWNLOAD),
  [permissionRequests.canDownloadBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_DOWNLOAD,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canSetPayedBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_PAID),
  [permissionRequests.canSetPayedBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_BILLS_PAID, props.caseItem?.bookingSection?.doctorId),
  [permissionRequests.canSetPrescribedBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_PRESCRIBED),
  [permissionRequests.canSetPrescribedBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_PRESCRIBED,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canSetPrescribdOrPaydBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_PRESCRIBED) ||
    checkHasCapability(userPermissions, Capabilities.P_BILLS_PAID),
  [permissionRequests.canSetPrescribedOrPaydBill]: ({
    userPermissions,
    user,
    props,
  }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_PAID,
      props.caseItem?.bookingSection?.doctorId,
    ) ||
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_PRESCRIBED,
      props.caseItem?.bookingSection?.doctorId,
    ),

  [permissionRequests.canViewAllCasesListColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS),
  [permissionRequests.canViewCasesListBookingInfoColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS) ||
    checkHasCapability(userPermissions, Capabilities.V_BOOKING_INFO_COLUMNS),
  [permissionRequests.canViewCasesListDoctorColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS) ||
    checkHasCapability(userPermissions, Capabilities.V_DOCTOR_COLUMNS),
  [permissionRequests.canViewCasesListPatientsColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS) ||
    checkHasCapability(userPermissions, Capabilities.V_PATIENTS_COLUMNS),
  [permissionRequests.canViewCasesListBillingColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS) ||
    checkHasCapability(userPermissions, Capabilities.V_BILLING_COLUMNS),
  [permissionRequests.canViewCasesListStatusColumns]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ALL_COLUMNS) ||
    checkHasCapability(userPermissions, Capabilities.V_STATUS_COLUMNS),

  [permissionRequests.canViewCaseBookingInfo]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_BOOKING_INFO_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCasesBookingInfo]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_BOOKING_INFO_VIEW),
  [permissionRequests.canViewCaseBillingDetails]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_BILLING_DETAILS_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canEditCaseBillingDetails]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_BILLING_DETAILS_EDIT,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewBillingWarnings]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.V_BILLING_WARNINGS,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCaseStatus]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_STATUS_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCaseCardStatus]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_CASE_STATUS),
  [permissionRequests.canViewCaseDatabaseId]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_DATABASE_ID_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),

  // System configuration permissions
  [permissionRequests.canEditFileUploadConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_FILE_UPLOAD_EDIT),
  [permissionRequests.canEditPricePointConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PRICE_PER_POINT_VALUE_EDIT),
  [permissionRequests.canEditVatValueConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_VAT_EDIT),
  [permissionRequests.canEditMaterialC1Configs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACT_DEFAULT_PRICES_EDIT),
  [permissionRequests.canEditMaterialGConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACT_DEFAULT_PRICES_EDIT),
  [permissionRequests.canEditSubjectAreas]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DEFAULT_SUBJECT_AREAS_EDIT),
  [permissionRequests.canEditInvoiceNumbersConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INVOICE_NUMBERS_EDIT),
  [permissionRequests.canEditCaseNumbersConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASE_NUMBERS_EDIT),
  [permissionRequests.canEditPcMaterialsNumbersConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PC_MATERIALS_NUMBERS_EDIT),
  [permissionRequests.canEditPatientNumbersConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENT_NUMBERS_EDIT),
  [permissionRequests.canEditDebtorNumbersConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DEBTOR_NUMBERS_EDIT),
  [permissionRequests.canEditSupplierCodes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SUPPLIER_CODES_EDIT),
  [permissionRequests.canEditCountControlConfigs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_COUNT_CONTROL_EDIT),
  [permissionRequests.canEditGeneralData]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INVOICE_GENERAL_DATA_EDIT),
  [permissionRequests.canEditRevenueAccount]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_REVENUE_ACCOUNT_EDIT),
  [permissionRequests.canEditEnvironmentConfigurations]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ENVIRONMENT_CONFIGS_EDIT),

  // Add here each new system configuration permission
  [permissionRequests.canEditSystemConfiguration]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_FILE_UPLOAD_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_PRICE_PER_POINT_VALUE_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_VAT_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_CONTRACT_DEFAULT_PRICES_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_DEFAULT_SUBJECT_AREAS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_INVOICE_NUMBERS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_CASE_NUMBERS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_PC_MATERIALS_NUMBERS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_PATIENT_NUMBERS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_SUPPLIER_CODES_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_DEBTOR_NUMBERS_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_REVENUE_ACCOUNT_EDIT) ||
    checkHasCapability(userPermissions, Capabilities.P_ENVIRONMENT_CONFIGS_EDIT),

  /*
    A user is owner of a patient if it is owner of a case with that patient
    A user can see a patient if it can see the patients of one doctor with case in with that patient
    This check is done in the backend
  */

  [permissionRequests.canViewPatients]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENTS_VIEW),
  [permissionRequests.canViewPatient]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInArrayScope(userPermissions, Capabilities.P_PATIENTS_VIEW, props.patient?.doctorsIds),
  [permissionRequests.canViewCasePatientAtFE]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    !props.caseItem?.patientRef || (props.caseItem?.bookingPatient.patientId != null && props.caseItem?.patientRef),
  [permissionRequests.canEditPatient]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkHasCapabilityAndScope(userPermissions, Capabilities.P_PATIENTS_EDIT, PERMISSIONS_DOMAINS_SCOPES.ALL_DATA) ||
    checkOwnerIsInArrayScope(userPermissions, Capabilities.P_PATIENTS_EDIT, props.patient?.doctorsIds),
  [permissionRequests.canSchedule]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_SCHEDULE),
  [permissionRequests.canScheduleRooms]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_ROOMS_SCHEDULE),
  [permissionRequests.canScheduleDayBookings]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DAY_BOOKINGS_SCHEDULE),
  [permissionRequests.canAccessScheduling]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_SCHEDULE) ||
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_ROOMS_SCHEDULE) ||
    checkHasCapability(userPermissions, Capabilities.P_DAY_BOOKINGS_SCHEDULE),
  [permissionRequests.canRejectBooking]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_REJECT),
  [permissionRequests.canHoldBooking]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_HOLD),
  [permissionRequests.canViewScheduleNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SCHEDULE_NOTES_VIEW),
  [permissionRequests.canEditScheduleNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SCHEDULE_NOTES_EDIT),
  [permissionRequests.canViewAnesthesiologistsScheduling]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIOLOGIST_SCHEDULE_VIEW),
  [permissionRequests.canEditAnesthesiologistsScheduling]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIOLOGIST_SCHEDULE_EDIT),
  [permissionRequests.canViewAnesthesiologists]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIOLOGISTS_VIEW),
  [permissionRequests.canEditBookingPatientDetails]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKING_PATIENT_DETAILS_EDIT),
  [permissionRequests.canEditPatients]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENTS_EDIT),
  [permissionRequests.canViewAnesthesiologistOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_VIEW),
  [permissionRequests.canViewAnesthesiologistOpStandard]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_VIEW),
  [permissionRequests.canCreateAnesthesiologistOpStandard]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_CREATE),
  [permissionRequests.canEditAnesthesiologistOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_EDIT),
  [permissionRequests.canEditAnesthesiologistOpStandard]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_EDIT),
  [permissionRequests.canDeleteAnesthesiologistOpStandards]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_DELETE),
  [permissionRequests.canDeleteAnesthesiologistOpStandard]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_A_OPSTANDARD_DELETE),
  [permissionRequests.canViewDashBoard]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DASHBOARD_VIEW),
  [permissionRequests.canSetCheckinTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_TIMESTAMP_SET),
  [permissionRequests.canViewCheckinTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_TIMESTAMP_VIEW),
  [permissionRequests.canViewCheckin]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_CHECKIN_VIEW),
  [permissionRequests.canEditCheckinTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_TIMESTAMP_EDIT),
  [permissionRequests.canViewCheckinDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_DOCUMENTS_VIEW),
  [permissionRequests.canUploadCheckinDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_DOCUMENTS_UPLOAD),
  [permissionRequests.canViewBillingContacts]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_BILLING_CONTACTS),
  [permissionRequests.canViewBillingContact]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.V_BILLING_CONTACTS,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewBillingCodes]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.V_BILLING_CODES,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canDownloadCheckinDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKIN_DOCUMENTS_DOWNLOAD),
  [permissionRequests.canDownloadDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_DOCUMENTS_DOWNLOAD),
  [permissionRequests.canViewBookingNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKING_NOTES_VIEW),
  [permissionRequests.canEditBookingNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKING_NOTES_EDIT),
  [permissionRequests.canEditCasesBookingInfo]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_BOOKING_INFO_EDIT),
  [permissionRequests.canViewSurgeryInfo]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_SURGERY_INFO_VIEW),
  [permissionRequests.canEditSurgeryInfo]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_SURGERY_INFO_EDIT),
  [permissionRequests.canViewSurgeryCodes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_CODES_VIEW),
  [permissionRequests.canEditSurgeryCodes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_CODES_EDIT),
  [permissionRequests.canViewPreopTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PREOP_TIMESTAMP_VIEW),
  [permissionRequests.canSetPreopTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PREOP_TIMESTAMP_SET),
  [permissionRequests.canEditPreopTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PREOP_TIMESTAMP_EDIT),
  [permissionRequests.canViewPreopDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_PREOP_DOCUMENTATION_VIEW),
  [permissionRequests.canEditPreopDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_PREOP_DOCUMENTATION_EDIT),
  [permissionRequests.canViewSurgeryNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_NOTES_VIEW),
  [permissionRequests.canEditSurgeryNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_NOTES_EDIT),
  [permissionRequests.canViewPreOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PREOP_NOTES_VIEW),
  [permissionRequests.canEditPreopNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PREOP_NOTES_EDIT),

  [permissionRequests.canViewCheckoutTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_TIMESTAMP_VIEW),
  [permissionRequests.canEditCheckoutTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_TIMESTAMP_EDIT),
  [permissionRequests.canSetCheckoutTimestamp]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_TIMESTAMP_SET),
  [permissionRequests.canUploadCheckoutDocumets]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_DOCUMENTS_UPLOAD),
  [permissionRequests.canViewCheckoutDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_DOCUMENTS_VIEW),
  [permissionRequests.canDownloadCheckoutDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CHECKOUT_DOCUMENTS_DOWNLOAD),
  [permissionRequests.canViewCasesCheckout]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_CHECKOUT_VIEW),
  [permissionRequests.canExportCases]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_EXPORT),
  [permissionRequests.canViewBills]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BILLS_VIEW),
  [permissionRequests.canViewBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BILLS_VIEW,
      props.contract?.details?.doctorId ?? props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewCaseBills]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_BILLS_VIEW, props.caseItem?.bookingSection?.doctorId),
  [permissionRequests.canViewPatientBills]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInArrayScope(userPermissions, Capabilities.P_BILLS_VIEW, props.patient?.doctorsIds),
  [permissionRequests.canEditBill]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(userPermissions, Capabilities.P_BILLS_EDIT, props.contract?.details?.doctorId),
  [permissionRequests.canViewOpstandardName]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_D_OPSTANDARD_NAMES_VIEW,
      props.contract?.details?.doctorId,
    ),

  [permissionRequests.canCreateAuditTrail]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_AUDITTRAIL_CREATE),
  [permissionRequests.canDeleteAuditTrail]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_AUDITTRAIL_DELETE),
  [permissionRequests.canEditAuditTrail]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_AUDITTRAIL_EDIT),
  [permissionRequests.canViewAuditTrails]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_AUDITTRAIL_VIEW),

  [permissionRequests.canViewPreopTab]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_PREOP_TAB),

  [permissionRequests.canViewIntraOpTab]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_INTRAOP_TAB),
  [permissionRequests.canViewIntraOpDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_INTRAOP_DOCUMENTATION_VIEW),
  [permissionRequests.canEditIntraOpDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_INTRAOP_DOCUMENTATION_EDIT),
  [permissionRequests.canEditIntraopNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INTRAOP_NOTES_EDIT),
  [permissionRequests.canViewIntraOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INTRAOP_NOTES_VIEW),
  [permissionRequests.canViewSurgeryTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_TIMESTAMP_VIEW),
  [permissionRequests.canEditSurgeryTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_TIMESTAMP_EDIT),
  [permissionRequests.canSetSurgeryTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_SURGERY_TIMESTAMP_SET),
  [permissionRequests.canViewPatientTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENT_TIMESTAMP_VIEW),
  [permissionRequests.canEditPatientTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENT_TIMESTAMP_EDIT),
  [permissionRequests.canSetPatientTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_PATIENT_TIMESTAMP_SET),
  [permissionRequests.canViewIntraOpDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INTRAOP_DOCUMENTS_VIEW),
  [permissionRequests.canUploadIntraOpDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INTRAOP_DOCUMENTS_UPLOAD),
  [permissionRequests.canDownloadIntraOpDocuments]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_INTRAOP_DOCUMENTS_DOWNLOAD),
  [permissionRequests.canCreateLog]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_LOGS_CREATE),
  [permissionRequests.canDeleteLog]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_LOGS_DELETE),
  [permissionRequests.canEditLog]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_LOGS_EDIT),
  [permissionRequests.canViewLogs]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_LOGS_VIEW),

  [permissionRequests.canViewPostOpTab]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_POSTOP_TAB),
  [permissionRequests.canViewPostOpDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_POSTOP_DOCUMENTATION_VIEW),
  [permissionRequests.canEditPostOpDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_POSTOP_DOCUMENTATION_EDIT),
  [permissionRequests.canViewPostOpTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_POSTOP_TIMESTAMP_VIEW),
  [permissionRequests.canSetPostOpTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_POSTOP_TIMESTAMP_SET),
  [permissionRequests.canEditPostOpTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_POSTOP_TIMESTAMP_EDIT),
  [permissionRequests.canViewPostOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_POSTOP_NOTES_VIEW),
  [permissionRequests.canEditPostOpNotes]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_POSTOP_NOTES_EDIT),

  [permissionRequests.canViewAnesthesiaTab]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_ANESTHESIA_TAB),
  [permissionRequests.canSetAnesthesiaTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIA_TIMESTAMP_SET),
  [permissionRequests.canViewAnesthesiaTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIA_TIMESTAMP_VIEW),
  [permissionRequests.canEditAnesthesiaTimestamps]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_ANESTHESIA_TIMESTAMP_EDIT),
  [permissionRequests.canViewAnesthesiaDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_ANESTHESIA_DOCUMENTATION_VIEW),
  [permissionRequests.canEditAnesthesiaDocumentation]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASES_ANESTHESIA_DOCUMENTATION_EDIT),
  [permissionRequests.canAssignMySelfAsAnesthesiologistInCase]: ({
    userPermissions,
  }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CASE_ANESTHESIOLOGIST_ASSIGN_SELF),

  [permissionRequests.canViewContractDefaultPrices]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_CONTRACT_DEFAULT_PRICES_VIEW),
  [permissionRequests.canViewBookings]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_BOOKINGS_VIEW),
  [permissionRequests.canViewBooking]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_BOOKINGS_VIEW,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.hideContracts]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.V_CONTRACTS_HIDE),
  [permissionRequests.canViewDocumentationWarnings]: ({
    userPermissions,
    user,
    props,
  }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.V_DOCUMENTATION_WARNINGS,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canCloseCases]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_CLOSE,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canReopenCases]: ({ userPermissions, user, props }: permissionRequestsFunctionProps) =>
    checkOwnerIsInScope(
      userPermissions,
      Capabilities.P_CASES_REOPEN,
      props.caseItem?.bookingSection?.doctorId,
    ),
  [permissionRequests.canViewPrescribableMaterials]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(
      userPermissions,
      Capabilities.P_PRESCRIBABLE_MATERIALS_VIEW,
    ),
  // Explorer
  [permissionRequests.canViewExplorer]: ({ userPermissions }: permissionRequestsFunctionProps) =>
    checkHasCapability(userPermissions, Capabilities.P_EXPLORER_VIEW),
}

interface checkPermissionProps {
  userPermissions: UserPermissions
  user?: Partial<IUser>
  props?: permissionRequestProps
}

export const booleanPermission = (permissionRequest: permissionRequests, props: checkPermissionProps) => {
  if (disablePermissionsCheck) return true

  const requiredPermission = permissionRequests[permissionRequest]

  const permissionCheckFunction = permissionRequestsFunctions[permissionRequest]

  if (permissionCheckFunction === null || permissionCheckFunction === undefined)
    throw new Error(`Warning: the required permission ${requiredPermission} doesn't have a permission check function`)

  return permissionCheckFunction?.(props)
}

export const checkPermission = (permissionRequest: permissionRequests, props: checkPermissionProps) => {
  const requiredPermission = permissionRequests[permissionRequest]

  const hasPermission = booleanPermission(permissionRequest, props)

  if (!hasPermission) {
    console.error(`User ${props.user?.id} does not have permission ${requiredPermission}!`)
    throw new HttpException(genericPermissionError, HttpStatus.FORBIDDEN)
  }

  return true
}

export const getCapabilityUsers = (
  capabilityName: ICapabilityName,
  userPermissions: UserPermissions,
): I_PERMISSIONS_DOMAINS_SCOPES | string[] =>
  userPermissions[capabilityName]?.scope === PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
    ? PERMISSIONS_DOMAINS_SCOPES.ALL_DATA
    : userPermissions[capabilityName]?.users || []

export const filterByPermission = (permissionRequest: permissionRequests, props: checkPermissionProps) =>
  disablePermissionsCheck || permissionRequestsFunctions[permissionRequest]?.(props)
