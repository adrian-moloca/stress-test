import React from 'react'
import { Typography, Grid, Button, IconButton, Popover, Box } from '@mui/material'
import { FormikGridStaticDateTimePicker } from '../../Commons'
import { trlb } from 'utilities'
import {
  isBefore,
  isValid,
  startOfDay,
  endOfDay,
  isWithinInterval,
  format,
  isSameDay,
  setHours,
  getHours,
  setMinutes,
  getMinutes,
  parse,
} from 'date-fns'
import { Info } from '@mui/icons-material'
import { FormikProps } from 'formik'
import { BookingDetailTabsEnum, Contract, calendarStartHour } from '@smambu/lib.constants'

const section = BookingDetailTabsEnum.BOOKING_SECTION

const BookingInformationDate = ({
  contract,
  contracts,
  drawerOpen,
  form,
  values,
  errors,
  touched,
  setOutsideDoctorSlots,
  canEditBookingDateAndDoctor,
  getContractIdFromDate,
  setChangeContractDate,
  setLastValidDate,
}: {
  contract: Contract | null | undefined
  contracts: Contract[] | null
  drawerOpen: boolean
  form: FormikProps<any>
  values: any
  errors: any
  touched: any
  setOutsideDoctorSlots: (value: boolean) => void
  canEditBookingDateAndDoctor: boolean
  getContractIdFromDate: (date: Date,
    contracts: Contract[] | null,
    doctorId: string) => string | null | undefined
  setChangeContractDate: (date: Date) => void
  setLastValidDate: (date: Date) => void
}) => {
  const [showSlots, setShowSlots] = React.useState(null)

  const { outOfSurgerySlots, sameDaySlots } = React.useMemo(() => {
    if (!contract || !isValid(values.date)) return { outOfSurgerySlots: false }
    const validSlots = contract?.details?.surgerySlots?.filter(
      slot => isValid(new Date(slot.to)) && isValid(new Date(slot.from)),
    )
    return {
      outOfSurgerySlots: !validSlots?.some(slot =>
        isWithinInterval(values.date, { start: new Date(slot.from), end: new Date(slot.to) })),
      sameDaySlots: validSlots?.filter(
        slot => isSameDay(values.date, new Date(slot.from)) &&
          isSameDay(values.date, new Date(slot.to)),
      ),
    }
  }, [contract, values.date])

  React.useEffect(() => setOutsideDoctorSlots(outOfSurgerySlots), [outOfSurgerySlots])

  const dateErrorMsg = React.useMemo(() => {
    if (outOfSurgerySlots) return trlb('warning_dateNotInContract')

    if (values.doctorId && contracts?.length === 0) return trlb('bookingTab_noContractsErrorMessage')

    return undefined
  }, [contracts?.length, outOfSurgerySlots, values.doctorId])

  const onChange = (newValue: Date, forceTime?: boolean) => {
    if (!newValue || !isValid(newValue)) return

    const newContractId = getContractIdFromDate(newValue, contracts, values.doctorId)
    const newContract = contracts?.find(contract => contract.contractId === newContractId)
    const availableSlots = newContract?.details?.surgerySlots?.filter(
      slot =>
        isValid(new Date(slot.to)) &&
        isValid(new Date(slot.from)) &&
        isSameDay(newValue, new Date(slot.from)) &&
        isSameDay(newValue, new Date(slot.to)),
    )
    let newDate = newValue
    if (!isValid(values.date) && !forceTime)
      if (availableSlots?.[0]) {
        const slot = availableSlots[0]
        const newTime = new Date(slot.from)
        newDate = setHours(newDate, getHours(newTime))
        newDate = setMinutes(newDate, getMinutes(newTime))
      } else {
        const startDate = parse(calendarStartHour, 'HH:mm', new Date())
        newDate = setHours(newDate, getHours(startDate))
        newDate = setMinutes(newDate, getMinutes(startDate))
      }

    const oldContractId = getContractIdFromDate(values.date, contracts, values.doctorId)
    if (values.doctorId &&
      values.date &&
      oldContractId != null &&
      newContractId !== oldContractId) {
      setChangeContractDate(newDate)
    } else {
      setLastValidDate(newDate)
      form.setFieldValue(section + '.date', newDate)
    }
    setTimeout(() => form.validateForm(), 500)
  }

  const onBlur = () => {
    if (values.doctorId && values.date && isValid(values.date)) {
      const oldContractId = getContractIdFromDate(values.date, contracts, values.doctorId)
      if (contract && oldContractId !== contract.contractId)
        setChangeContractDate(values.date)
      else setLastValidDate(values.date)
    }

    setTimeout(() => form.validateForm(), 500)
  }

  return (
    <Grid item xl={5} lg={drawerOpen ? 12 : 5} md={12}>
      {isValid(values.date) && dateErrorMsg
        ? (
          <Box
            sx={{
              backgroundColor: theme => theme.palette.secondary.light,
              width: '100%',
              textAlign: 'center',
              borderRadius: theme => theme.constants.radius,
              mb: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>{dateErrorMsg}</Typography>
            <>
              <IconButton onClick={(e: any) => setShowSlots(e.currentTarget)}>
                <Info />
              </IconButton>
              <Popover
                open={!!showSlots}
                anchorEl={showSlots}
                onClose={() => setShowSlots(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                slotProps={{ paper: { sx: { p: 2 } } }}
              >
                <Typography variant='h6' sx={{ mb: 1 }}>
                  {trlb(sameDaySlots?.length ? 'bookingTab_availableSlots' : 'bookingTab_noSlotsAvailable', {
                    date: format(values.date, trlb('dateTime_date_string')),
                  })}
                </Typography>
                {sameDaySlots?.map(slot => (
                  <Button
                    key={slot.id}
                    onClick={() => {
                      onChange(new Date(slot.from))
                      setShowSlots(null)
                    }}
                    variant='outlined'
                    sx={{ mb: 1 }}
                  >
                    {`${format(new Date(slot.from), trlb('dateTime_time_string'))} ${trlb(
                      'dateTime_dateRange_separator',
                    )} ${format(new Date(slot.to), trlb('dateTime_time_string'))}`}
                  </Button>
                ))}
              </Popover>
            </>
          </Box>
        )
        : null}
      <FormikGridStaticDateTimePicker
        xs={12}
        label={trlb('bookingTab_BookingDate')}
        {...{
          disabled: !canEditBookingDateAndDoctor || contracts?.length === 0,
          form,
          section,
          errors,
          values,
          touched,
          name: 'date',
          minDate: isBefore(values._minDate, startOfDay(new Date()))
            ? startOfDay(new Date())
            : values._minDate,
          maxDate: values._maxDate,
          onChange,
          onBlur,
          shouldDisableDate: (date: Date) => {
            return !contracts?.some(c =>
              isWithinInterval(date, {
                start: startOfDay(c.details.validFrom),
                end: endOfDay(c.details.validUntil),
              }))
          },
        }}
      />
    </Grid>
  )
}

export default BookingInformationDate
