import React, { useMemo } from 'react'
import { Typography, Grid, FormGroup, FormControl, FormHelperText } from '@mui/material'
import { DefaultButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { Space20, AddPositionField, FormikGridSelect, FormikGridCheckbox, Panel } from 'components/Commons'
import {
  BookingDetailTabsEnum,
  CaseForm,
  OpStandard,
  OpStandardPosition_Name,
  OpStandardSide_Name,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { FormikProps } from 'formik'
import PreferredAnesthesia from './PreferredAnesthesia'

type tSurgeryInformationFieldsProps = {
  readOnly: boolean
  form: FormikProps<CaseForm>
  opStandard: OpStandard
}

const SurgeryInformationFields = ({
  readOnly,
  form,
  opStandard
}: tSurgeryInformationFieldsProps) => {
  const section = BookingDetailTabsEnum.SURGERY_SECTION
  const values = form.values.surgerySection
  const errors = form.errors.surgerySection
  const touched = form.touched.surgerySection

  const possibilePositions = useMemo(
    () => (opStandard?.bookingSection?.positions?.length > 0
      ? opStandard.bookingSection.positions
      : []),
    [opStandard],
  )
  const { possiblePositions, sideRequired } = React.useMemo(() => {
    return {
      sideRequired: opStandard?.bookingSection?.sideRequired,
      possiblePositions: opStandard?.bookingSection.positions.length > 0
        ? opStandard?.bookingSection.positions
        : [],
    }
  }, [opStandard])
  const [positions, setPositions] = React.useState<(OpStandardPosition_Name | null)[]>(
    form.values?.surgerySection?.positions.length
      ? form.values?.surgerySection?.positions.filter(p => possibilePositions?.includes(p))
      : [null],
  )
  React.useEffect(() => {
    let newPositions = positions.filter(p => possiblePositions.includes(p!))
    if (newPositions.length > 0) setPositions(newPositions)
    form.setFieldValue(section + '.positions', newPositions)
  }, [possiblePositions, opStandard])

  return (
    <>
      <Space20 />
      {sideRequired && (
        <>
          <Panel>
            <Grid container spacing={2}>
              <FormikGridSelect
                xs={6}
                label={trlb('booking_tab_surgery_SideInformation')}
                menuItems={Object.values(OpStandardSide_Name).map(el => ({
                  value: el,
                  label: el,
                }))}
                {...{
                  disabled: readOnly,
                  form,
                  section,
                  errors,
                  values,
                  touched,
                  name: 'side',
                }}
              />
            </Grid>
          </Panel>
          <Space20 />
        </>
      )}
      <Grid container spacing={2}>
        <PreferredAnesthesia {...{ readOnly, form, opStandard }} />
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingRight: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_positionOrder')}
            </Typography>
            <Space20 />
            {positions.map((position, index) => {
              return (
                <AddPositionField
                  disabledDeleteButton={positions.length === 1 || readOnly}
                  label={'Position' + ' ' + (index + 1)}
                  key={index}
                  menuItems={possiblePositions.map(el => ({
                    value: el,
                    label: el,
                  }))}
                  {...{
                    disabled: readOnly,
                    form,
                    section,
                    errors,
                    values,
                    touched,
                    name: 'positions',
                    value: position,
                    onChange: e => {
                      let newPositions = [...positions]
                      newPositions[index] = e.target.value as OpStandardPosition_Name
                      setPositions(newPositions)
                      form.setFieldValue(section + '.positions', newPositions)
                    },
                    onDelete: () => {
                      let newPositions = [...positions]
                      newPositions.splice(index, 1)
                      setPositions(newPositions)
                      form.setFieldValue(section + '.positions', newPositions)
                    },
                  }}
                />
              )
            })}
            {positions.every(x => x) && (
              <>
                <Space20 />
                <DefaultButton
                  onClick={() => {
                    const newPositions = [...positions]
                    newPositions[positions.length] = possiblePositions[0]
                    setPositions(newPositions)
                    form.setFieldValue(section + '.positions', newPositions)
                  }}
                  disabled={readOnly}
                  text={trlb('booking_surgery_tab_addPosition')}
                  icon={<AddIcon sx={{ marginRight: '10px' }} />}
                />
              </>
            )}
          </Panel>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingLeft: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_bodyRegions')}
            </Typography>
            <Space20 />
            <div style={{ width: '100%', margin: '10px' }}>
              {opStandard?.bookingSection?.bodyRegions?.length > 0
                ? (
                  <FormControl error={Boolean(errors?.surgeryBodyLocations)}>
                    <FormGroup>
                      {opStandard?.bookingSection?.bodyRegions?.map((region, index) => (
                        <FormikGridCheckbox
                          key={index}
                          label={trlb(region)}
                          {...{
                            disabled: readOnly,
                            form,
                            section,
                            errors,
                            values,
                            touched,
                            name: 'bodyRegions',
                            value: values.surgeryBodyLocations.includes(region),
                            onChange: () => {
                              if (values.surgeryBodyLocations.includes(region))
                                form.setFieldValue(
                                  section + '.surgeryBodyLocations',
                                  values.surgeryBodyLocations
                                    .filter(bodyRegion => bodyRegion !== region),
                                )
                              else
                                form.setFieldValue(section + '.surgeryBodyLocations', [
                                  ...values.surgeryBodyLocations,
                                  region,
                                ])
                            },
                          }}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{errors?.surgeryBodyLocations}</FormHelperText>
                  </FormControl>
                )
                : null}
            </div>
          </Panel>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingRight: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_fingers')}
            </Typography>
            <Space20 />
            <div style={{ width: '100%', margin: '10px' }}>
              {opStandard?.bookingSection?.fingers?.length > 0
                ? (
                  <FormControl error={Boolean(errors?.surgeryBodyLocations)}>
                    <FormGroup>
                      {opStandard?.bookingSection?.fingers?.map((finger, index) => (
                        <FormikGridCheckbox
                          key={index}
                          label={trlb(finger)}
                          {...{
                            disabled: readOnly,
                            form,
                            section,
                            errors,
                            values,
                            touched,
                            name: 'bodyRegions',
                            value: values.surgeryBodyLocations.includes(finger),
                            onChange: _e => {
                              if (values.surgeryBodyLocations.includes(finger))
                                form.setFieldValue(
                                  section + '.surgeryBodyLocations',
                                  values.surgeryBodyLocations.filter(f => f !== finger),
                                )
                              else
                                form.setFieldValue(section + '.surgeryBodyLocations', [
                                  ...values.surgeryBodyLocations,
                                  finger,
                                ])
                            },
                          }}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{errors?.surgeryBodyLocations}</FormHelperText>
                  </FormControl>
                )
                : null}
            </div>
          </Panel>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingLeft: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_toes')}
            </Typography>
            <Space20 />
            <div style={{ width: '100%', margin: '10px' }}>
              {opStandard?.bookingSection?.feet?.length > 0
                ? (
                  <FormControl error={Boolean(errors?.surgeryBodyLocations)}>
                    <FormGroup>
                      {opStandard?.bookingSection?.feet?.map((toe, index) => (
                        <FormikGridCheckbox
                          key={index}
                          label={trlb(toe)}
                          {...{
                            disabled: readOnly,
                            form,
                            section,
                            errors,
                            values,
                            touched,
                            name: 'surgeryBodyLocations',
                            value: values.surgeryBodyLocations.includes(toe),
                            onChange: _e => {
                              if (values.surgeryBodyLocations.includes(toe))
                                form.setFieldValue(
                                  section + '.surgeryBodyLocations',
                                  values.surgeryBodyLocations.filter(t => t !== toe),
                                )
                              else
                                form.setFieldValue(section + '.surgeryBodyLocations', [
                                  ...values.surgeryBodyLocations,
                                  toe,
                                ])
                            },
                          }}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{errors?.surgeryBodyLocations}</FormHelperText>
                  </FormControl>
                )
                : null}
            </div>
          </Panel>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingRight: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_spinal_segment')}
            </Typography>
            <Space20 />
            <div style={{ width: '100%', margin: '10px' }}>
              {opStandard?.bookingSection?.spinalSegments?.length > 0
                ? (
                  <FormControl error={Boolean(errors?.surgeryBodyLocations)}>
                    <FormGroup>
                      {opStandard?.bookingSection.spinalSegments.map((ss, index) => (
                        <FormikGridCheckbox
                          key={index}
                          label={trlb(ss)}
                          {...{
                            disabled: readOnly,
                            form,
                            section,
                            errors,
                            values,
                            touched,
                            name: 'surgeryBodyLocations',
                            value: values.surgeryBodyLocations.includes(ss),
                            onChange: _e => {
                              if (values.surgeryBodyLocations.includes(ss))
                                form.setFieldValue(
                                  section + '.surgeryBodyLocations',
                                  values.surgeryBodyLocations.filter(t => t !== ss),
                                )
                              else
                                form.setFieldValue(section + '.surgeryBodyLocations', [
                                  ...values.surgeryBodyLocations,
                                  ss,
                                ])
                            },
                          }}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{errors?.surgeryBodyLocations}</FormHelperText>
                  </FormControl>
                )
                : null}
            </div>
          </Panel>
        </Grid>
        <Grid
          item
          xs={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingLeft: '16px',
          }}
        >
          <Panel>
            <Typography variant='body1' sx={{ textAlign: 'center' }}>
              {trlb('booking_tab_surgery_teeth')}
            </Typography>
            <Space20 />
            <div style={{ width: '100%', margin: '10px' }}>
              {opStandard?.bookingSection?.teeth?.length > 0
                ? (
                  <FormControl error={Boolean(errors?.surgeryBodyLocations)}>
                    <FormGroup>
                      {opStandard?.bookingSection.teeth.map((tooth, index) => (
                        <FormikGridCheckbox
                          key={index}
                          label={trlb(String(tooth))}
                          {...{
                            disabled: readOnly,
                            form,
                            section,
                            errors,
                            values,
                            touched,
                            name: 'surgeryBodyLocations',
                            value: values.surgeryBodyLocations.includes(tooth),
                            onChange: _e => {
                              if (values.surgeryBodyLocations.includes(tooth))
                                form.setFieldValue(
                                  section + '.surgeryBodyLocations',
                                  values.surgeryBodyLocations.filter(t => t !== tooth),
                                )
                              else
                                form.setFieldValue(section + '.surgeryBodyLocations', [
                                  ...values.surgeryBodyLocations,
                                  tooth,
                                ])
                            },
                          }}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{errors?.surgeryBodyLocations}</FormHelperText>
                  </FormControl>
                )
                : null}
            </div>
          </Panel>
        </Grid>
      </Grid>
    </>
  )
}

export default SurgeryInformationFields
