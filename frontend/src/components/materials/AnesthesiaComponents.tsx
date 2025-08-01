import { CaseForm, permissionRequests } from '@smambu/lib.constants'
import { Box, Checkbox, FormControlLabel, Grid } from '@mui/material'
import { FormikProps } from 'formik'
import React from 'react'
import { getFieldValue, trlb } from 'utilities'
import SectionWrapper from './SectionWrapper'
import TimestampSelector from 'pages/CaseDetails/components/TimestampSelector'
import { TextIconButton } from 'components/Buttons'
import { Add } from '@mui/icons-material'
import { useGetCheckPermission } from 'hooks/userPermission'
import { SectionSubtitle } from 'components/Commons'

export const AnesthesiaMultiSelect = ({
  edit,
  form,
  selectableValues,
  formPath = '',
  title,
}: {
  edit: boolean
  form: FormikProps<CaseForm>
  selectableValues: any[] | undefined
  formPath?: string
  title: string
}) => {
  const selectedValues = getFieldValue(form, formPath) ?? []

  const onChange = (name: string, checked: boolean) => {
    const currMeasures = [...selectedValues]
    if (checked) form.setFieldValue(formPath, [...currMeasures, name])
    else
      form.setFieldValue(
        formPath,
        currMeasures.filter(f => f !== name),
      )
  }

  const safeSelectableValues = selectableValues ?? []

  safeSelectableValues.sort((a, b) => trlb(a).localeCompare(trlb(b)))

  return (
    <SectionWrapper title={title}>
      <Box sx={{ display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        {safeSelectableValues
          .map(service => (
            <FormControlLabel
              key={service}
              control={
                <Checkbox
                  sx={{ fill: '#fff' }}
                  checked={selectedValues?.includes(service)}
                  onChange={e => onChange(service, e.target.checked)}
                  disabled={!edit}
                />
              }
              label={trlb(service)}
              sx={{ marginTop: '5px' }}
            />
          ))}
      </Box>
    </SectionWrapper>
  )
}

const VolatileTimestampsSection = ({
  values,
  onChange,
  canSet,
  canEdit,
  startTimestampLabel,
  startTimeStampSetLabel,
  endTimestampLabel,
  endTimeStampSetLabel,
  edit,
}: {
  canSet: boolean
  canEdit: boolean
  startTimestampLabel: string
  startTimeStampSetLabel: string
  endTimestampLabel: string
  endTimeStampSetLabel: string
  values: {
    start: Date | null
    end: Date | null
  }[]
  edit: boolean
  onChange: (values: { start: Date | null; end: Date | null }[]) => void
}) => {
  return (
    <>
      {values?.map((_value, index) => (
        <>
          <TimestampSelector
            key={index + '/' + startTimestampLabel}
            value={values[index]?.start}
            canSetTimestamp={canSet}
            canEditTimestamp={canEdit}
            edit={edit}
            onChange={newValue => {
              const newValues = JSON.parse(JSON.stringify(values))
              newValues[index].start = newValue
              onChange(newValues)
            }}
            timestampLabel={startTimestampLabel}
            timeStampSetLabel={startTimeStampSetLabel}
            xs={6}
          />
          <TimestampSelector
            key={index + '/' + endTimestampLabel}
            value={values[index]?.end}
            canSetTimestamp={canSet}
            canEditTimestamp={canEdit}
            edit={edit}
            onChange={newValue => {
              const newValues = JSON.parse(JSON.stringify(values))
              newValues[index].end = newValue
              onChange(newValues)
            }}
            timestampLabel={endTimestampLabel}
            timeStampSetLabel={endTimeStampSetLabel}
            xs={6}
          />
        </>
      ))}
      {values?.slice()?.reverse()?.[0]?.start !== null &&
        values?.slice()?.reverse()?.[0]?.end !== null && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <TextIconButton
            onClick={() => onChange([...(values ?? []), { start: null, end: null }])}
            text={trlb('case_tab_anesthesia_addTimestamp')}
            icon={<Add sx={{ marginRight: '10px' }} />}
            disabled={!(canSet && edit)}
          />
        </Box>
      )}
    </>
  )
}
export const VolatileAnestheticsContainer = ({ form, edit }:
{ form: FormikProps<CaseForm>; edit: boolean }) => {
  const checkPermission = useGetCheckPermission()
  const canViewAnesthesiaTimestamps =
    checkPermission(permissionRequests.canViewAnesthesiaTimestamps)
  const canEditAnesthesiaTimestamps =
    checkPermission(permissionRequests.canEditAnesthesiaTimestamps)
  const canSetAnesthesiaTimestamps =
    checkPermission(permissionRequests.canSetAnesthesiaTimestamps)

  if (!canViewAnesthesiaTimestamps) return null

  return (
    <SectionWrapper title={'case_tab_anesthesia_volatile_anesthetics'}>
      <Grid container>
        <SectionSubtitle text={trlb('case_tab_anesthesia_oxygen_timestamps')} />
        <VolatileTimestampsSection
          canSet={canSetAnesthesiaTimestamps}
          canEdit={canEditAnesthesiaTimestamps}
          edit={edit}
          startTimestampLabel={trlb('case_tab_anesthesia_oxygen_started_timestamp')}
          startTimeStampSetLabel={trlb('case_tab_anesthesia_oxygen_set_started_timestamp')}
          endTimestampLabel={trlb('case_tab_anesthesia_oxygen_finished_timestamp')}
          endTimeStampSetLabel={trlb('case_tab_anesthesia_oxygen_set_finished_timestamp')}
          values={form.values?.anesthesiaSection?.volatileAnestheticsTimestamps?.oxygen}
          onChange={newValue => form.setFieldValue('anesthesiaSection.volatileAnestheticsTimestamps.oxygen', newValue)}
        />
        <SectionSubtitle text={trlb('case_tab_anesthesia_N20_timestamps')} />
        <VolatileTimestampsSection
          canSet={canSetAnesthesiaTimestamps}
          canEdit={canEditAnesthesiaTimestamps}
          edit={edit}
          startTimestampLabel={trlb('case_tab_anesthesia_N20_started_timestamp')}
          startTimeStampSetLabel={trlb('case_tab_anesthesia_N20_set_started_timestamp')}
          endTimestampLabel={trlb('case_tab_anesthesia_N20_finished_timestamp')}
          endTimeStampSetLabel={trlb('case_tab_anesthesia_N20_set_finished_timestamp')}
          values={form.values?.anesthesiaSection?.volatileAnestheticsTimestamps?.n20}
          onChange={newValue => form.setFieldValue('anesthesiaSection.volatileAnestheticsTimestamps.n20', newValue)}
        />
        <SectionSubtitle text={trlb('case_tab_anesthesia_desflurane_timestamps')} />
        <VolatileTimestampsSection
          canSet={canSetAnesthesiaTimestamps}
          canEdit={canEditAnesthesiaTimestamps}
          edit={edit}
          startTimestampLabel={trlb('case_tab_anesthesia_desflurane_started_timestamp')}
          startTimeStampSetLabel={trlb('case_tab_anesthesia_desflurane_set_started_timestamp')}
          endTimestampLabel={trlb('case_tab_anesthesia_desflurane_finished_timestamp')}
          endTimeStampSetLabel={trlb('case_tab_anesthesia_desflurane_set_finished_timestamp')}
          values={form.values?.anesthesiaSection?.volatileAnestheticsTimestamps?.desflurane}
          onChange={newValue =>
            form.setFieldValue('anesthesiaSection.volatileAnestheticsTimestamps.desflurane', newValue)
          }
        />
        <SectionSubtitle text={trlb('case_tab_anesthesia_sevoflurane_timestamps')} />
        <VolatileTimestampsSection
          canSet={canSetAnesthesiaTimestamps}
          canEdit={canEditAnesthesiaTimestamps}
          edit={edit}
          startTimestampLabel={trlb('case_tab_anesthesia_sevoflurane_started_timestamp')}
          startTimeStampSetLabel={trlb('case_tab_anesthesia_sevoflurane_set_started_timestamp')}
          endTimestampLabel={trlb('case_tab_anesthesia_sevoflurane_finished_timestamp')}
          endTimeStampSetLabel={trlb('case_tab_anesthesia_sevoflurane_set_finished_timestamp')}
          values={form.values?.anesthesiaSection?.volatileAnestheticsTimestamps?.sevoflurane}
          onChange={newValue =>
            form.setFieldValue('anesthesiaSection.volatileAnestheticsTimestamps.sevoflurane', newValue)
          }
        />
      </Grid>
    </SectionWrapper>
  )
}
