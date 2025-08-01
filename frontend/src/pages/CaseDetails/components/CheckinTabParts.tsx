import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import {
  FormikGridAutocomplete,
  FormikGridInlineDatePicker,
  FormikGridNumberField,
  FormikGridSelect,
  FormikGridTextField,
  NumericTextField,
  Panel,
  SectionTitle,
  Space20,
} from 'components/Commons'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  CaseForm,
  CostEstimate,
  IUser,
  MaterialPrice,
  Receipt,
  ReceiptType,
  computeCostEstimateTotal,
  getCaseContract,
  getFullName,
  getMaterialLabel,
  getPrice,
  parseMaterialRowInCaseOPItem,
  permissionRequests,
} from '@smambu/lib.constants'
import { FormikProps, useFormik } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useGetCaseMaterialsPrices } from 'hooks/casesMaterialsHooks'
import { useAppSelector } from 'store'
import InfoIcon from '@mui/icons-material/Info'
import { FlexDataTable } from 'components/FlexCommons'
import { GridRenderEditCellParams, GridRowId } from '@mui/x-data-grid'
import { format } from 'date-fns'
import DownloadIcon from '@mui/icons-material/Download'
import * as yup from 'yup'
import { useGetMaterialsDatabaseVersion, useMaterials } from 'hooks'
import MaterialPricesTableToolBar from '../MaterialPricesTableToolBar'
import { useDownloadFile } from 'hooks/bucketHooks'
import { v4 } from 'uuid'
import { trlb } from 'utilities'

const checkTempMaterialId = (materialId: string) => materialId.includes('temp_')

export const CostEstimateContainer = ({
  form,
  edit,
  patientAssociationButtonClicked,
  spacer,
}: {
  form: FormikProps<CaseForm>
  edit: boolean
  patientAssociationButtonClicked: boolean
  spacer?: boolean
}) => {
  const checkPermission = useGetCheckPermission()
  const patient = form.values.bookingPatient
  const canViewCostEstimate = checkPermission(permissionRequests.canViewCostEstimate, {
    caseItem: form.values,
  })
  const canCreateCostEstimate = checkPermission(permissionRequests.canCreateCostEstimate, {
    caseItem: form.values,
  })
  const canViewPatient = checkPermission(permissionRequests.canViewPatient, {
    patient,
  })
  const canViewCaseBookingInfo = checkPermission(permissionRequests.canViewCaseBookingInfo, {
    caseItem: form.values,
  })
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  // eslint-disable-next-line max-len
  const canViewMaterialsDatabaseNames = checkPermission(permissionRequests.canViewMaterialsDatabaseNames)
  const canDownloadCostEstimates = checkPermission(permissionRequests.canDownloadCostEstimates, {
    caseItem: form.values,
  })

  const canViewNewButton = form.values.patientRef
    ? canCreateCostEstimate &&
    canViewPatient &&
    canViewCaseBookingInfo &&
    (canViewMaterialsDatabase || canViewMaterialsDatabaseNames)
    : canCreateCostEstimate &&
    canViewCaseBookingInfo &&
    (canViewMaterialsDatabase || canViewMaterialsDatabaseNames)
  const [newCostEstimatePopUpOpen, setNewCostEstimatePopUpOpen] = useState(false)

  const handleNewCostEstimate = () => {
    setNewCostEstimatePopUpOpen(true)
  }

  if (!canViewCostEstimate) return null

  return (
    <>
      <Panel>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
            <Typography>{trlb('case_tab_checkin_cost_estimate')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {canViewNewButton && edit && !form.values.costEstimate?.dateOfGeneration && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Button onClick={handleNewCostEstimate}>{trlb('case_tab_checkin_new_cost_estimate')}</Button>
                </Box>
              )}
              <Space20 />
              <Box>
                {form.values.costEstimate?.dateOfGeneration
                  ? (
                    <CostEstimateItem
                      canDownloadCostEstimates={
                        form.values.patientRef
                          ? canDownloadCostEstimates && canViewPatient
                          : canDownloadCostEstimates && canViewCaseBookingInfo
                      }
                      costEstimate={form.values.costEstimate}
                      key={new Date(form.values.costEstimate.dateOfGeneration).getTime()}
                    />
                  )
                  : null}
                {!form.values.costEstimate?.dateOfGeneration && !edit
                  ? (
                    <Typography variant='body2'>{trlb('case_tab_checkin_cost_estimate_not_available')}</Typography>
                  )
                  : null}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'ceenter',
                }}
              >
                {patientAssociationButtonClicked &&
                  !canViewNewButton &&
                  !form.values.costEstimate?.dateOfGeneration
                  ? (
                    <Typography variant='body2' sx={{ color: 'red', mt: 1 }}>
                      {trlb('case_tab_checkin_save_case_helper_text')}
                    </Typography>
                  )
                  : null}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        <NewCostEstimatePopUp
          open={newCostEstimatePopUpOpen}
          onClose={() => setNewCostEstimatePopUpOpen(false)}
          form={form}
          edit={edit}
        />
      </Panel>
      {spacer ? <Space20 /> : null}
    </>
  )
}

