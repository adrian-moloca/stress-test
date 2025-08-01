import { Contract, SurgerySlot, getRandomUniqueId } from '@smambu/lib.constants'
import { Grid, Modal, Paper, Typography } from '@mui/material'
import { CloseButton, SaveButton } from 'components/Buttons'
import { GridDateSelector, GridTimeSelector, PageHeader, Space20, Space40 } from 'components/Commons'
import { addHours, endOfDay, isBefore, isValid, startOfDay } from 'date-fns'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'

const AddSingleTimeSlot = ({
  showAddTimeSlot,
  setShowAddTimeSlot,
  form,
  currentSlots,
  setSurgerySlots,
}: {
  showAddTimeSlot: boolean
  setShowAddTimeSlot: (value: boolean) => void
  form: FormikProps<Omit<Contract, 'contractId'>>
  currentSlots: SurgerySlot[]
  setSurgerySlots: (value: SurgerySlot[]) => void
}) => {
  const fromDate = startOfDay(new Date(form.values.details.validFrom))
  const untilDate = endOfDay(new Date(form.values.details.validUntil))

  const [date, setDate] = React.useState<Date | null>(fromDate)
  const [timeFrom, setTimeFrom] = React.useState<Date | null>(fromDate)
  const [timeTo, setTimeTo] = React.useState<Date | null>(addHours(fromDate, 1))
  const [touched, setTouched] = React.useState({ date: false, timeFrom: false, timeTo: false })

  const newSlot = {
    from:
      isValid(date) && isValid(timeFrom)
        ? new Date(date!).setHours(timeFrom!.getHours(), timeFrom!.getMinutes(), 0, 0)
        : null,
    to:
      isValid(date) && isValid(timeTo)
        ? new Date(date!).setHours(timeTo!.getHours(), timeTo!.getMinutes(), 0, 0)
        : null,
  }

  const checkGeneralError = () => {
    if (!newSlot.from || !newSlot.to || !isValid(newSlot.from) || !isValid(newSlot.to)) return ' '

    if (!isBefore(newSlot.from, newSlot.to)) return 'contract_slotTimesMismatch'

    const sortedSurgerySlots = [...currentSlots, newSlot]
      .sort((a, b) => (a.from! > b.from! ? 1 : -1))
    for (let i = 0; i < sortedSurgerySlots.length - 1; i++) {
      const parsedFromDate = new Date(sortedSurgerySlots[i].from!)
      const parsedToDate = new Date(sortedSurgerySlots[i].to!)
      if (parsedFromDate.getTime() > parsedToDate.getTime())
        return 'contract_slotTimesMismatch'

      if (parsedToDate.getTime() > new Date(sortedSurgerySlots[i + 1].from!).getTime())
        return 'contract_slotsDatesOverlap'
    }
    return ''
  }

  const checkDateError = () => {
    if (!date) return 'commons_required'
    if (!isValid(date)) return 'commons_invalid_date'
    return ''
  }

  const checkTimeError = (time: Date | null) => {
    if (!time) return 'commons_required'
    if (!isValid(time)) return 'commons_invalid_time'
    return ''
  }

  const errors = {
    date: checkDateError(),
    timeFrom: checkTimeError(timeFrom),
    timeTo: checkTimeError(timeTo),
    general: checkGeneralError(),
  }
  const disabled = Object.values(errors).some(error => Boolean(error))

  const onClose = () => {
    setShowAddTimeSlot(false)
  }

  const onSave = () => {
    setSurgerySlots(
      [...currentSlots, { ...newSlot, id: getRandomUniqueId() }].map(obj => ({
        id: obj.id,
        from: new Date(obj.from!),
        to: new Date(obj.to!),
      })),
    )
    onClose()
  }

  return (
    <Modal
      open={showAddTimeSlot}
      onClose={onClose}
      BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0, 0.3)' } }}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{ maxHeight: '90%', maxWidth: '60%', padding: '20px', pt: 0, overflowY: 'auto', position: 'relative' }}
      >
        <PageHeader
          toolbarSx={{ top: 0 }}
          pageTitle={trlb('addTimeSlot_pageTitle')}
          button={<CloseButton onClick={onClose} />}
        />
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          <Space20 />
          <GridDateSelector
            xs={4}
            value={date}
            error={Boolean(errors.date && touched.date)}
            helperText={touched.date ? trlb(errors.date) : ''}
            minDate={fromDate}
            maxDate={untilDate}
            onChange={value => setDate(value)}
            onBlur={() => setTouched({ ...touched, date: true })}
          />
          <GridTimeSelector
            value={timeFrom}
            label={trlb('commons_from')}
            error={Boolean(errors.timeFrom && touched.timeFrom)}
            helperText={touched.timeFrom ? trlb(errors.timeFrom) : ''}
            xs={4}
            onChange={value => setTimeFrom(value)}
            minTime={fromDate}
            onBlur={() => setTouched({ ...touched, timeFrom: true })}
          />
          <GridTimeSelector
            value={timeTo}
            label={trlb('commons_to')}
            error={Boolean(errors.timeTo && touched.timeTo)}
            helperText={touched.timeTo ? trlb(errors.timeTo) : ''}
            xs={4}
            onChange={value => setTimeTo(value)}
            maxTime={untilDate}
            onBlur={() => setTouched({ ...touched, timeTo: true })}
          />
          <Typography sx={{ mt: 2, color: 'error.main' }}>{errors.general && trlb(errors.general)}</Typography>
          <Space40 />
          <SaveButton onClick={onSave} disabled={disabled} />
        </Grid>
      </Paper>
    </Modal>
  )
}

export default AddSingleTimeSlot
