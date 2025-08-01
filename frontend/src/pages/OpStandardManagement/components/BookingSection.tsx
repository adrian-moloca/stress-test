import {
  OpStandardAnesthesiaRow,
  OpStandardBodyRegion_Name,
  OpStandardFeet_Name,
  OpStandardFinger_Name,
  OpStandardPosition_Name,
  OpStandardSide_Name,
  OpStandardSpinalSegment_Name,
  OpStandardTabsProps,
  OpStandardTeeth,
} from '@smambu/lib.constants'
import AddIcon from '@mui/icons-material/Add'
import { Box, Checkbox, FormControlLabel, Grid, Typography } from '@mui/material'
import { DefaultButton, TextIconButton } from 'components/Buttons'
import {
  AddPositionField,
  GridSelect,
  GridTextField,
  Panel,
  SectionSubtitle,
  SectionTitle,
  Space10,
  Space20,
} from 'components/Commons'
import React, { ChangeEvent } from 'react'
import { routes } from 'routes/routes'
import { getFieldValue, trlb } from 'utilities'
import AnesthesiaRow from './AnesthesiaRow'
import { getEmptyAnesthesiaRow } from '../data/initalValues'
import { Add } from '@mui/icons-material'

const BookingSection = ({ edit, form }: OpStandardTabsProps) => {
  const pathName = location.pathname
  const bodyRegion = Object.keys(OpStandardBodyRegion_Name)
  const fingers = Object.keys(OpStandardFinger_Name)
  const toes = Object.keys(OpStandardFeet_Name)
  const spinalSegments = Object.keys(OpStandardSpinalSegment_Name)
  const positioning = Object.keys(OpStandardPosition_Name)
  const bodyRegionValues = form.values.bookingSection.bodyRegions

  const handleSelectFinger = (e: ChangeEvent<HTMLInputElement>, val: string) => {
    const anesthesiaFingers = form.values.bookingSection.fingers
    if (e.target.checked) form.setFieldValue('bookingSection.fingers', [...anesthesiaFingers, val])
    else
      form.setFieldValue(
        'bookingSection.fingers',
        anesthesiaFingers.filter((_: string) => _ !== val),
      )
  }

  const handleSelectTeeth = (e: ChangeEvent<HTMLInputElement>, val: number) => {
    const anesthesiaTeeth = form.values.bookingSection.teeth
    if (e.target.checked) form.setFieldValue('bookingSection.teeth', [...anesthesiaTeeth, val])
    else
      form.setFieldValue(
        'bookingSection.teeth',
        anesthesiaTeeth.filter((_: number) => _ !== val),
      )
  }

  const handleSelectSignal = (e: ChangeEvent<HTMLInputElement>, val: string) => {
    const spinalSegments = form.values.bookingSection.spinalSegments
    if (e.target.checked) form.setFieldValue('bookingSection.spinalSegments', [...spinalSegments, val])
    else
      form.setFieldValue(
        'bookingSection.spinalSegments',
        spinalSegments.filter((_: string) => _ !== val),
      )
  }

  const handleSelectFeet = (e: ChangeEvent<HTMLInputElement>, val: string) => {
    const anesthesiaFeet = form.values.bookingSection.feet
    if (e.target.checked) form.setFieldValue('bookingSection.feet', [...anesthesiaFeet, val])
    else
      form.setFieldValue(
        'bookingSection.feet',
        anesthesiaFeet.filter((_: string) => _ !== val),
      )
  }

  const handleSelectPosition = (val: string, index: number) => {
    const anesthesiaPositions = form.values.bookingSection.positions
    form.setFieldValue(
      'bookingSection.positions',
      anesthesiaPositions.map((position: string, _index: number) => {
        if (_index === index) return val
        return position
      }),
    )
  }

  const handleAddPosition = () => {
    const positions = form.values.bookingSection.positions
    form.setFieldValue('bookingSection.positions', [...positions, ''])
  }

  const handleRemovePosition = (index: number) => {
    const positions = form.values.bookingSection.positions
    form.setFieldValue(
      'bookingSection.positions',
      positions.filter((_: string, _index: number) => index !== _index),
    )
  }

  const showSpecificBodyRegionOption = (region: string, value: boolean) => {
    const bodyRegions = getFieldValue(form, 'bookingSection.bodyRegions')
    if (value) form.setFieldValue('bookingSection.bodyRegions', [...bodyRegions, region])
    else
      form.setFieldValue(
        'bookingSection.bodyRegions',
        bodyRegions.filter((_region: string) => _region !== region),
      )
  }

  const deleteAnesthesiaRow = (index: number) => {
    const anesthesiaList = form.values.bookingSection.anesthesiaList
    form.setFieldValue(
      'bookingSection.anesthesiaList',
      anesthesiaList.filter((_: any, _index: number) => _index !== index),
    )
  }

  const addAnesthesiaRow = () => {
    const anesthesiaList = form.values.bookingSection.anesthesiaList
    form.setFieldValue('bookingSection.anesthesiaList', [...anesthesiaList, { anesthesiaType: '' }])
  }

  // todo: once we have some real info, the checkboxs are going to be preselected and will not be editable
  return (
    <Grid container spacing={4}>
      <SectionTitle text={trlb('surgery_details')} />
      <Grid item xs={6}>
        <Panel>
          <SectionTitle text={trlb('anesthesia_type')} />
          <Space10 />
          {(form.values.bookingSection?.anesthesiaList || [getEmptyAnesthesiaRow()]).map(
            (anesthesiaRow: OpStandardAnesthesiaRow, index: number) => (
              <AnesthesiaRow
                key={index}
                form={form}
                edit={edit}
                index={index}
                anesthesiaRow={anesthesiaRow}
                deleteAnesthesiaRow={deleteAnesthesiaRow}
                errors={form.errors?.bookingSection?.anesthesiaList?.[index]}
                showSide={false}
              />
            ),
          )}
          {!edit && !form.values.anesthesiaSection?.anesthesiaList?.length && (
            <Typography sx={{ width: '100%', textAlign: 'center' }} variant='body1'>
              {trlb('anesthesia_noTypesSelected_warning')}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {edit && (
              <TextIconButton
                icon={<Add />}
                text={trlb('add_anesthesia')}
                variant='outlined'
                onClick={() => addAnesthesiaRow()}
              />
            )}
            {typeof form.errors.bookingSection?.anesthesiaList === 'string' && (
              <Typography sx={{ ml: 2 }} variant='caption' color='error'>
                {trlb(String(form.errors.bookingSection?.anesthesiaList))}
              </Typography>
            )}
          </Box>
        </Panel>
        <Space20 />
        <Panel>
          {pathName === routes.OPStandardDetails && (
            <GridTextField xs={12} label={trlb('booking_tab_surgery_SideInformation')} />
          )
          }

          { pathName === routes.anesthesiologistOPStandardList && (
            <GridSelect
              xs={12}
              name={trlb('booking_tab_surgery_SideInformation')}
              label={trlb('booking_tab_surgery_SideInformation')}
              menuItems={Object.keys(OpStandardSide_Name).map(el => ({
                value: el,
                label: trlb(el)
              }))}
              background={'#fff'}
            />
          )
          }
          <SectionSubtitle text={trlb('body_region')} />
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', paddingLeft: '0' }}>
            {bodyRegion.map((region, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={bodyRegionValues.includes(region)}
                    onChange={e => edit && showSpecificBodyRegionOption(region, e.target.checked)}
                  />
                }
                label={trlb(region)}
              />
            ))}
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', paddingLeft: '0' }}>
            <SectionSubtitle text={trlb('select_fingers')} />
            {fingers.map((finger, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={form.values.bookingSection.fingers.includes(finger)}
                    onChange={e => edit && handleSelectFinger(e, finger)}
                  />
                }
                label={trlb(finger)}
              />
            ))}
            <SectionSubtitle text={trlb('select_toes')} />
            {toes.map((region, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={form.values.bookingSection.feet.includes(region)}
                    onChange={e => edit && handleSelectFeet(e, region)}
                  />
                }
                label={trlb(region)}
              />
            ))}
            <SectionSubtitle text={trlb('select_spinal_segments')} />
            {spinalSegments.map((region, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={form.values.bookingSection.spinalSegments.includes(region)}
                    onChange={e => edit && handleSelectSignal(e, region)}
                  />
                }
                label={trlb(region)}
              />
            ))}
            <SectionSubtitle text={trlb('select_teeth')} />
            {OpStandardTeeth.map((tooth, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={form.values.bookingSection.teeth.includes(tooth)}
                    onChange={e => edit && handleSelectTeeth(e, tooth)}
                  />
                }
                label={tooth}
              />
            ))}
          </Grid>
        </Panel>
      </Grid>
      <Grid item xs={6}>
        <Panel>
          <SectionSubtitle text={trlb('doc_upload')} />
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.values.bookingSection.userCanUploadDocuments}
                  onChange={e => edit && form.setFieldValue('bookingSection.userCanUploadDocuments', e.target.checked)}
                />
              }
              label={trlb('user_can_upload_doc')}
            />
          </Grid>
        </Panel>
        <Space20 />
        <Panel>
          <SectionSubtitle text={trlb('bookingSection_sideRequired_subtitle')} />
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.values.bookingSection.sideRequired}
                  onChange={e => edit && form.setFieldValue('bookingSection.sideRequired', e.target.checked)}
                />
              }
              label={trlb('bookingSection_sideRequired_label')}
            />
          </Grid>
        </Panel>
        <Space20 />
        <Panel>
          <SectionSubtitle text={trlb('positions')} />
          {form.values.bookingSection.positions.map((position: string, index: number) => (
            <React.Fragment key={index}>
              <AddPositionField
                name={trlb('position') + ' ' + (index + 1) + ': ' + trlb(position)}
                label={trlb('position') + ' ' + (index + 1) + ': ' + trlb(position)}
                menuItems={positioning.map(position => ({ label: position, value: position }))}
                values={positioning.map(position => ({ label: position, value: position }))}
                form={form}
                value={position}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSelectPosition(e
                  .target
                  .value,
                index)}
                onDelete={() => handleRemovePosition(index)}
                inputProps={{ readOnly: !edit }}
                disabledDeleteButton={!edit}
              />
              <Space20 />
            </React.Fragment>
          ))}
          <Space20 />
          {edit
            ? (
              <DefaultButton
                onClick={handleAddPosition}
                text={trlb('add_position')}
                icon={<AddIcon sx={{ marginRight: '10px' }} />}
                disabled={form.values.bookingSection.positions.includes('')}
              />
            )
            : null}
          {form.errors.bookingSection?.positions && (
            <Box>
              <Typography variant='caption' color='error'>
                {' '}
                {trlb(String(form.errors.bookingSection?.positions))}
              </Typography>
            </Box>
          )}
        </Panel>
      </Grid>
    </Grid>
  )
}

export default BookingSection
