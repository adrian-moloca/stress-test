import { SurgerySlot, getRandomUniqueId, weekdaysList } from '@smambu/lib.constants'
import { Box, FormControlLabel, Grid, SelectChangeEvent, Typography, Checkbox } from '@mui/material'
import { SaveButton } from 'components/Buttons'
import { GridMultiDateSelector, GridSelect, GridTimeSelector, SectionSubtitle, Space40 } from 'components/Commons'
import { addDays, addHours, differenceInCalendarDays, getDay, isAfter, isSameDay, isValid } from 'date-fns'
import React from 'react'
import { trlb } from 'utilities'

const MultipleSlots = ({
  validFrom,
  validUntil,
  currentSlots,
  setSlots,
  remove,
  error,
  onSave,
}: {
  validFrom: Date
  validUntil: Date
  currentSlots: SurgerySlot[]
  setSlots: (value: SurgerySlot[]) => void
  remove?: boolean
  error?: string
  onSave?: (slots: SurgerySlot[]) => void
}) => {
  const [from, setFrom] = React.useState<Date | null>(new Date(validFrom))
  const [to, setTo] = React.useState<Date | null>(addHours(new Date(validFrom), 1))
  const [chosenDays, setChosenDay] = React.useState<number[]>([])
  const [repeatedOption, setRepeatedOption] = React.useState<number | string>('')
  const [multipleDaysSelected, setMultipleDaysSelected] = React.useState<Date[]>([])
  const [touched, setTouched] = React.useState({ from: false, to: false })
  const distance = differenceInCalendarDays(new Date(validUntil), new Date(validFrom))

  const calculateSchedule = () => {
    if (!to || !from) return
    let selectedSlots: SurgerySlot[] = []
    const fromHour = from.getHours()
    const fromMinute = from.getMinutes()
    const toHour = to.getHours()
    const toMinute = to.getMinutes()
    if (chosenDays.length) {
      let weekIndex = 0
      let tempSelectedSlots: Record<string, SurgerySlot[]> = {}

      for (let i = 0; i < distance + 1; i++) {
        const currentDay = addDays(new Date(validFrom), i)
        const dayOfWeek = getDay(currentDay)
        if (dayOfWeek === 1 && !!i) weekIndex++
        if (chosenDays.includes(dayOfWeek))
          tempSelectedSlots = {
            ...tempSelectedSlots,
            [weekIndex.toString()]: [
              ...(tempSelectedSlots[weekIndex.toString()] ?? []),
              {
                id: getRandomUniqueId(),
                from: currentDay.setHours(fromHour, fromMinute, 0, 0),
                to: currentDay.setHours(toHour, toMinute, 0, 0),
              },
            ],
          }
      }
      if (repeatedOption)
        Object.keys(tempSelectedSlots).forEach(key => {
          if (Number(key) % Number(repeatedOption) !== 0) delete tempSelectedSlots[key]
        })

      Object.values(tempSelectedSlots).forEach(_value => {
        selectedSlots = selectedSlots.concat(_value)
      })
    } else if (multipleDaysSelected.length) {
      selectedSlots = multipleDaysSelected.map(date => ({
        id: getRandomUniqueId(),
        from: date.setHours(fromHour, fromMinute, 0, 0),
        to: date.setHours(toHour, toMinute, 0, 0),
      }))
    } else {
      selectedSlots = [
        {
          id: getRandomUniqueId(),
          from: new Date(validFrom).setHours(fromHour, fromMinute, 0, 0),
          to: new Date(validUntil).setHours(toHour, toMinute, 0, 0),
        },
      ]
    }

    setSlots(selectedSlots)
  }

  const calculateScheduleForRemoving = () => {
    let finalItems = [...currentSlots]
    if (multipleDaysSelected.length)
      finalItems = finalItems.filter(item => !multipleDaysSelected
        .some(date => isSameDay(item.from, date)))
    else finalItems = finalItems.filter(item => !chosenDays.includes(getDay(new Date(item.from))))

    setSlots(finalItems)
  }

  const handleSelectMultiDays = (values: Date[]) => {
    setMultipleDaysSelected(values)
  }

  const onChangeSelectedDay = (weekDayNumber: number) =>
    (_e: React.SyntheticEvent<Element, Event>, value: boolean) => {
      if (!value) {
        setChosenDay([...chosenDays].filter(day => day !== weekDayNumber))
        return
      }
      if (chosenDays.includes(weekDayNumber)) return
      setChosenDay([...chosenDays, weekDayNumber])
    }

  React.useEffect(() => {
    if (multipleDaysSelected.length && (chosenDays.length || repeatedOption)) {
      setRepeatedOption('')
      setChosenDay([])
    }
    if (!remove) calculateSchedule()
    else calculateScheduleForRemoving()
  }, [multipleDaysSelected])

  React.useEffect(() => {
    if (multipleDaysSelected.length && (chosenDays.length || repeatedOption))
      setMultipleDaysSelected([])

    if (!remove) calculateSchedule()
    else calculateScheduleForRemoving()
  }, [repeatedOption, chosenDays])

  React.useEffect(() => {
    if (!remove) calculateSchedule()
    else calculateScheduleForRemoving()
  }, [from, to])

  const checkTimeError = (time: Date | null) => {
    if (remove) return ''
    if (!time) return 'commons_required'
    if (!isValid(time)) return 'commons_invalid_time'
    return ''
  }

  const checkTimes = (fromTime: any, toTime: any) =>
    !remove &&
      fromTime &&
      toTime &&
      isValid(fromTime) &&
      isValid(toTime) &&
      isAfter(fromTime, toTime)
      ? 'contract_slotTimesMismatch'
      : ''

  const errors = {
    from: checkTimeError(from),
    to: checkTimeError(to),
    general:
      (!multipleDaysSelected.length && !chosenDays.length ? 'contract_multipleSlots_noDaysSelected' : '') ||
      checkTimes(from, to) ||
      error,
  }

  const disabled = Object.values(errors).some(Boolean)

  return (
    <>
      {!remove
        ? (
          <>
            <SectionSubtitle text={trlb('commons_time')} />
            <GridTimeSelector
              value={from}
              label={trlb('commons_from')}
              xs={4}
              onChange={setFrom}
              onBlur={() => setTouched({ ...touched, from: true })}
              error={Boolean(errors.from && touched.from)}
              helperText={touched.from ? trlb(errors.from) : ''}
            />
            <GridTimeSelector
              value={to}
              label={trlb('commons_to')}
              xs={4}
              minTime={from ?? undefined}
              onChange={setTo}
              onBlur={() => setTouched({ ...touched, to: true })}
              error={Boolean(errors.to && touched.to)}
              helperText={touched.to ? trlb(errors.to) : ''}
            />
          </>
        )
        : null}

      <SectionSubtitle text={remove ? trlb('removeEvery') : trlb('repeatEvery')} />
      <Grid
        item
        xs={8}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          paddingLeft: '0',
        }}
      >
        {weekdaysList.map((day, index) => (
          <FormControlLabel
            key={day}
            sx={{ width: '150px' }}
            control={<Checkbox />}
            label={trlb(`dateTime_${day}`)}
            checked={chosenDays.includes(index + 1)}
            onChange={onChangeSelectedDay(index + 1)}
          />
        ))}
      </Grid>
      {!remove
        ? (
          <GridSelect
            name='repeatedOption'
            xs={8}
            disabled={!chosenDays.length}
            menuItems={[
              { label: '', value: '' },
              ...[trlb('dateTime_two_weeks'), trlb('dateTime_three_weeks'), trlb('dateTime_four_weeks')].map(
                (el, index) => ({
                  value: index + 2,
                  label: el,
                }),
              ),
            ]}
            label={trlb('onlyOnce_every')}
            value={repeatedOption ? String(repeatedOption) : undefined}
            // eslint-disable-next-line max-len
            onChange={(e: SelectChangeEvent<unknown>) => setRepeatedOption(e.target.value as string)}
          />
        )
        : null}

      <SectionSubtitle text={trlb('chooseSpecific_Dates')} />
      <GridMultiDateSelector
        minDate={new Date(validFrom)}
        maxDate={new Date(validUntil)}
        value={multipleDaysSelected}
        onChange={handleSelectMultiDays}
      />
      <Space40 />
      <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
        <SaveButton disabled={disabled} onClick={onSave} />
        {errors.general && (
          <Typography sx={{ color: 'red', mt: 1 }} variant='body1'>
            {trlb(errors.general)}
          </Typography>
        )}
      </Box>
    </>
  )
}

export default MultipleSlots