export const CostEstimateItem = ({
  costEstimate,
  canDownloadCostEstimates,
}: {
  costEstimate: CostEstimate
  canDownloadCostEstimates: boolean
}) => {
  const downloadFile = useDownloadFile()

  // TODO: at first refactoring we should use downloadFileForFE from lib.constants. Also wrapp in a useCall
  const handleDownload = async (fileId: string) => {
    let blobItem: Blob = await downloadFile(fileId)
    const href = URL.createObjectURL(blobItem)
    const link = document.createElement('a')
    link.href = href
    link.setAttribute('download', fileId)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingX: '10px',
      }}
    >
      <Box>{format(new Date(costEstimate.dateOfGeneration), trlb('dateTime_date_time_string'))}</Box>
      {canDownloadCostEstimates
        ? (
          <Box>
            <IconButton>
              {costEstimate.file?.fileId &&
                <DownloadIcon onClick={() => handleDownload(costEstimate.file?.fileId)} />}
            </IconButton>
          </Box>
        )
        : null}
    </Box>
  )
}

export const NewCostEstimatePopUp = ({
  open,
  onClose,
  form,
  edit,
}: {
  open: boolean
  form: FormikProps<CaseForm>
  onClose: () => void
  edit: boolean
}) => {
  const { materials } = useMaterials(form.values.bookingSection.date)
  const [selectionModel, setSelectionModel] = useState('')
  const caseMaterials = useGetCaseMaterialsPrices(form.values.caseId)
  const users = useAppSelector(state => state.users)
  const contracts = useAppSelector(state => state.contracts)
  const materialsAnagraphic = useGetMaterialsDatabaseVersion(form.values.bookingSection.date)
  const contract = useMemo(
    () =>
      getCaseContract({
        caseForm: form.values,
        contracts,
      }),
    [],
  )
  const doctorList = React.useMemo(
    () =>
      Object.values(users)
        .filter((user: Partial<IUser>) => user?.isDoctor)
        .map(doctor => doctor.id),
    [users],
  )

  const doctorOptions = useMemo(
    () =>
      doctorList.map(id => {
        const user = Object.values(users).find(item => item?.id === id)
        return { value: id, label: getFullName(user, true) }
      }),
    [users, doctorList],
  )

  const opStandardsOptions = useMemo(
    () =>
      contract
        ? Object.keys(contract?.opStandards ?? {}).reduce(
          (acc, val) =>
            acc.concat({
              value: val,
              label: contract?.opStandards?.[val]?.name,
            }),
          [],
        )
        : [],
    [contract],
  )

  const columns = [
    {
      field: 'materialId',
      headerName: trlb('commons_material_medication'),
      flex: 1,
      editable: true,
      valueFormatter: (params: any) => {
        const m = (materials ?? []).find(material => material.code === params.value)
        return m ? getMaterialLabel(m) : trlb('systemConfiguration_noMaterialSelected')
      },
      renderEditCell: (params: GridRenderEditCellParams) => {
        return (
          <Autocomplete
            value={(materials ?? []).find(material => material.code === params.row.materialId)}
            options={getAvailableMaterials(params.row.materialCode)}
            getOptionLabel={getMaterialLabel}
            disableClearable
            onChange={(_event, newValue) => {
              onCellEditCommit({ field: 'materialId', value: newValue?.code, id: params?.id })
            }}
            fullWidth
            sx={{ mx: 2 }}
            renderInput={params => (
              <TextField
                {...params}
                variant='standard'
                InputProps={{
                  ...(params.InputProps ?? {}),
                  disableUnderline: true,
                }}
              />
            )}
            renderOption={(props, item) => (
              <li {...props} key={item.id}>
                {getMaterialLabel(item)}
              </li>
            )}
          />
        )
      },
    },
    {
      field: 'amount',
      headerName: trlb('case_tab_checkin_amount'),
      flex: 1,
      renderCell: (params: any) => {
        const isTemp = checkTempMaterialId(params.row.materialId)
        return (
          <NumericTextField
            fullWidth
            value={params.value}
            onChange={event => {
              onCellEditCommit({ field: 'amount', value: event.target.value, id: params?.id })
            }}
            positiveOnly
            disabled={isTemp}
          />
        )
      },
      sortable: false,
      filterable: false,
    },
    {
      field: 'price',
      headerName: trlb('case_tab_checkin_price'),
      flex: 1,
      renderCell: (params: any) => {
        const isTemp = checkTempMaterialId(params.row.materialId)
        return (
          <NumericTextField
            fullWidth
            value={params.value}
            onChange={event => {
              onCellEditCommit({ field: 'price', value: event.target.value, id: params?.id })
            }}
            isPrice
            disabled={isTemp}
          />
        )
      },
      sortable: false,
      filterable: false,
    },
  ]

  const newCostEstimateForm = useFormik({
    initialValues: {
      patient: {
        name: form.values.bookingPatient.name,
        surname: form.values.bookingPatient.surname,
        birthDate: form.values.bookingPatient.birthDate,
      },
      surgery: {
        opstandardId: form.values.bookingSection.opStandardId,
        opstandardName: contract?.opStandards?.[form.values.bookingSection.opStandardId]?.name ?? '',
        bookingDate: form.values.bookingSection.date,
        doctorId: form.values.bookingSection.doctorId,
        doctorName: getFullName(users?.[form.values.bookingSection.doctorId], true),
      },
      opvPrice: null,
      standByPrice: null,
      generalAnesthesiaPrice: null,
      materialsPrices: null,
      useAndCarePrice: null,
      file: {
        fileId: '',
      },
      dateOfGeneration: new Date(),
    },
    validationSchema: yup.object({
      opvPrice: yup.number().required(trlb('commons_required')),
      standByPrice: yup.number().required(trlb('commons_required')),
      generalAnesthesiaPrice: yup.number().required(trlb('commons_required')),
      useAndCarePrice: yup.number().required(trlb('commons_required')),
      materialsPrices: yup
        .array()
        .of(
          yup.object({
            materialId: yup.string().required(trlb('commons_required')),
          }),
        )
        .nullable(),
    }),
    onSubmit: async (values, { resetForm }) => {
      form.setFieldValue('costEstimate', {
        ...values,
        dateOfGeneration: new Date(),
        materialsPrices: values?.materialsPrices?.map?.(materialPrice => ({
          ...materialPrice,
          materialName:
            materialPrice?.name ??
            (materials ?? []).find(material => material.code === materialPrice.materialId)?.name ??
            '',
        })),
      })
      resetForm()
      onClose()
    },
  })

  const materialsPrices = React.useMemo(
    () =>
      (materialsAnagraphic?.rows ?? []).reduce((acc, row) => {
        const materialPrice = parseMaterialRowInCaseOPItem(row)
        if (materialPrice) {
          const price = getPrice(materialPrice)
          acc[materialPrice.id] = isNaN(Number(price)) ? 0 : Number(price)
        }

        return acc
      }, {} as { [key: string]: number | null }),
    [materialsAnagraphic, contract, form.values],
  )

  const getAvailableMaterials = (materialCode?: string) =>
    (materials ?? []).filter(
      material =>
        material.code === materialCode ||
        !newCostEstimateForm.values.materialsPrices.some(row => row.materialId === material.code),
    )
  const [showMaterials, setShowMaterials] = useState(false)
  const materialsSum = newCostEstimateForm.values?.materialsPrices?.reduce?.(
    (acc, materialPrice) => acc + (materialPrice.amount * materialPrice.price),
    0,
  )
  const total = computeCostEstimateTotal(newCostEstimateForm.values)

  const addRow = () => {
    newCostEstimateForm.setFieldValue('materialsPrices', [
      ...(newCostEstimateForm.values?.materialsPrices ?? []),
      { materialId: `temp_${v4()}`, materialName: '', amount: 0, price: 0 },
    ])
  }

  const deleteRow = () => {
    newCostEstimateForm.setFieldValue(
      'materialsPrices',
      newCostEstimateForm.values?.materialsPrices?.filter?.(
        (materialPrice: MaterialPrice) => !selectionModel.includes(materialPrice.materialId),
      ),
    )
  }

  const onCellEditCommit = useCallback(
    ({ field, value, id }: { field: string; value: any; id: GridRowId }) => {
      const newValues = newCostEstimateForm.values?.materialsPrices?.map?.(valueRow => {
        if (valueRow.materialId === id)
          return {
            ...valueRow,
            amount: field === 'materialId' ? 1 : valueRow.amount,
            price: field === 'materialId' ? materialsPrices[value] ?? 0 : valueRow.price ?? 0,
            [field]: value,
          }

        return valueRow
      })
      newCostEstimateForm.setFieldValue('materialsPrices', newValues)
    },
    [newCostEstimateForm.values.materialsPrices, materialsPrices],
  )
  const save = () => {
    if (newCostEstimateForm.isValid) newCostEstimateForm.handleSubmit()
    else
      newCostEstimateForm.setTouched({
        opvPrice: true,
        standByPrice: true,
        generalAnesthesiaPrice: true,
        useAndCarePrice: true,
      })
  }

  useEffect(() => {
    if (caseMaterials?.length && !newCostEstimateForm.values?.materialsPrices)
      newCostEstimateForm.setFieldValue(
        'materialsPrices',
        caseMaterials.map(material => ({
          ...material,
          price: materialsPrices[material.materialId] ?? 0,
        })),
      )
  }, [caseMaterials, newCostEstimateForm.values.materialsPrices, materialsPrices])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='responsive-dialog-title'
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '800px',
          },
        },
      }}
    >
      <DialogTitle id='responsive-dialog-title'>{trlb('case_tab_checkin_new_cost_estimate')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SectionTitle text={trlb('case_tab_checkin_patient_info')} />
            </Grid>
            <FormikGridTextField
              label={trlb('patientForm_Name')}
              xs={4}
              {...{
                disabled: true,
                form,
                section: 'bookingPatient',
                errors: form.errors.bookingPatient,
                values: form.values.bookingPatient,
                touched: form.touched.bookingPatient,
                name: 'name',
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Surname')}
              xs={4}
              {...{
                disabled: true,
                form,
                section: 'bookingPatient',
                errors: form.errors.bookingPatient,
                values: form.values.bookingPatient,
                touched: form.touched.bookingPatient,
                name: 'surname',
              }}
            />
            <FormikGridInlineDatePicker
              label={trlb('patientForm_Birthdate')}
              xs={4}
              {...{
                disabled: true,
                form,
                section: 'bookingPatient',
                errors: form.errors.bookingPatient,
                values: form.values.bookingPatient,
                touched: form.touched.bookingPatient,
                name: 'birthDate',
              }}
            />
            <Grid item xs={12}>
              <SectionTitle text={trlb('case_tab_checkin_surgery_info')} />
            </Grid>
            <FormikGridInlineDatePicker
              label={trlb('bookingTab_BookingDate')}
              xs={4}
              {...{
                disabled: true,
                form,
                section: 'bookingSection',
                errors: form.errors.bookingSection,
                values: form.values.bookingSection,
                touched: form.touched.bookingSection,
                name: 'date',
              }}
            />
            <FormikGridAutocomplete
              searchIcon={undefined}
              xs={4}
              label={trlb('formBooking_Doctor')}
              options={doctorOptions}
              {...{
                disabled: true,
                form,
                section: 'bookingSection',
                errors: form.errors.bookingSection,
                values: form.values.bookingSection,
                touched: form.touched.bookingSection,
                name: 'doctorId',
              }}
            />
            <FormikGridAutocomplete
              searchIcon={undefined}
              xs={4}
              label={trlb('formBooking_OpStandard')}
              options={opStandardsOptions}
              {...{
                disabled: true,
                form,
                section: 'bookingSection',
                errors: form.errors.bookingSection,
                values: form.values.bookingSection,
                touched: form.touched.bookingSection,
                name: 'opStandardId',
              }}
            />
            <Grid item xs={12}>
              <SectionTitle text={trlb('case_tab_checkin_prices')} />
            </Grid>
            <FormikGridNumberField
              label={trlb('case_tab_checkin_opv')}
              xs={4}
              {...{
                disabled: false,
                form: newCostEstimateForm,
                section: '',
                errors: newCostEstimateForm.errors,
                values: newCostEstimateForm.values,
                touched: newCostEstimateForm.touched,
                name: 'opvPrice',
                isPrice: true,
              }}
            />
            <FormikGridNumberField
              label={trlb('case_tab_checkin_stand_by')}
              xs={4}
              {...{
                disabled: false,
                form: newCostEstimateForm,
                section: '',
                errors: newCostEstimateForm.errors,
                values: newCostEstimateForm.values,
                touched: newCostEstimateForm.touched,
                name: 'standByPrice',
                isPrice: true,
              }}
            />
            <FormikGridNumberField
              label={trlb('case_tab_checkin_general_anesthesia')}
              xs={4}
              {...{
                disabled: false,
                form: newCostEstimateForm,
                section: '',
                errors: newCostEstimateForm.errors,
                values: newCostEstimateForm.values,
                touched: newCostEstimateForm.touched,
                name: 'generalAnesthesiaPrice',
                isPrice: true,
              }}
            />
            <FormikGridNumberField
              label={trlb('case_tab_checkin_useAndCarePrice')}
              xs={6}
              {...{
                disabled: false,
                form: newCostEstimateForm,
                section: '',
                errors: newCostEstimateForm.errors,
                values: newCostEstimateForm.values,
                touched: newCostEstimateForm.touched,
                name: 'useAndCarePrice',
                isPrice: true,
              }}
            />
            <Grid item xs={6}>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <NumericTextField
                  label={trlb('case_tab_checkin_general_materials_sum')}
                  value={materialsSum}
                  disabled={true}
                  sx={{
                    flexGrow: 1,
                  }}
                  isPrice
                />
                <IconButton onClick={() => setShowMaterials(prev => !prev)}>
                  <InfoIcon />
                </IconButton>
              </Box>
            </Grid>
            <Space20 />
            {showMaterials && (
              <Grid item xs={12}>
                <FlexDataTable
                  rows={newCostEstimateForm.values?.materialsPrices ?? []}
                  columns={columns}
                  getRowId={(row: any) => row.materialId}
                  pageSize={7}
                  autoHeight
                  onCellEditCommit={onCellEditCommit}
                  components={{ Toolbar: MaterialPricesTableToolBar }}
                  componentsProps={{
                    toolbar: { selectionModel, addRow, deleteRow, edit },
                  }}
                  selectionModel={selectionModel}
                  onSelectionModelChange={setSelectionModel}
                  disableSelectionOnClick
                  checkboxSelection
                />
              </Grid>
            )}
            <Grid item xs={6}></Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <NumericTextField
                  label={trlb('case_tab_billing_total')}
                  value={total}
                  disabled={true}
                  sx={{
                    flexGrow: 1,
                  }}
                  isPrice
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={save} autoFocus>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const PaymentReceiptContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const checkPermission = useGetCheckPermission()
  const patient = form.values.bookingPatient
  const canViewPatient = checkPermission(permissionRequests.canViewPatient, {
    patient,
  })
  const canCreateReceipt = checkPermission(permissionRequests.canCreateReceipt, {
    caseItem: form.values,
  })
  const canDownloadReceipts = checkPermission(permissionRequests.canDownloadReceipts, {
    caseItem: form.values,
  })
  const depositReceipts = form.values.receipts
    .filter(receipt => receipt.type === ReceiptType.DEPOSIT)
  const canViewNewReceiptButton = form.values?.patientRef
    ? canViewPatient && canCreateReceipt
    : canCreateReceipt
  const [newReceiptPopUpOpen, setNewReceiptPopUpOpen] = useState(false)
  const handleNewReceipt = () => {
    setNewReceiptPopUpOpen(true)
  }
  const amountToPay = computeCostEstimateTotal(form.values.costEstimate)
  const amountPaid = depositReceipts.reduce((acc, receipt) => acc + (receipt?.amount ?? 0), 0)
  const outstandingAmount = amountToPay - amountPaid
  return (
    <Panel>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
          <Typography>{trlb('case_tab_checkin_payment_receipt')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '5px',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='primary'>
                {trlb('case_tab_checkin_outstanding_amount_warning_p1')}
              </Typography>
              <Typography variant='caption' color='primary'>
                {trlb('case_tab_checkin_outstanding_amount_warning_p2')}
              </Typography>
            </Box>
            {edit && canViewNewReceiptButton && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button onClick={handleNewReceipt}>{trlb('case_tab_checkin_new_payment_receipt')}</Button>
              </Box>
            )}
            <Space20 />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                paddingBottom: '20px',
              }}
            >
              <NumericTextField
                label={trlb('case_tab_checkin_amount_to_pay')}
                value={amountToPay}
                disabled={true}
                isPrice
              />
              <NumericTextField
                label={trlb('case_tab_checkin_amount_paid')}
                value={amountPaid}
                disabled={true}
                isPrice
              />
              <NumericTextField
                label={
                  outstandingAmount < 0
                    ? trlb('case_tab_checkout_outstanding_refund')
                    : trlb('case_tab_checkout_outstanding_payment')
                }
                value={Math.abs(outstandingAmount)}
                disabled={true}
                isPrice
              />
            </Box>
            <Box>
              {form.values.receipts.length
                ? form.values.receipts
                  .filter(receipt => receipt.type === ReceiptType.DEPOSIT)
                  .map(receipt => (
                    <ReceiptItem
                      canDownloadReceipts={canDownloadReceipts && canViewPatient}
                      receipt={receipt}
                      key={new Date(receipt.dateOfGeneration).getTime()}
                    />
                  ))
                : null}
              {!form.values.receipts.length && !edit
                ? (
                  <Typography variant='body2'>{trlb('case_tab_checkin_payment_receipt_not_available')}</Typography>
                )
                : null}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      <NewPaymentReceiptPopUp open={newReceiptPopUpOpen}
        onClose={() => setNewReceiptPopUpOpen(false)} form={form} />
    </Panel>
  )
}

