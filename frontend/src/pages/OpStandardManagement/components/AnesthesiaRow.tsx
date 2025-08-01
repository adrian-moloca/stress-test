import {
  AnesthesiaSide,
  AnesthesiaType,
  AnesthesiaRegion,
  AnesthesiaUpperSubRegion,
  AnesthesiaLowerSubRegion,
  CentralRegionAnesthesia,
  OpStandardAnesthesiaRow,
  CaseForm,
} from '@smambu/lib.constants'
import { Delete } from '@mui/icons-material'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  SelectChangeEvent,
  Typography,
} from '@mui/material'
import { GridSelect } from 'components/Commons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'

const anesthesiaTypes = Object.keys(AnesthesiaType)
const sides = Object.keys(AnesthesiaSide)

const OPStandardSelected = trlb('opstandard_selected')
const getLabel = (isAuto: boolean, labelKey: string) => {
  const autoLabel = isAuto ? `${OPStandardSelected} ` : ''
  const label = `${autoLabel}${trlb(labelKey)}`

  return label
}

const anesthesiaTypeOptions = (suggested: OpStandardAnesthesiaRow[]) =>
  anesthesiaTypes.map(value => {
    const isAuto = suggested.some(current => current.anesthesiaType === value)
    const label = getLabel(isAuto, value)

    return {
      label,
      value,
    }
  })

const anesthesiaRegions = Object.keys(AnesthesiaRegion)
const anesthesiaUpperSubRegions = Object.keys(AnesthesiaUpperSubRegion)
const anesthesiaLowerSubRegions = Object.keys(AnesthesiaLowerSubRegion)
const centralRegionAnesthesia = Object.keys(CentralRegionAnesthesia)

const anesthesiaRegionOptions = (suggested: OpStandardAnesthesiaRow[]) =>
  anesthesiaRegions.map(value => {
    const isAuto = suggested.some(current => current.anesthesiaBodyRegion === value)
    const label = getLabel(isAuto, value)

    return {
      label,
      value,
    }
  })

const anesthesiaUpperSubRegionOptions = (suggested: OpStandardAnesthesiaRow[]) =>
  anesthesiaUpperSubRegions.map(value => {
    const isAuto = suggested.some(current => current.anesthesiaBodySubRegion === value)
    const label = getLabel(isAuto, value)

    return {
      label,
      value,
    }
  })

const anesthesiaLowerSubRegionOptions = (suggested: OpStandardAnesthesiaRow[]) =>
  anesthesiaLowerSubRegions.map(value => {
    const isAuto = suggested.some(current => current.anesthesiaBodySubRegion === value)
    const label = getLabel(isAuto, value)

    return {
      label,
      value,
    }
  })

const centralRegionAnesthesiaOptions = (suggested: OpStandardAnesthesiaRow[]) =>
  centralRegionAnesthesia.map(value => {
    const isAuto = suggested.some(current => current.anesthesiaBodyRegion === value)
    const label = getLabel(isAuto, value)

    return {
      label,
      value,
    }
  })

const getAnesthesiaObject = (suggested: OpStandardAnesthesiaRow[]): { [key: string]: any } => ({
  GENERAL_ANESTHESIA: null,
  ANALGOSEDATION: null,
  PERIPHERAL_REGION_ANESTHESIA: anesthesiaRegionOptions(suggested),
  CENTRAL_REGION_ANESTHESIA: centralRegionAnesthesiaOptions(suggested),
  STAND_BY: null,
  UPPER_EXTREMITY: anesthesiaUpperSubRegionOptions(suggested),
  LOWER_EXTREMITY: anesthesiaLowerSubRegionOptions(suggested),
})

