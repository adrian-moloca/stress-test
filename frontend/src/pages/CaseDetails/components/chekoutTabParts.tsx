import React, { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material'
import {
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
  ReceiptType,
  formatCurrency,
  getInvoicesToPayDirectyToClinic,
  permissionRequests,
} from '@smambu/lib.constants'
import { FormikProps, useFormik } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import * as yup from 'yup'
import { ReceiptItem } from './CheckinTabParts'
import { getLanguage, trlb } from 'utilities'
import { useAppSelector } from 'store'

const language = getLanguage()

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
  const refundReceipts = form.values.receipts.filter(receipt => receipt.type === ReceiptType.REFUND)
  const paymentReceipts = form.values.receipts
    .filter(receipt => receipt.type === ReceiptType.PAYMENT)
  const depositReceipts = form.values.receipts
    .filter(receipt => receipt.type === ReceiptType.DEPOSIT)
  const canViewNewReceiptButton = form.values.patientRef
    ? canViewPatient && canCreateReceipt
    : canCreateReceipt
  const [newReceiptPopUpOpen, setNewReceiptPopUpOpen] = useState(false)
  const handleNewReceipt = () => {
    setNewReceiptPopUpOpen(true)
  }

  const invoicesToPayDirectly = getInvoicesToPayDirectyToClinic(form.values)
  const amountPrePaid = depositReceipts.reduce((acc, receipt) => acc + (receipt?.amount ?? 0), 0)
  const amountOwed = invoicesToPayDirectly.reduce((acc, invoice) => acc + invoice.totalOwed, 0)
  const amountPaid = paymentReceipts.reduce((acc, receipt) => acc + (receipt?.amount ?? 0), 0)
  const amountRefunded = refundReceipts.reduce((acc, receipt) => acc + (receipt?.amount ?? 0), 0)
  const amoutPaidOrRefunded = amountPaid - amountRefunded
  const outstandingAmount = amountOwed - amoutPaidOrRefunded

  const patientOweUs = amountOwed < 0
  const refundedMoreThanPaid = amoutPaidOrRefunded < 0
  const outstandingAmountPositive = outstandingAmount < 0

  const currencySymbol = useAppSelector(state => state.global.currencySymbol)

  const localizedAmount = formatCurrency(amountPrePaid, currencySymbol, language)

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
              }}
            >
              <Typography variant='caption' color='primary'>
                {trlb('case_tab_checkout_amount_paid_at_checkin', {
                  amountPaid: localizedAmount,
                })}
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
                label={patientOweUs ? trlb('case_tab_checkout_amount_to_refund') : trlb('case_tab_checkout_amount_to_pay')}
                value={Math.abs(amountOwed)}
                disabled={true}
                isPrice
              />
              <NumericTextField
                label={refundedMoreThanPaid ? trlb('case_tab_checkout_amount_refunded') : trlb('case_tab_checkout_amount_paid')}
                value={Math.abs(amoutPaidOrRefunded)}
                disabled={true}
                isPrice
              />
              <NumericTextField
                label={
                  outstandingAmountPositive
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
                  .filter(receipt => receipt.type === ReceiptType.PAYMENT ||
                    receipt.type === ReceiptType.REFUND)
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
      {newReceiptPopUpOpen && (
        <NewPaymentReceiptPopUp
          open={newReceiptPopUpOpen}
          onClose={() => setNewReceiptPopUpOpen(false)}
          form={form}
          isRefund={outstandingAmount < 0}
        />
      )}
    </Panel>
  )
}

const NewPaymentReceiptPopUp = ({
  open,
  onClose,
  form,
  isRefund,
}: {
  open: boolean
  onClose: () => void
  form: FormikProps<CaseForm>
  isRefund: boolean
}) => {
  const newReceiptForm = useFormik({
    initialValues: {
      type: isRefund ? ReceiptType.REFUND : ReceiptType.PAYMENT,
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
    else newReceiptForm.setTouched({ type: true })
  }

  const ReceiptTypesOptions = [ReceiptType.PAYMENT, ReceiptType.REFUND].map(type => ({
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
