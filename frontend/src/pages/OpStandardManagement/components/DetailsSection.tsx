import { OpStandard, OpStandardTabsProps } from '@smambu/lib.constants'
import { Checkbox, FormControlLabel, Grid, SelectChangeEvent, Typography } from '@mui/material'
import { GridSelect, GridTextField, SectionSubtitle, Space20 } from 'components/Commons'
import { useGetNotLinkedOpStandards, useGetOpStandardById } from 'hooks/contractHooks'
import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'store'
import { getFieldError, getFieldTouched, trlb } from 'utilities'

const DetailsSection = ({ isNew, edit, form, doctorId, contractId }: OpStandardTabsProps) => {
  const subjectAreas = useAppSelector(state => state.configs.subjectAreas ?? [])
    .map((el: string) => ({
      value: el,
      label: el,
    }))
  const operatingRooms = useAppSelector(state => state.operatingRooms)
  const [notLinkedOpStandards, setNotLinkedOpStandards] = useState<OpStandard[]>([])
  const [linkedOpStandard, setLinkedOpStandard] = useState<OpStandard | null>(null)
  const getNotLinkedOpStandards = useGetNotLinkedOpStandards()
  const getOpStandardById = useGetOpStandardById()

  const orsList = useMemo(() => {
    if (!operatingRooms) return []
    return Object.values(operatingRooms)
      .map((room: any) => ({
        value: room.operatingRoomId,
        label: room.name
      }))
  }, [operatingRooms])

  const opStandardOptions = isNew
    ? [
      ...notLinkedOpStandards.map(op => ({ label: op.name, value: op.opStandardId })),
      { label: trlb('contract_absent'), value: null },
    ]
    : [
      ...(linkedOpStandard ? [linkedOpStandard] : ([] as OpStandard[])).map(op => ({
        label: op.name,
        value: op.opStandardId,
      })),
      { label: trlb('contract_absent'), value: null },
    ]

  useEffect(() => {
    if (isNew)
      getNotLinkedOpStandards({ contractId, doctorId }).then(res => {
        if (res)
          setNotLinkedOpStandards(
            res.map((each: { id: string } & Omit<OpStandard, 'opStandardId'>) => {
              const { id, ...rest } = each
              return {
                ...rest,
                opStandardId: id,
              }
            }),
          )
        else setNotLinkedOpStandards([])
      })
    else if (form.values.previousContractOpStandardId &&
      form.values.previousContractOpStandardId !== null)
      getOpStandardById(form.values.previousContractOpStandardId).then(res => {
        if (res) setLinkedOpStandard(res)
      })
  }, [isNew, doctorId, contractId, form.values.previousContractOpStandardId])

  const handleSelectOperatingRoomIds = (orId: string) => {
    form.setFieldTouched('operatingRoomIds', true)
    const operatingRoomIds = form.values.operatingRoomIds
    const newOperatingRoomIds = operatingRoomIds.includes(orId)
      ? operatingRoomIds.filter((id: string) => id !== orId)
      : [...operatingRoomIds, orId]
    form.setFieldValue('operatingRoomIds', newOperatingRoomIds)
  }

  const handleSelectPreviousOpStandard = (e: SelectChangeEvent<unknown>) => {
    form.setFieldValue('previousContractOpStandardId', e.target.value as string)
  }

  let helperText

  if (!!getFieldTouched(form, 'previousContractOpStandardId') &&
    getFieldError(form, 'previousContractOpStandardId'))
    helperText = getFieldError(form, 'previousContractOpStandardId')
  else
    helperText = isNew
      ? trlb('op_standard_op_standard_to_replace_warning')
      : ''

  return (
    <Grid container spacing={2}>
      <GridTextField
        xs={6}
        label={trlb('op_standard_name')}
        {...form.getFieldProps('name')}
        error={!!getFieldTouched(form, 'name') && !!getFieldError(form, 'name')}
        helperText={!!getFieldTouched(form, 'name') && getFieldError(form, 'name')}
        inputProps={{ readOnly: !edit }}
        onBlur={form.handleBlur}
      />
      <GridSelect
        displayEmpty
        xs={6}
        name={'previousContractOpStandardId'}
        label={form.values.previousContractOpStandardId !== null ? trlb('link_to_previous_op') : ''}
        menuItems={opStandardOptions}
        value={form.values.previousContractOpStandardId}
        onChange={handleSelectPreviousOpStandard}
        onBlur={form.handleBlur}
        onClose={() => {
          setTimeout(() => {
            document.activeElement.blur()
          }, 0)
        }}
        background={'#fff'}
        error={
          !!getFieldTouched(form, 'previousContractOpStandardId') &&
          !!getFieldError(form, 'previousContractOpStandardId')
        }
        helperText={helperText}
        inputProps={{ readOnly: !edit }}
        disabled={!isNew}
      />
      <GridSelect
        xs={6}
        name={'subjectArea'}
        label={trlb('subject_area')}
        menuItems={[{ value: '', label: trlb('opStandard_deselectSubjectArea') }, ...subjectAreas]}
        {...form.getFieldProps('subjectArea')}
        value={form.values.subjectArea}
        error={!!getFieldTouched(form, 'subjectArea') && !!getFieldError(form, 'subjectArea')}
        helperText={!!getFieldTouched(form, 'subjectArea') && getFieldError(form, 'subjectArea')}
        background={'#fff'}
        inputProps={{ readOnly: !edit }}
        onClose={() => {
          setTimeout(() => {
            document.activeElement.blur()
          }, 0)
        }}
        onBlur={form.handleBlur}
      />
      <GridTextField
        xs={6}
        label={trlb('surgery_duration')}
        {...form.getFieldProps('surgeryDurationInMinutes')}
        error={!!getFieldTouched(form, 'surgeryDurationInMinutes') && !!getFieldError(form, 'surgeryDurationInMinutes')}
        helperText={
          !!getFieldTouched(form, 'surgeryDurationInMinutes') && getFieldError(form, 'surgeryDurationInMinutes')
        }
        inputProps={{ readOnly: !edit, min: 0 }}
        onBlur={form.handleBlur}
        type='number'
      />
      <SectionSubtitle text={trlb('select_op_room')} />
      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        {orsList.map((or, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={form.values.operatingRoomIds.includes(or.value)}
                onChange={() => edit && handleSelectOperatingRoomIds(or.value)}
              />
            }
            label={or.label}
          />
        ))}
      </Grid>
      {!!form.touched.operatingRoomIds && form.errors.operatingRoomIds
        ? (
          <Typography variant='caption' color='error' sx={{ width: '100%', textAlign: 'center' }}>
            {trlb(form.errors.operatingRoomIds)}
          </Typography>
        )
        : null}
      <Space20 />
    </Grid>
  )
}

export default DetailsSection
