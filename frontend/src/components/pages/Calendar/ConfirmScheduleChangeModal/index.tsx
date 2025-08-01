import { CaseStatus, ILimitedCase, getFullName, getSurgeryName } from '@smambu/lib.constants'
import React, { useEffect, useMemo, useState } from 'react'
import { format, isSameWeek } from 'date-fns'
import { useAppSelector } from 'store'
import {
  Box,
  Button,
  Checkbox,
  Grid,
  ListItemText,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { NavMenu } from 'pages/Calendar'
import { trlb } from 'utilities'
import { Save } from '@mui/icons-material'

interface ConfirmScheduleChangeModalProps {
  saving: boolean
  setSaving: (value: boolean) => void
  date: Date
  setDate: (value: Date) => void
  cases: ILimitedCase[]
  save: (value: any) => void
}

const ConfirmScheduleChangeModal = ({
  saving,
  setSaving,
  save,
  date,
  setDate,
  cases,
}: ConfirmScheduleChangeModalProps) => {
  const changeNotifiedCases = cases.filter(c => c.status === CaseStatus.CHANGE_NOTIFIED)
  const contracts = useAppSelector(state => state.contracts)
  const [casesWithForcedChange, setCasesWithForcedChange] = useState<
    {
      caseId: string
      note: string
    }[]
  >([])

  const filteredCases = useMemo(
    () => changeNotifiedCases.filter(c => isSameWeek(c.bookingSection.date,
      date,
      { weekStartsOn: 1 })),
    [changeNotifiedCases, date],
  )

  useEffect(() => {
    setCasesWithForcedChange([])
  }, [saving])

  return (
    <Modal
      open={saving}
      onClose={() => setSaving(false)}
      BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0, 0.3)' } }}
      style={{ height: '95%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper sx={{ minHeight: '45%', maxHeight: '95%', width: '50%', padding: '16px', p: 4 }}>
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', marginRight: '10px' }}
          >
            <div style={{ width: '10%' }} />
            <Typography variant='h5' sx={{ width: '80%', textAlign: 'center' }}>
              {trlb('confirmTimeTable_title')}
            </Typography>
            <Button sx={{ width: '10%' }} onClick={() => setSaving(false)}>
              {trlb('commons_back')}
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{
              margin: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant='h6' sx={{ width: '100%', textAlign: 'center', marginBottom: '10px' }}>
              {trlb('confirmTimeTable_warning')}
            </Typography>
            <NavMenu
              {...{
                date,
                setDate: newDate => {
                  setDate(newDate)
                  setCasesWithForcedChange([])
                },
                timeStep: 'weeks',
              }}
            />
          </Grid>
          <Box
            sx={{
              height: 'calc(35vh - 10px)',
              overflowY: 'auto',
              display: 'flex',
              flexGrow: 1,
            }}
          >
            <Table aria-label='simple table' sx={{ height: '90%' }}>
              <TableHead>
                <TableRow>
                  <TableCell>{trlb('schedulingSaveModal_tableSurgeryAndDoctor')}</TableCell>
                  <TableCell>{trlb('schedulingSaveModal_newDatetime')}</TableCell>
                  <TableCell>{trlb('schedulingSaveModal_ignoreConfirmation')}</TableCell>
                  <TableCell>{trlb('schedulingSaveModal_ignoreConfirmationNotes')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCases.map(c => {
                  const surgeryName = getSurgeryName({
                    caseForm: c,
                    contracts,
                  })
                  const doctorName = getFullName(c.associatedDoctor, true)
                  return (
                    <TableRow key={c.caseId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component='th' scope='row'>
                        <ListItemText primary={surgeryName} secondary={doctorName} />
                      </TableCell>
                      <TableCell>{format(c.bookingSection.date, 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell sx={{ width: 50 }}>
                        <Checkbox
                          onChange={() => {
                            if (casesWithForcedChange.find(item => item.caseId === c.caseId))
                              setCasesWithForcedChange(prev => prev
                                .filter(item => item.caseId !== c.caseId))
                            else
                              setCasesWithForcedChange(prev => [
                                ...prev,
                                {
                                  caseId: c.caseId,
                                  note: '',
                                },
                              ])
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 150 }}>
                        {casesWithForcedChange.find(item => item.caseId === c.caseId)
                          ? (
                            <TextField
                              fullWidth
                              multiline
                              value={casesWithForcedChange?.find(item => item.caseId === c.caseId)?.note ?? ''}
                              onChange={e => {
                                setCasesWithForcedChange(prev =>
                                  prev.map(item => {
                                    if (item.caseId === c.caseId)
                                      return { ...item, note: e.target.value }
                                    else return item
                                  }))
                              }}
                            />
                          )
                          : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
          <Grid item xs={12} sx={{ margin: '10px', marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <Button
              color='secondary'
              variant='contained'
              sx={{ maxWidth: '220px', margin: '10px' }}
              onClick={() => save(casesWithForcedChange)}
            >
              <Save sx={{ fill: theme => theme.palette.secondary.contrastText, mr: 1 }} />
              {trlb('confirmTimeTable_button')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  )
}

export default ConfirmScheduleChangeModal
