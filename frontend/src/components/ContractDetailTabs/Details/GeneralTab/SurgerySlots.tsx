import { Box, Grid, IconButton, TextField } from '@mui/material'
import { TextIconButton } from 'components/Buttons'
import { SectionTitle, Space20 } from 'components/Commons'
import React, { useEffect, useState } from 'react'
import { trlb } from 'utilities'
import AddIcon from '@mui/icons-material/Add'
import { Contract, SurgerySlot, ampmEnabled, validateInsertedDate } from '@smambu/lib.constants'
import { FormikProps } from 'formik'
import { format, isSameDay, isValid } from 'date-fns'
import SurgerySlotsToolbar from './SurgerySlotsToolbar'
import { FlexDataTable, FlexSelect } from 'components/FlexCommons'
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers'
import { Clear } from '@mui/icons-material'
import AddSingleTimeSlot from './AddSingleTimeSlot'
import AddMultipleTimeSlots from './AddMultipleTimeSlots'
import RemoveMultipleTimeSlots from './RemoveMultipleTimeSlots'

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)
interface SurgerySlotsProps {
  edit: boolean
  form: FormikProps<Omit<Contract, 'contractId'>>
}

const SlotCell = ({
  edit,
  slot,
  label,
  surgerySlots,
  onChange,
}: {
  edit: boolean
  slot: SurgerySlot
  label: 'from' | 'to'
  surgerySlots: SurgerySlot[]
  onChange: (newSurgerySlots: SurgerySlot[]) => void
}) => {
  const [slotRowError, setSlotRowError] = useState(false)
  const value = slot[label]
  if (!edit && (!value || !isValid(new Date(value)))) return <></>
  if (!edit) return <>{format(new Date(value), trlb('dateTime_date_time_string'))}</>

  const onPickerChange = (value: Date | null) => {
    let isValid = true
    const newSurgerySlots = [...surgerySlots]
    const slotIndex = surgerySlots.findIndex(obj => obj.id === slot.id)
    if (slotIndex > -1) {
      newSurgerySlots[slotIndex][label] = new Date(new Date(value).setSeconds(0, 0))
      if (new Date(newSurgerySlots[slotIndex].to)
        .getTime() < new Date(newSurgerySlots[slotIndex].from)
        .getTime())
        isValid = false
    }
    const sortedSurgerySlots = [...newSurgerySlots].sort((a, b) =>
      new Date(a.from).getTime() > new Date(b.from).getTime() ? 1 : -1)
    for (let i = 0; i < sortedSurgerySlots.length - 1; i++) {
      const nextDistance =
        new Date(sortedSurgerySlots[i + 1].from)
          .getTime() - new Date(sortedSurgerySlots[i].from)
          .getTime()
      const currentAmount =
        new Date(sortedSurgerySlots[i].to)
          .getTime() - new Date(sortedSurgerySlots[i].from)
          .getTime()
      if (nextDistance <= currentAmount) {
        isValid = false
        break
      }
    }
    if (isValid) {
      onChange(newSurgerySlots)
      setSlotRowError(false)
    } else {
      setSlotRowError(true)
    }
  }

  return (
    <DateTimePicker
      ampm={ampmEnabled}
      inputFormat={trlb('dateTime_date_time_string')}
      label={label}
      value={value}
      minDate={label === 'from' ? new Date() : new Date(slot.from)}
      onChange={onPickerChange}
      disabled
      renderInput={params => (
        <TextField
          {...params}
          error={Boolean(slotRowError)}
          helperText={slotRowError ? trlb('contract_invalid_slot_time') : ''}
          disabled={false}
          inputProps={{ ...params.inputProps, readOnly: true }}
        />
      )}
    />
  )
}

