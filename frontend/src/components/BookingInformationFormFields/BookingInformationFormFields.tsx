import React, { useEffect, useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import {
  Contract,
  IUser,
  formatCaseForm,
  NewContractMatchOpStandard,
  getCaseContract,
  CaseForm,
  BookingDetailTabsEnum,
  extractCaseDataFromOpStandard,
} from '@smambu/lib.constants'
import { isAfter, isBefore, min, max, isValid, startOfDay, endOfDay } from 'date-fns'
import { useNewContractMatchOpStandard } from 'hooks/contractHooks'
import { useAppSelector } from 'store'
import { useLoggedUserIsDoctor } from 'hooks/userHooks'
import { FormikProps } from 'formik'
import ChangeOpstandardPopUp from './components/ChangeOpstandardPopUp'
import BookingInformationDate from './components/BookingInformationDate'
import ConfirmChangePopUp from './components/ConfirmChangePopUp'
import BookingInformationDetails from './components/BookingInformationDetails'
import { checkCaseRequiredFields } from 'utilities'

const section = BookingDetailTabsEnum.BOOKING_SECTION

// on date change, if the date change would trigger a change of contract (even a contract version change), trigger a warning
const getContractIdFromDate = (date: Date | null, contracts: Contract[] | null, doctorId: string) =>
  !isValid(date) || contracts == null
    ? null
    : contracts.find(
      contract =>
        !isAfter(contract.details.validFrom, date!) &&
        !isBefore(contract.details.validUntil, date!) &&
        contract?.associatedDoctor?.id === doctorId,
    )?.contractId

const BookingInformationFormFields = ({
  canEditBookingDateAndDoctor,
  canEditBookingOtherData,
  form,
  values,
  errors,
  touched,
  setOutsideDoctorSlots,
  warningFields,
  drawerOpen,
}: {
  canEditBookingDateAndDoctor: boolean
  canEditBookingOtherData: boolean
  form: FormikProps<CaseForm>
  errors: Record<string, string>
  values: Record<string, any>
  touched: Record<string, boolean>
  setOutsideDoctorSlots: any
  warningFields?: string[]
  drawerOpen: boolean
}) => {
  const [changeOpstandardId, setChangeOpstandardId] = useState('')
  const [changeContractDate, setChangeContractDate] = useState<Date | null>(null)
  const [lastValidDate, setLastValidDate] = useState<Date>(values.date)

  // Redux
  const loggedUserIsDoctor = useLoggedUserIsDoctor()
  const loggedUserId = useAppSelector(state => state.auth?.user?.id)
  const users = useAppSelector(state => state.users)
  const allContracts = useAppSelector(state => state.contracts)

  // Memoized values
  const contracts = useMemo(() => {
    const _contracts = Object.values(allContracts)

    if (values.doctorId && _contracts.length)
      return Object.values(allContracts)
        .filter((contract: Contract) => contract?.details?.doctorId === values.doctorId)

    return null
  }, [allContracts, values.doctorId])

  const doctorList = React.useMemo(
    () =>
      Object.values(users)
        .filter((user: Partial<IUser>) => user?.isDoctor)
        .map(doctor => doctor.id),
    [users],
  )

  const contract: Contract | null | undefined = useMemo(() => {
    const caseContract = getCaseContract({
      includeOriginalOP: true,
      caseForm: form.values,
      contracts: allContracts,
    })

    return values.doctorId && isValid(lastValidDate) ? caseContract : null
  }, [values.doctorId, lastValidDate, form.values, allContracts])

  const opStandardsOptions = useMemo(() => {
    if (contract === null || contract === undefined) return []

    const contractOpstandards = contract.opStandards

    if (contractOpstandards === undefined) return []

    const options = Object.entries(contractOpstandards).map(([key, value]) => ({
      value: key,
      label: value.name,
    }))

    return options
  }, [contract])

  const { newContractMatch, conflicts, newOpStandard } = useNewContractMatchOpStandard({
    currentContractId: values.contractId,
    changeContractId: getContractIdFromDate(changeContractDate, contracts, values.doctorId) ?? '',
    currentBodyRegions: form.values.surgerySection.surgeryBodyLocations,
    currentOpStandardId: values.opStandardId,
    currentPositions: form.values.surgerySection.positions,
  })

  // UseEffects
  // calculate min and max date considering all contract versions
  useEffect(() => {
    if (!contracts) return

    if (contracts.length === 0) {
      form.setFieldValue(section + '._minDate', startOfDay(new Date()))
      return
    }
    const minContractsDate = min(contracts.map((contract: Contract) => contract.details.validFrom))
    form.setFieldValue(section + '._minDate', startOfDay(minContractsDate))

    const newMaxDate: Date = max(contracts.map((contract: Contract) => contract.details.validUntil))
    form.setFieldValue(section + '._maxDate', endOfDay(newMaxDate))
  }, [form.values?.caseId, contracts])

  // force opStandard to be compatible with doctorId and date, and save contractId
  useEffect(() => {
    const contractId = getContractIdFromDate(lastValidDate, contracts, values.doctorId)
    let opStandardId = values.opStandardId

    if (contractId !== values.contractId) form.setFieldValue(section + '.contractId', contractId)

    if (contractId === values.contractId && !values.opStandardId) {
      opStandardId = opStandardsOptions.length === 1 ? opStandardsOptions[0]?.value : ''
      if (form.values.caseNumber !== '')
        setChangeOpstandardId(opStandardId)
      else if (opStandardId !== '')
        changeOpstandardInBookingRequest(opStandardId)
    }

    const contract = contracts?.find(contract => contract.contractId === contractId)
    const opStandard = contract?.opStandards?.[opStandardId]
    if (opStandard) checkCaseRequiredFields(form, opStandard)
  }, [lastValidDate,
    opStandardsOptions,
    values.contractId,
    values.opStandardId,
    values.doctorId,
    contracts])

  // If the user is a doctor and the case is new, set the doctorId to the logged user
  // If there is only one doctor in the list, set the doctorId to that doctor
  useEffect(() => {
    if (values.doctorId !== '') return

    if (loggedUserIsDoctor && !form.values.caseNumber) form.setFieldValue(section + '.doctorId', loggedUserId)
    else if (doctorList.length === 1) form.setFieldValue(section + '.doctorId', doctorList[0])
  }, [loggedUserId, loggedUserIsDoctor, doctorList, values.doctorId])

  // Actions
  const clearAllFieldsApartPatientTab = () => {
    // reset all fields except for patient, doctor and date
    const doctorId = values.doctorId
    const emptyCaseForm = formatCaseForm()
    const date = new Date(form.values?.bookingSection?.date?.getTime())
    form.setFieldValue('bookingSection', {
      ...emptyCaseForm.bookingSection,
      date,
      doctorId,
    })
    form.setFieldValue('surgerySection', emptyCaseForm.surgerySection)
    form.setFieldValue('anesthesiaSection', emptyCaseForm.anesthesiaSection)
    form.setFieldValue('preOpSection', emptyCaseForm.preOpSection)
    form.setFieldValue('postOpSection', emptyCaseForm.postOpSection)
    form.setFieldValue('intraOpSection', emptyCaseForm.intraOpSection)
  }

  const clearFieldsWithConflicts = () => {
    if (conflicts?.positions) form.setFieldValue('surgerySection.positions', [])
    if (conflicts?.bodyRegions) form.setFieldValue('surgerySection.surgeryBodyLocations', [])
  }

  const handleChangeContract = async () => {
    // if the case number is empty is a booking request and we need to clear all fields
    // if the case number is not empty is a case edit and we need to clear only the fields that make conflicts
    if (form?.values?.caseNumber === '' || newContractMatch === NewContractMatchOpStandard.noMatch)
      clearAllFieldsApartPatientTab()
    else clearFieldsWithConflicts()
    if (isValid(changeContractDate)) {
      form.setFieldValue(section + '.date', changeContractDate)
      setLastValidDate(changeContractDate!)
    }
    form.setFieldValue(section + '.opStandardId', '')
    setChangeContractDate(null)

    if (newContractMatch !== NewContractMatchOpStandard.noMatch)
      if (form.values?.caseNumber) setChangeOpstandardId(newOpStandard?.opStandardId ?? '')
      else changeOpstandardInBookingRequest(newOpStandard?.opStandardId)
  }

  const handleDeclineChangeContract = async () => {
    form.setFieldValue(section + '.date', lastValidDate)
    setChangeContractDate(null)
  }

  const changeOPstandardAndOverwriteOperationTabs = async () => {
    if (changeOpstandardId !== values.opStandardId) {
      const opStandard = Object.values(contract?.opStandards ?? {})
        .find(op => op.opStandardId === changeOpstandardId)

      if (opStandard == null) throw new Error('Opstandard not found') // this should never happen

      const emptyForm = formatCaseForm()

      await form.setFieldValue(section + '.opStandardId', changeOpstandardId)
      await form.setFieldValue('anesthesiaSection.anesthesiaList', opStandard?.bookingSection?.anesthesiaList?.slice())
      await form.setFieldValue('surgerySection', emptyForm.surgerySection)

      const positions = opStandard.bookingSection.positions
      if (positions.length === 1)
        await form.setFieldValue('surgerySection.positions', positions)

      await form.setFieldValue('bookingSection.duration', opStandard.surgeryDurationInMinutes)

      const {
        preOpSection,
        intraOpSection,
        postOpSection
      } = extractCaseDataFromOpStandard(opStandard!)

      await form.setFieldValue('preOpSection', preOpSection)
      await form.setFieldValue('intraOpSection', intraOpSection)
      await form.setFieldValue('postOpSection', postOpSection)

      if (opStandard != null)
        await checkCaseRequiredFields(form, opStandard)
    }
    setChangeOpstandardId('')
    setTimeout(() => {
      form.setFieldTouched(section + '.opStandardId', true)
      form.setFieldTouched('surgerySection.side', true)
      form.setFieldTouched('surgerySection.positions', true)
    }, 200)
  }

  const changeOPstandardWithoutOverwritingOperationTabs = async () => {
    if (changeOpstandardId !== values.opStandardId) {
      const emptyForm = formatCaseForm()
      await form.setFieldValue(section + '.opStandardId', changeOpstandardId)
      await form.setFieldValue('surgerySection', emptyForm.surgerySection)

      // XXX Please don't forget about this, we need to check this and then make
      // some changes
      if (contract != null) {
        const opStandards = contract.opStandards ?? {}
        const opStandard = Object.values(opStandards)
          .find(op => op.opStandardId === changeOpstandardId)

        const positions = opStandard?.bookingSection.positions ?? []
        if (positions.length === 1)
          await form.setFieldValue('surgerySection.positions', positions)

        if (opStandard != null)
          await checkCaseRequiredFields(form, opStandard)
      }
    }

    setChangeOpstandardId('')
    setTimeout(() => form.setFieldTouched(section + '.opStandardId', true))
  }

  const changeOpstandardInBookingRequest = async (opstandardId: string | undefined) => {
    const opStandard = Object.values(contract?.opStandards ?? {})
      .find(op => op.opStandardId === opstandardId)

    if (opStandard == null) throw new Error('Opstandard not found') // this should never happen

    const emptyForm = formatCaseForm()
    const positions = opStandard.bookingSection.positions
    await form.setFieldValue(section + '.opStandardId', opstandardId)
    await form.setFieldValue('surgerySection', {
      ...emptyForm.surgerySection,
      positions: positions.length === 1 ? positions : emptyForm.surgerySection.positions,
    })
    await form.setFieldValue('bookingSection.duration', opStandard.surgeryDurationInMinutes)

    await form.setFieldValue('bookingSection.duration', opStandard?.surgeryDurationInMinutes)

    if (positions != null && positions.length === 1)
      await form.setFieldValue('surgerySection.positions', positions)

    if (opStandard != null)
      await checkCaseRequiredFields(form, opStandard)

    setTimeout(() => form.setFieldTouched(section + '.opStandardId', true))
  }

  return (
    <>
      <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
        <BookingInformationDate
          contract={contract}
          contracts={contracts}
          drawerOpen={drawerOpen}
          form={form}
          values={values}
          errors={errors}
          touched={touched}
          setOutsideDoctorSlots={setOutsideDoctorSlots}
          canEditBookingDateAndDoctor={canEditBookingDateAndDoctor}
          getContractIdFromDate={getContractIdFromDate}
          setChangeContractDate={setChangeContractDate}
          setLastValidDate={setLastValidDate}
        />
        <BookingInformationDetails
          drawerOpen={drawerOpen}
          users={users}
          doctorList={doctorList}
          canEditBookingDateAndDoctor={canEditBookingDateAndDoctor}
          form={form}
          errors={errors}
          values={values}
          touched={touched}
          clearAllFieldsApartPatientTab={clearAllFieldsApartPatientTab}
          opStandardsOptions={opStandardsOptions}
          setChangeOpstandardId={setChangeOpstandardId}
          changeOpstandardInBookingRequest={changeOpstandardInBookingRequest}
          canEditBookingOtherData={canEditBookingOtherData}
          warningFields={warningFields}
        />
      </Grid>
      <ChangeOpstandardPopUp
        open={Boolean(changeOpstandardId)}
        onClose={() => setChangeOpstandardId('')}
        confirmWithOutOverWrite={changeOPstandardWithoutOverwritingOperationTabs}
        confirmWithOverWrite={changeOPstandardAndOverwriteOperationTabs}
      />
      <ConfirmChangePopUp
        changeContractDate={changeContractDate}
        handleChangeContract={handleChangeContract}
        handleDeclineChangeContract={handleDeclineChangeContract}
        newContractMatch={newContractMatch}
        caseNumber={form.values.caseNumber}
      />
    </>
  )
}

export default BookingInformationFormFields