const NewPaymentReceiptPopUp = ({
  open,
  onClose,
  form,
}: {
  open: boolean
  onClose: () => void
  form: FormikProps<CaseForm>
}) => {
  const newReceiptForm = useFormik({
    initialValues: {
      type: ReceiptType.DEPOSIT,
      patient: {
        name: form.values.bookingPatient.name,
        surname: form.values.bookingPatient.surname,
      },
      file: {
        fileId: '',
      },
      amount: null,
      dateOfGeneration: new Date(),
    },
    validationSchema: yup.object({
      type: yup.string().required(),
      amount: yup.number().required(),
    }),
    onSubmit: values => {
      form.setFieldValue('receipts', [
        ...form.values.receipts,
        {
          ...values,
          dateOfGeneration: new Date(),
        },
      ])
      onClose()
    },
  })

  const save = () => {
    if (newReceiptForm.isValid) newReceiptForm.handleSubmit()
    else newReceiptForm.setTouched({ type: true, netAmount: true, vatAmount: true })
  }

  const ReceiptTypesOptions = Object.values(ReceiptType).map(type => ({
    value: type,
    label: trlb(type),
  }))
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='responsive-dialog-title'
      sx={{
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: '800px',
          },
        },
      }}
    >
      <DialogTitle id='responsive-dialog-title'>{trlb('case_tab_checkin_new_payment_receipt')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SectionTitle text={trlb('case_tab_checkin_patient_info')} />
            </Grid>
            <FormikGridSelect
              label={trlb('case_tab_checkin_receipt_type')}
              menuItems={ReceiptTypesOptions}
              xs={12}
              {...{
                disabled: true,
                form: newReceiptForm,
                section: '',
                errors: newReceiptForm.errors,
                values: newReceiptForm.values,
                touched: newReceiptForm.touched,
                name: 'type',
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Name')}
              xs={6}
              {...{
                disabled: true,
                form,
                section: 'bookingPatient',
                errors: form.errors.bookingPatient,
                values: form.values.bookingPatient,
                touched: form.touched.bookingPatient,
                name: 'name',
              }}
            />
            <FormikGridTextField
              label={trlb('patientForm_Surname')}
              xs={6}
              {...{
                disabled: true,
                form,
                section: 'bookingPatient',
                errors: form.errors.bookingPatient,
                values: form.values.bookingPatient,
                touched: form.touched.bookingPatient,
                name: 'surname',
              }}
            />
            <Grid item xs={12}>
              <SectionTitle text={trlb('case_tab_checkin_prices')} />
            </Grid>
            <FormikGridNumberField
              label={trlb('case_tab_checkin_amount')}
              xs={12}
              {...{
                form: newReceiptForm,
                section: '',
                errors: newReceiptForm.errors,
                values: newReceiptForm.values,
                touched: newReceiptForm.touched,
                name: 'amount',
                isPrice: true,
              }}
            />
          </Grid>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          {trlb('commons_cancel')}
        </Button>
        <Button onClick={save} autoFocus>
          {trlb('commons_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const ReceiptItem = ({ receipt, canDownloadReceipts }:
{ receipt: Receipt; canDownloadReceipts: boolean }) => {
  const downloadFile = useDownloadFile()

  // TODO: at first refactoring we should use downloadFileForFE from lib.constants. Also wrapp in a useCall
  const handleDownload = async (fileId: string) => {
    let blobItem: Blob = await downloadFile(fileId)
    const href = URL.createObjectURL(blobItem)
    const link = document.createElement('a')
    link.href = href
    link.setAttribute('download', fileId)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingX: '10px',
        flexWrap: 'wrap',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
        }}
      >
        <Typography color='primary'>{trlb(receipt.type)}</Typography>
        <Typography>{format(new Date(receipt.dateOfGeneration), trlb('dateTime_date_time_string'))}</Typography>
      </Box>
      <Box>
        {receipt.file?.fileId && canDownloadReceipts
          ? (
            <IconButton>
              <DownloadIcon onClick={() => handleDownload(receipt.file.fileId)} />
            </IconButton>
          )
          : null}
        {!receipt.file?.fileId && canDownloadReceipts
          ? (
            <Typography>{trlb('case_tab_checkin_payment_pdf_link_not_available')}</Typography>
          )
          : null}
      </Box>
    </Box>
  )
}