export const SurgerySlots: React.FC<SurgerySlotsProps> = ({ edit, form }) => {
  const [selectionModel, setSelectionModel] = useState<string[]>([])
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false)
  const [showRemoveTimeSlot, setShowRemoveTimeSlot] = useState(false)
  const [singleSlotProp, setSingleSlotProp] = useState(false)
  const [surgerySlots, setSurgerySlots] = useState<SurgerySlot[]>([])
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [filterMonth, setFilterMonth] = useState<number | ''>('')
  const [filterDate, setFilterDate] = useState<Date | null>(null)

  const firstSlotDate = new Date(surgerySlots[0]?.from)
  const lastSlotDate = new Date(surgerySlots[surgerySlots.length - 1]?.to)
  const filterYears = Array.from(
    { length: lastSlotDate.getFullYear() - firstSlotDate.getFullYear() + 1 },
    (_, i) => firstSlotDate.getFullYear() + i,
  )
  const filterMonths = Array.from({ length: 12 }, (_, i) => i)

  const handleRemoveSelectedSlots = () => {
    const filteredSlots = surgerySlots.filter(slot => !selectionModel.includes(slot.id ?? ''))
    form.setFieldValue('details.surgerySlots', filteredSlots)
    setSelectionModel([])
  }

  const overLapError = surgerySlots.some((slot, index) => {
    const nextSlot = surgerySlots[index + 1]
    if (nextSlot && new Date(slot.to).getTime() > new Date(nextSlot.from).getTime()) return true
    return false
  })

  const rows = surgerySlots.filter(
    (slot: SurgerySlot) =>
      (filterYear === '' || new Date(slot.from).getFullYear() === filterYear) &&
      (filterMonth === '' || new Date(slot.from).getMonth() === filterMonth) &&
      (filterDate === null || isSameDay(new Date(slot.from), filterDate)),
  )

  const columns = [
    {
      field: 'from',
      headerName: 'from',
      flex: 1,
      width: 150,
      renderCell: (params: any) => (
        <SlotCell
          {...{
            edit,
            slot: params.row,
            label: 'from',
            surgerySlots,
            onChange: newSurgerySlots => {
              form.setFieldValue('details.surgerySlots', newSurgerySlots)
            },
          }}
        />
      ),
    },
    {
      field: 'to',
      headerName: 'to',
      flex: 1,
      width: 150,
      renderCell: (params: any) => (
        <SlotCell
          {...{
            edit,
            slot: params.row,
            label: 'to',
            surgerySlots,
            onChange: newSurgerySlots => {
              form.setFieldValue('details.surgerySlots', newSurgerySlots)
            },
          }}
        />
      ),
    },
  ]

  useEffect(() => {
    setSurgerySlots(
      [...(form.values?.details?.surgerySlots ?? [])]
        .sort((a, b) => (new Date(a.from).getTime() > new Date(b.from).getTime() ? 1 : -1))
        .map(slot => ({
          ...slot,
          from: new Date(slot.from),
          to: new Date(slot.to),
        })),
    )
  }, [form.values?.details?.surgerySlots])

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
        }}
      >
        <Box
          sx={{
            width: '25%',
          }}
        >
          <SectionTitle text={trlb('surgery_slots')} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            width: '75%',
          }}
        >
          <Box
            sx={{
              width: '33%',
            }}
          >
            <FlexSelect
              name='year'
              label={trlb('commons_year')}
              menuItems={[
                { value: '', label: '-' },
                ...filterYears.map(year => ({ value: String(year), label: String(year) })),
              ]}
              onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
              value={String(filterYear)}
            />
          </Box>
          <Box
            sx={{
              width: '33%',
            }}
          >
            <FlexSelect
              name='month'
              label={trlb('commons_month')}
              menuItems={[
                { value: '', label: '-' },
                ...filterMonths.map((month: any) => ({
                  value: String(month),
                  label: format(new Date(2021, month), 'MMMM'),
                })),
              ]}
              onChange={e => setFilterMonth(e.target.value ? Number(e.target.value) : '')}
              value={String(filterMonth)}
            />
          </Box>
          <Box sx={{ width: '33%' }}>
            <DatePicker
              inputFormat={trlb('dateTime_date_string')}
              label={trlb('commons_date')}
              value={filterDate}
              onChange={date => {
                setFilterDate(validateInsertedDate(date))
              }}
              renderInput={params => <TextField {...params} />}
              minDate={firstSlotDate}
              maxDate={lastSlotDate}
            />
          </Box>
        </Box>
        {filterYear || filterMonth || filterDate
          ? (
            <IconButton
              onClick={() => {
                setFilterYear('')
                setFilterMonth('')
                setFilterDate(null)
              }}
            >
              <Clear />
            </IconButton>
          )
          : null}
      </Box>
      {overLapError && <div style={{ color: 'red' }}>Overlapping slots are not allowed</div>}
      <Space20 />
      {!surgerySlots?.length
        ? (
          edit && (
            <>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <TextIconButton
                  icon={<AddIcon sx={{ marginRight: '10px' }} />}
                  onClick={() => {
                    setSingleSlotProp(true)
                    setShowAddTimeSlot(true)
                  }}
                  text={trlb('add_single_slot')}
                />
                <TextIconButton
                  icon={<AddIcon sx={{ marginRight: '10px' }} />}
                  onClick={() => {
                    setSingleSlotProp(false)
                    setShowAddTimeSlot(true)
                  }}
                  text={trlb('add_multiple_slots')}
                />
              </Grid>
              <Space20 />
            </>
          )
        )
        : (
          <>
            <Box sx={{ display: 'flex', width: '100%', paddingLeft: '16px' }}>
              <FlexDataTable
                columns={columns}
                onSelectionModelChange={(newSelectionModel: string[]) => {
                  setSelectionModel(newSelectionModel)
                }}
                rows={rows}
                checkboxSelection={edit}
                rowHeight={edit ? 70 : null}
                showToolbar={edit}
                toolbar={SurgerySlotsToolbar}
                initialState={{
                  pagination: {
                    pageSize: defaultPaginationLimit,
                  },
                }}
                componentsProps={{
                  toolbar: {
                    selectionModel,
                    handleRemoveSelectedSlots,
                    setShowAddTimeSlot,
                    setSingleSlotProp,
                    setShowRemoveTimeSlot,
                  },
                }}
                disableSelectionOnClick
                autoHeight
              />
            </Box>
          </>
        )}
      {showAddTimeSlot && singleSlotProp && (
        <AddSingleTimeSlot
          {...{
            showAddTimeSlot,
            setShowAddTimeSlot,
            form,
            currentSlots: surgerySlots,
            setSurgerySlots: (slots: any) => form.setFieldValue('details.surgerySlots', slots),
          }}
        />
      )}
      {showAddTimeSlot && !singleSlotProp && (
        <AddMultipleTimeSlots
          {...{
            showAddTimeSlot,
            setShowAddTimeSlot,
            form,
            currentSlots: surgerySlots,
            setSurgerySlots: (slots: any) => form.setFieldValue('details.surgerySlots', slots),
          }}
        />
      )}
      {showRemoveTimeSlot && (
        <RemoveMultipleTimeSlots
          {...{
            form,
            showRemoveTimeSlot,
            setShowRemoveTimeSlot,
            currentSlots: form?.values?.details?.surgerySlots ?? [],
            onSave: (slots: any) => form.setFieldValue('details.surgerySlots', slots),
          }}
        />
      )}
    </>
  )
}