const AnesthesiaRow = ({
  form,
  index,
  edit,
  deleteAnesthesiaRow,
  anesthesiaRow,
  errors,
  section,
  suggestedAnesthesiae = [],
  showSide = true,
}: {
  form: FormikProps<CaseForm>
  index: number
  edit: boolean
  deleteAnesthesiaRow: (index: number) => void
  anesthesiaRow: OpStandardAnesthesiaRow
  errors: any
  section?: string
  suggestedAnesthesiae?: OpStandardAnesthesiaRow[]
  showSide: boolean
}) => {
  const formSection = section || 'bookingSection.'
  const handleSelectAnesthesiaType = (e: SelectChangeEvent<unknown>) => {
    const newAnesthesiaRow = {
      ...anesthesiaRow,
      anesthesiaType: e.target.value,
      anesthesiaBodyRegion: '',
      anesthesiaBodySubRegion: '',
      side: '',
    }

    form.setFieldValue(`${formSection}anesthesiaList.${index}`, newAnesthesiaRow)
  }

  const handleSelectBodyRegion = (e: SelectChangeEvent<unknown>) => {
    const newAnesthesiaRow = {
      ...anesthesiaRow,
      anesthesiaBodyRegion: e.target.value,
      anesthesiaBodySubRegion: '',
      side: '',
    }

    form.setFieldValue(`${formSection}anesthesiaList.${index}`, newAnesthesiaRow)
  }

  const handleSelectBodySubRegion = (e: SelectChangeEvent<unknown>) => {
    const newAnesthesiaRow = {
      ...anesthesiaRow,
      anesthesiaBodySubRegion: e.target.value,
      side: '',
    }

    form.setFieldValue(`${formSection}anesthesiaList.${index}`, newAnesthesiaRow)
  }

  const handleChangeSide = (value: string) => {
    const newAnesthesiaRow = {
      ...anesthesiaRow,
      side: value,
    }

    form.setFieldValue(`${formSection}anesthesiaList.${index}`, newAnesthesiaRow)
  }

  const anesthesiaObject = getAnesthesiaObject(suggestedAnesthesiae)

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography>{trlb('anesthesia_row_title', { index: String(index + 1) })}</Typography>
        {edit && (
          <IconButton size='small' onClick={() => deleteAnesthesiaRow(index)}>
            <Delete />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }} />
      </Box>
      <Grid container spacing={2} mt={0}>
        <GridSelect
          xs={6}
          name={trlb('anesthesia_type')}
          label={trlb('anesthesia_type')}
          menuItems={anesthesiaTypeOptions(suggestedAnesthesiae)}
          value={anesthesiaRow.anesthesiaType}
          onChange={handleSelectAnesthesiaType}
          error={Boolean(errors?.anesthesiaType)}
          helperText={errors?.anesthesiaType ?? ''}
          inputProps={{ readOnly: !edit }}
        />
        {!!anesthesiaRow.anesthesiaType && anesthesiaObject[anesthesiaRow.anesthesiaType]
          ? (
            <GridSelect
              xs={6}
              name={trlb('anesthesia_region')}
              label={trlb('anesthesia_region')}
              menuItems={anesthesiaObject[anesthesiaRow.anesthesiaType]}
              value={anesthesiaRow.anesthesiaBodyRegion}
              onChange={handleSelectBodyRegion}
              inputProps={{ readOnly: !edit }}
              error={Boolean(errors?.anesthesiaBodyRegion)}
              helperText={errors?.anesthesiaBodyRegion ?? ''}
            />
          )
          : (
            <Grid xs={6} item />
          )}
        {!!anesthesiaRow.anesthesiaBodyRegion &&
         anesthesiaObject[anesthesiaRow.anesthesiaBodyRegion]
          ? (
            <GridSelect
              xs={6}
              name={trlb('anesthesia_subregion')}
              label={trlb('anesthesia_subregion')}
              menuItems={anesthesiaObject[anesthesiaRow.anesthesiaBodyRegion]}
              value={anesthesiaRow.anesthesiaBodySubRegion}
              onChange={handleSelectBodySubRegion}
              inputProps={{ readOnly: !edit }}
              error={Boolean(errors?.anesthesiaBodySubRegion)}
              helperText={errors?.anesthesiaBodySubRegion ?? ''}
            />
          )
          : (
            <Grid xs={6} item />
          )}
        {anesthesiaRow.anesthesiaBodySubRegion && showSide
          ? (
            <Grid item xs={6}>
              <FormControl>
                <FormLabel id='side'>{trlb('anesthesia_side')}</FormLabel>
                <RadioGroup
                  aria-labelledby='side'
                  name='side'
                  value={anesthesiaRow.side}
                  onChange={(_e, value) => handleChangeSide(value)}
                  row
                >
                  {sides.map(value => (
                    <FormControlLabel key={value}
                      value={value}
                      control={<Radio />}
                      label={trlb(value)} />
                  ))}
                </RadioGroup>
                {!anesthesiaRow.side && <FormHelperText error={true}>{trlb('opstandard_side_error')}</FormHelperText>}
              </FormControl>
            </Grid>
          )
          : null}
      </Grid>
    </Box>
  )
}

export default AnesthesiaRow
