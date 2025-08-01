import React from 'react'
import { Box, Button, Card, Typography } from '@mui/material'
import { PageContainer, PageHeader, Space20 } from 'components/Commons'
import { EditButton, SaveButton } from 'components/Buttons'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { checkCaseRequiredFields, trlb } from 'utilities'
import { useParams } from 'react-router-dom'
import {
  bookingValidationSchema,
  patientValidationSchema,
  surgeryValidationSchema,
} from 'pages/BookingDetail/validationSchemas'
import { bookingInitialValues } from 'pages/BookingDetail/BookingDetail'
import { SurgeryDetailsTab } from 'pages/BookingDetail/components/tabs'
import {
  AnesthesiaType,
  CaseStatus,
  formatCasesResponse,
  getCaseOpStandard,
  permissionRequests,
  TimestampsSplittedByTab,
  billedStatuses,
  CaseForm,
  UpdateCaseResponse,
  Case,
  isAnyTimestampMissing,
  isAnesthesiaNeeded,
  getFullName,
  EPcMaterialsStatus,
  flattenObject,
  getChangedFields,
} from '@smambu/lib.constants'
import { useAppSelector } from 'store'
import { useEditCase, useGetCaseById, useReviewCase } from 'hooks/caseshooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import CheckinTab from './components/tabs/CheckinTab'
import PatientInformationTab from './components/tabs/PatientInformationTab'
import BookingInformationTab from './components/tabs/BookingInformationTab'
import { useImportContractsByDoctorIdIntoState } from 'hooks/contractHooks'
import { useGetAnesthesiologists, useImportDoctorstIntoState } from 'hooks/userHooks'
import PreOpTab from './components/tabs/PreopTab'
import CheckoutTab from './components/tabs/CheckoutTab'
import { OpStandardManagementProvider } from 'components/materials/OpStandardContext'
import IntraOpTab from './components/tabs/IntraOpTab'
import PostOpTab from './components/tabs/PostOpTab'
import AnesthesiaTab from './components/tabs/AnesthesiaTab'
import {
  anesthesiaValidation,
  intraOpValidation,
  postOpValidation,
  preOpSectionValidation,
} from './components/validation'
import StatusVisualizer from './components/StatusVisualizer'

import CaseDetailSideMenu from './CaseDetailSideMenu'
import ItemNotFound from 'pages/ItemNotFound'
import ConflictsModal from './components/ConflictsModal'
import { format, isValid } from 'date-fns'
import CaseEditedFieldsDialog from './components/CaseEditedFieldsDialog'
import ForbiddenPage from 'pages/Forbidden'
import CloseCaseButton from './components/CloseCaseButton'
import { OPSectionIsValid, caseIntraOpIsValid } from 'utilities/cases-opstandards'
import PcMaterialsTab from './components/tabs/PcMaterialsTab'

const CaseDetailsPage = ({ isEdit }: { isEdit?: boolean }) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const checkPermission = useGetCheckPermission()
  const [edit, setEdit] = React.useState(Boolean(isEdit))
  const [caseDataLoadedAt, setcaseDataLoadedAt] = React.useState<Date>(new Date())
  const [caseHasConflicts, setCaseHasConflicts] = React.useState(false)
  const [conflictingFields, setConflictingFields] = React.useState<string[]>([])
  const [editedFields, setEditedFields] = React.useState<string[]>([])
  const [updatedCase, setUpdatedCase] = React.useState<CaseForm | null>(null)
  const [patientAssociationButtonClicked,
    setPatientAssociationButtonClicked] = React.useState(false)
  const { caseId } = useParams()
  const contracts = useAppSelector(state => state.contracts)
  const [caseItem, setCaseItem] = React.useState<Case | undefined>()

  const editCase = useEditCase()
  const opStandard = getCaseOpStandard({ caseForm: caseItem, contracts })
  const getContracts = useImportContractsByDoctorIdIntoState()
  const canEditCase = checkPermission(permissionRequests.canEditCase, {
    caseItem,
  })
  const canSchedule = checkPermission(permissionRequests.canSchedule)
  const canViewCheckin = checkPermission(permissionRequests.canViewCheckin)
  const canViewCaseBookingInfo = checkPermission(permissionRequests.canViewCaseBookingInfo,
    { caseItem })
  const canViewContracts = checkPermission(permissionRequests.canViewContracts)
  const canViewCaseDatabaseId = checkPermission(permissionRequests.canViewCaseDatabaseId,
    { caseItem })
  const canViewPatient = checkPermission(permissionRequests.canViewPatient, {
    patient: caseItem?.bookingPatient,
  })
  const canViewDoctors = checkPermission(permissionRequests.canViewDoctors)
  const canEditCasesBookingInfo = checkPermission(permissionRequests.canEditCasesBookingInfo)
  const canViewSurgeryInfo = checkPermission(permissionRequests.canViewSurgeryInfo)
  const canEditSurgeryInfo = checkPermission(permissionRequests.canEditSurgeryInfo)
  const canViewCasesCheckout = checkPermission(permissionRequests.canViewCasesCheckout)
  const canViewOpstandards = checkPermission(permissionRequests.canViewOpStandards)
  const canViewPreopTab = checkPermission(permissionRequests.canViewPreopTab)
  const canViewIntraOpTab = checkPermission(permissionRequests.canViewIntraOpTab)
  const canViewPostOpTab = checkPermission(permissionRequests.canViewPostOpTab)
  const canViewAnesthesiaTab = checkPermission(permissionRequests.canViewAnesthesiaTab)
  const canViewPatientTab = (caseItem?.patientRef && canViewPatient) || !caseItem?.patientRef
  const canViewBillingWarnings = checkPermission(permissionRequests.canViewBillingWarnings,
    { caseItem })
  const canViewDocumentationWarnings = checkPermission(permissionRequests
    .canViewDocumentationWarnings,
  { caseItem })
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)
  const canReviewCase = checkPermission(permissionRequests.canReviewCase, { caseItem })

  const reviewCase = useReviewCase()

  // this is necessary otherwise after form submit it enters an infinite loop. (for some reason)
  const initialValues = React.useMemo(() => {
    return { ...bookingInitialValues, ...caseItem }
  }, [caseItem]) // DO NOT REMOVE IT

  const cancelEditOperation = () => {
    setCaseHasConflicts(false)
    setConflictingFields([])
  }

  const deriveChangedFields = (editedCase: CaseForm, maxDepth?: number) => {
    const flattenedUpdatedValues = flattenObject(editedCase)
    const flattenedInitialValues = flattenObject(initialValues)

    // this needs to be done two times: one using the updated case vs the initial
    // values, and one in the reverse order.
    // This is because the updated values are computed by flattening the updated
    // case and checking if the original values for the each path is different.
    // If we delete a value (e.g. we delete a material) that change cannot be
    // detected if not by comparing the original to the edited, and see if
    // there's something missing
    const fieldsUpdated = getChangedFields(initialValues, flattenedUpdatedValues, maxDepth)
    const fieldsRemoved = getChangedFields(editedCase, flattenedInitialValues, maxDepth)

    // we use a set to easily avoid duplicated keys
    const changedSet = new Set([...fieldsUpdated, ...fieldsRemoved])

    return [...changedSet]
  }

  const submitEdit = async (editedCase: CaseForm, acceptedConflicts: string[]) => {
    const changedFields = deriveChangedFields(editedCase)

    setEditedFields(changedFields)
    const response = (await editCase(
      editedCase,
      changedFields,
      acceptedConflicts,
      caseDataLoadedAt,
    )) as UpdateCaseResponse

    const newCase = response.caseData

    if (response.updated === false) {
      setCaseHasConflicts(true)
      setConflictingFields(response.conflictingFields)
    } else {
      if (newCase == null) throw new Error('newCase not defined')
      setEdit(false)
      setCaseHasConflicts(false)
      setConflictingFields([])
      setUpdatedCase(null)
      setEditedFields([])
      setcaseDataLoadedAt(newCase.updatedAt)
      // @ts-expect-error types are a mess right now
      if (!newCase!.error) {
        form.setValues(newCase!)
        setCaseItem(newCase!)
      }

      form.setFieldValue('checkinDocumentsToUpload', [])
      form.setFieldValue('documentsToUpload', [])
      form.setFieldValue('checkoutDocumentsToUpload', [])
      form.setFieldValue('intraOpDocumentsToUpload', [])
      form.setFieldValue('filesToDelete', [])
    }
  }

  const form = useFormik<CaseForm>({
    initialValues,
    validationSchema: yup.object({
      ...(canViewPatientTab && {
        bookingPatient: patientValidationSchema,
      }),
      bookingSection: bookingValidationSchema,
      surgerySection: surgeryValidationSchema,
      anesthesiaSection: anesthesiaValidation,
      preOpSection: preOpSectionValidation,
      intraOpSection: intraOpValidation,
      postOpSection: postOpValidation,
    }),
    onSubmit: async values => {
      setUpdatedCase(values)

      await submitEdit(values, [])
    },
  })

  const caseBilled = billedStatuses.includes(form.values.status)
  const patientArrived = Boolean(form.values.timestamps?.patientArrivalTimestamp)

  const canEditBookingDateAndDoctor = React.useMemo(() => {
    return (
      edit &&
      canEditCasesBookingInfo &&
      !patientArrived &&
      (caseItem?.status === CaseStatus.PENDING ||
        caseItem?.status === CaseStatus.CHANGE_REQUESTED ||
        canSchedule)
    )
  }, [canEditCasesBookingInfo, canSchedule, caseItem?.status, edit, patientArrived])
  const canEditBookingOtherData = React.useMemo(() => edit && canEditCasesBookingInfo,
    [canEditCasesBookingInfo, edit])
  const canEditSurgeryInfoInTab = React.useMemo(() => (
    canEditSurgeryInfo &&
    !patientArrived &&
    (caseItem?.status === CaseStatus.PENDING ||
      caseItem?.status === CaseStatus.CHANGE_REQUESTED ||
      canSchedule)
  ), [canEditSurgeryInfo, canSchedule, caseItem, patientArrived])

  useGetAnesthesiologists()
  useImportDoctorstIntoState()

  const patient = form.values.bookingPatient

  const onClick = async () => {
    form.handleSubmit()
  }

  // UR TODO: get missingData from proxies
  const { missingItems, missingData } =
    { missingItems: [], missingData: [] } as { missingItems: string[], missingData: string[] }

  const tabs: { [key: string]: any } = {
    ...(canViewPatientTab && {
      patient: {
        key: 'patient',
        component: (
          <PatientInformationTab
            edit={edit && !caseBilled}
            form={form}
            warningFields={missingItems}
            setPatientAssociationButtonClicked={setPatientAssociationButtonClicked}
          />
        ),
        isValid: !form?.errors?.bookingPatient,
        showWarning: missingData?.includes('bookingPatient'),
      },
    }),
    ...(canViewCheckin && {
      checkin: {
        key: 'checkin',
        component: (
          <CheckinTab
            edit={edit && !caseBilled}
            form={form}
            canEditPaymentContainer={edit}
            patientAssociationButtonClicked={patientAssociationButtonClicked}
          />
        ),
        isValid: true,
        showTimestampsWarning: isAnyTimestampMissing(
          TimestampsSplittedByTab.checkin,
          form.values.timestamps,
          form.values.status,
          CaseStatus.PATIENT_ARRIVED,
        ),
      },
    }),
    ...(canViewCaseBookingInfo &&
      canViewContracts &&
      canViewOpstandards &&
      canViewDoctors && {
      booking: {
        key: 'booking',
        component: (
          <BookingInformationTab
            canEditBookingDateAndDoctor={canEditBookingDateAndDoctor && !caseBilled}
            canEditBookingOtherData={canEditBookingOtherData && !caseBilled}
            form={form}
            warningFields={missingItems}
          />
        ),
        isValid:
          form?.errors?.bookingSection == null,
        showWarning:
          missingItems.some(current => current.startsWith('billingSection.thirdPartyBillingContact')) ||
          missingData?.includes('bookingSection'),
        notes: Boolean(form?.values?.notesSection?.notes),
      },
    }),
    ...(canViewSurgeryInfo &&
      canViewContracts &&
      canViewOpstandards && {
      surgery: {
        key: 'surgery',
        component: (
          <SurgeryDetailsTab
            edit={edit}
            form={form}
            canViewSurgeryInfo={canViewSurgeryInfo}
            canEditSurgeryInfo={canEditSurgeryInfoInTab}
          />
        ),
        isValid: !form?.errors?.surgerySection,
        showWarning: missingData?.includes('surgerySection'),
      },
    }),
    ...(canViewAnesthesiaTab &&
      canViewOpstandards && {
      anesthesia: {
        key: 'anesthesia',
        component: <AnesthesiaTab
          edit={edit && !caseBilled}
          form={form}
          warningFields={missingItems}
        />,
        isValid:
          !form?.errors?.anesthesiaSection &&
          !form?.values?.anesthesiaSection?.anesthesiaList?.some(
            a => a?.anesthesiaType === AnesthesiaType.PERIPHERAL_REGION_ANESTHESIA && !a?.side,
          ),
        showWarning:
          missingData?.includes('anesthesiaSection') ||
          missingItems.includes('timestamps.anesthesiaFinishedTimestap') ||
          missingItems.includes('timestamps.releaseForSurgeryTimestap'),
        showTimestampsWarning:
          isAnyTimestampMissing(
            TimestampsSplittedByTab.anesthesia,
            form.values.timestamps,
            form.values.status,
            CaseStatus.READY_FOR_ANESTHESIA,
          ) && isAnesthesiaNeeded(form.values.anesthesiaSection.anesthesiaList),
      },
    }),
    ...(canViewPreopTab &&
      canViewOpstandards && {
      preOp: {
        key: 'preOp',
        component: (
          <PreOpTab
            edit={edit && !caseBilled}
            form={form}
            warningFields={missingItems}
            showDocumentationWarnings={canViewDocumentationWarnings}
            showBillingWarning={canViewBillingWarnings}
          />
        ),
        isValid: OPSectionIsValid(form, 'preOpSection'),
        showWarning: missingData?.includes('preOpSection'),
        notes: Boolean(form?.values?.preOpSection?.additionalNotes),
        showTimestampsWarning: isAnyTimestampMissing(
          TimestampsSplittedByTab.preOp,
          form.values.timestamps,
          form.values.status,
          CaseStatus.IN_PRE_OP,
        ),
      },
    }),
    ...(canViewIntraOpTab &&
      canViewOpstandards && {
      intraOp: {
        key: 'intraOp',
        component: (
          <IntraOpTab
            edit={edit && !caseBilled}
            form={form}
            warningFields={missingItems}
            showDocumentationWarnings={canViewDocumentationWarnings}
            showBillingWarning={canViewBillingWarnings}
          />
        ),
        isValid: caseIntraOpIsValid(form),
        showWarning:
          missingData?.includes('intraOpSection') || missingItems.includes('timestamps.surgeryEndTimestamp'),
        notes: Boolean(form?.values?.intraOpSection?.additionalNotes),
        showTimestampsWarning: isAnyTimestampMissing(
          TimestampsSplittedByTab.intraOp,
          form.values.timestamps,
          form.values.status,
          CaseStatus.READY_FOR_SURGERY,
        ),
      },
    }),
    ...(canViewPostOpTab &&
      canViewOpstandards && {
      postOp: {
        key: 'postOp',
        component: (
          <PostOpTab
            edit={edit && !caseBilled}
            form={form}
            warningFields={missingItems}
            showDocumentationWarnings={canViewDocumentationWarnings}
            showBillingWarning={canViewBillingWarnings}
          />
        ),
        isValid: OPSectionIsValid(form, 'postOpSection'),
        notes: Boolean(form?.values?.postOpSection?.additionalNotes),
        showWarning: missingData?.includes('postOpSection'),
        showTimestampsWarning: isAnyTimestampMissing(
          TimestampsSplittedByTab.postOp,
          form.values.timestamps,
          form.values.status,
          CaseStatus.IN_POST_OP,
        ),
      },
    }),
    ...(canViewCasesCheckout && {
      checkout: {
        key: 'checkout',
        component: <CheckoutTab
          edit={edit && !caseBilled}
          canEditPaymentContainer={edit}
          form={form}
        />,
        isValid: true,
        showTimestampsWarning: isAnyTimestampMissing(
          TimestampsSplittedByTab.checkout,
          form.values.timestamps,
          form.values.status,
          CaseStatus.READY_FOR_DISCHARGE,
        ),
      },
    }),
    ...(canViewPcMaterials && caseItem?.pcMaterial && {
      pcMaterials: {
        key: 'pcMaterials',
        component: <PcMaterialsTab
          form={form}
        />,
        isValid: true,
      },
    }),
  }

  const [tab, setTab] = React.useState(Object.keys(tabs)[0])
  const getCase = useGetCaseById()

  const getCaseFunction = async (caseId: string) => {
    const c = await getCase(caseId)

    if (c?.caseId) {
      const formattedCase = formatCasesResponse([c])[0]
      // @ts-expect-error types are a mess!
      form.setValues({ ...formattedCase })
      // @ts-expect-error types are a mess!
      setCaseItem(formattedCase ?? undefined)
      setcaseDataLoadedAt(new Date())
    }
  }

  React.useEffect(() => {
    const getData = async () => {
      if (caseId && form.values.caseId !== caseId)
        getCaseFunction(caseId)
    }

    getData()
  }, [caseId, form.values.caseId])

  React.useEffect(() => {
    if (form.values.patientRef && !canViewPatient && tab === 'patient') setTab(Object.keys(tabs)[0])
  }, [tabs])

  React.useEffect(() => {
    if (form.values.bookingSection.doctorId) getContracts(form.values.bookingSection.doctorId)
  }, [form.values.bookingSection.doctorId])

  React.useEffect(() => {
    if (opStandard != null) checkCaseRequiredFields(form, opStandard)
  }, [opStandard])

  if (caseItem == null) return null

  const caseIsClosed = caseItem.closed

  const getContent = () => {
    if (!canEditCase) return null

    const formHasErrors = form.errors && Object.keys(form.errors).length > 0
    const saveDisabled = formHasErrors || isLoading
    const editDisabled = isLoading || !canEditCase

    const ReviewButton = () => {
      const isReviewable = canReviewCase &&
        caseItem.status === CaseStatus.DISCHARGED &&
        (caseItem.pcMaterial == null || caseItem.pcMaterial.status === EPcMaterialsStatus.NOT_READY)

      if (!isReviewable) return null

      const onClick = async () => {
        if (caseItem._id == null) throw new Error('caseId is null') // Should never happen
        const caseUpdated: Case = await reviewCase(caseItem._id)
        if (caseUpdated.status != null)
          form.setFieldValue('status', caseUpdated.status)
      }

      return (
        <Button
          disabled={isLoading}
          variant='contained'
          color='primary'
          sx={{ ml: 2 }}
          onClick={onClick}
        >
          {trlb('case_header_review')}
        </Button>
      )
    }

    return edit
      ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CaseEditedFieldsDialog fieldsList={deriveChangedFields(form.values, 150)} />
          <SaveButton disabled={saveDisabled} onClick={onClick} />
        </Box>
      )
      : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CloseCaseButton caseItem={caseItem!} caseRefreshFunction={getCaseFunction} />
          {!caseIsClosed && <EditButton disabled={editDisabled} edit={edit} setEdit={setEdit} />}
          <ReviewButton />
        </Box>
      )
  }

  if (caseItem == null && isLoading) return null
  if (caseItem == null) return <ItemNotFound message={trlb('case_not_found')} />
  if (!canEditCase && isEdit) return <ForbiddenPage />
  if (isEdit && caseIsClosed) return <ForbiddenPage />

  return (
    <OpStandardManagementProvider
      date={form?.values?.bookingSection?.date}
      doctorId={form.values.bookingSection.doctorId}
    >
      <PageContainer>
        <ConflictsModal
          show={caseHasConflicts}
          caseObj={updatedCase}
          editedFields={editedFields}
          conflictingFields={conflictingFields}
          acceptFun={submitEdit}
          cancelFun={cancelEditOperation}
        />
        <PageHeader
          edit={edit}
          setEdit={setEdit}
          showBackButton
          pageTitle={trlb(!edit ? 'cases_caseDetails_title' : 'cases_editCase_title')}
        >
          {getContent()}
        </PageHeader>
        <Space20 />
        <Card
          sx={{
            display: 'flex',
            gap: 2,
          }}
        >
          <CaseDetailSideMenu
            tab={tab}
            tabs={tabs}
            setTab={setTab}
            showDocumentationWarnings={canViewDocumentationWarnings}
          />
          <Box
            sx={{
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme => theme.palette.panel.main,
                  borderRadius: theme => theme.constants.radius,
                  padding: '10px 20px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {canViewCaseBookingInfo && (
                  <CaseHeaderInfoItem
                    label={trlb('case_header_surgery')}
                    value={opStandard?.name ?? ''}
                  />
                )}
                <StatusVisualizer caseItem={caseItem}
                  form={form}
                  canViewBillingWarnings={canViewBillingWarnings} />
                {canViewCaseDatabaseId && (
                  <CaseHeaderInfoItem
                    label={trlb('case_header_id')}
                    value={caseId ?? ''}
                  />
                )}
                {canViewPatient && (
                  <>
                    <CaseHeaderInfoItem
                      label={trlb('case_header_patient_name')}
                      value={patient ? `${patient.name} ${patient.surname}` : ''}
                    />
                    <CaseHeaderInfoItem
                      label={trlb('case_header_patient_birthdate')}
                      value={isValid(patient.birthDate) ? `${format(patient.birthDate, 'dd/MM/yyyy')}` : ''}
                    />
                    <CaseHeaderInfoItem
                      label={trlb('case_header_patient_gender')}
                      value={trlb(patient.gender)}
                    />
                  </>
                )}
                {canViewDoctors && (
                  <CaseHeaderInfoItem
                    label={trlb('case_header_doctorName')}
                    value={getFullName(caseItem.associatedDoctor, true)}
                  />
                )}
              </Box>
            </Box>
            <Space20 />
            {tabs[tab]?.component}
          </Box>
        </Card>
      </PageContainer>
    </OpStandardManagementProvider>
  )
}

const CaseHeaderInfoItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
      <Typography variant='body1' sx={{ fontWeight: '600', margin: '0px 20px' }}>
        {label}
      </Typography>
      <Typography variant='body1' sx={{ marginRight: '20px' }}>
        {value}
      </Typography>
    </div>
  )
}

export default CaseDetailsPage
