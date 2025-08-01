import React from 'react'
import { Box, Typography, TextField, Grid, Button, IconButton, InputAdornment, Paper, Theme } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation'
import { GridTextField, PageContainer, PageHeader, Panel, SectionTitle, Space20 } from 'components/Commons'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { TextIconButton } from 'components/Buttons'
import { routes } from 'routes/routes'
import { isBefore, isSameDay, isValid } from 'date-fns'
import { StaticDatePicker } from '@mui/x-date-pickers'
import { trlb } from 'utilities/translator/translator'
import NavMenu from 'components/pages/Calendar/NavMenu'
import WeekRoomsTable from 'components/pages/Calendar/WeekRoomsTable'
import { useAppSelector } from 'store'
import { useNavigate } from 'react-router'
import { permissionRequests, Case, getCaseOpStandard, lastCasesNumber } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import SearchIcon from '@mui/icons-material/Search'
import { Info } from '@mui/icons-material'
import { createSearchParams } from 'react-router-dom'
import { useGetCalendarCases, useGetcasesThatCanIview } from 'hooks'
import { useGetLastCases } from 'hooks/caseshooks'
import { useSelectedDate } from 'hooks/globalHooks'

const Dashboard = () => {
  const navigate = useNavigate()
  const { date, setDate } = useSelectedDate()
  const getcasesThatCanIview = useGetcasesThatCanIview()
  const cases = getcasesThatCanIview()
  const checkPermission = useGetCheckPermission()
  const canViewPatients = checkPermission(permissionRequests.canViewPatients)
  const canCreateBooking = checkPermission(permissionRequests.canCreateBooking)
  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)
  const canViewCasesBookingInfo = checkPermission(permissionRequests.canViewCasesBookingInfo)
  const canViewCalendar = checkPermission(permissionRequests.canViewCalendar)
  const [patientSearchText, setPatientSearchText] = React.useState('')
  const { getCalendarCases } = useGetCalendarCases()
  const getLastCases = useGetLastCases()

  const handleSearch = (e: any) => {
    setPatientSearchText(e.target.value)
  }

  React.useEffect(() => {
    getCalendarCases('weeks', date)
    getLastCases()
  }, [date, canViewCases])
  return (
    <PageContainer>
      <PageHeader pageTitle={trlb('dashboard_title')} />
      <Space20 />
      <Space20 />
      <Grid container>
        {!canViewCalendar &&
          !canCreateBooking &&
          !(canViewCases && canViewCasesBookingInfo) &&
          !canViewPatients &&
          !(canViewBookings && canViewCasesBookingInfo) && (
          <Grid item xs={12} sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Info sx={{ fontSize: '50px', mr: 2 }} />
            <Typography variant='h5'>{trlb('dashboard_noPermissions')}</Typography>
          </Grid>
        )}
        {canViewCalendar && (
          <Grid
            item
            xs={canCreateBooking ? 8 : 12}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <SectionTitle text={trlb('dashboard_subtitleSchedule')} />
            <NavMenu {...{ date, setDate, timeStep: 'weeks' }} />
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                overflowY: 'auto',
                height: '100%',
                maxHeight: '75vh',
              }}
            >
              <WeekRoomsTable edit={false}
                date={date}
                setDraggingCaseId={() => { }}
                cases={cases} />
            </Box>
            <Space20 />
            <TextIconButton
              text={trlb('dashboard_viewCalendar')}
              onClick={() => navigate(routes.calendar.replace(':view', 'week').replace(':orId', 'all'))}
              icon={<CalendarMonthIcon sx={{ marginRight: '10px' }} />}
            />
          </Grid>
        )}
        {canCreateBooking && (
          <Grid
            item
            xs={4}
            sx={{
              minHeight: '600px',
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Panel
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: (theme: Theme) => theme.constants.radius,
              }}
            >
              <SectionTitle text={trlb('dashboard_newBookingRequest')} />
              <Typography
                variant='body1'
                sx={{
                  margin: '20px',
                  textAlign: 'center',
                }}
              >
                {trlb('dashboard_SelectDate')}
              </Typography>
              <StaticDatePicker
                inputFormat={trlb('dateTime_date_string')}
                displayStaticWrapperAs='desktop'
                openTo='day'
                value={date}
                onChange={newDate => setDate(newDate!)}
                renderInput={(params: any) => <TextField {...params} />}
              />
              <Space20 />
              <Button
                onClick={() =>
                  navigate(routes.newBookingRequest + (isValid(date) ? `?bookingDate=${date?.toISOString()}` : ''))
                }
              >
                <InsertInvitationIcon
                  sx={{
                    marginRight: '10px',
                    fill: theme => (!date ? 'lightgrey' : theme.palette.primary.main),
                  }}
                />
                {trlb('dashboard_startBookingRequest')}
              </Button>
            </Panel>
          </Grid>
        )}
        {canViewPatients && (
          <Grid item xs={12}>
            <SectionTitle text={trlb('dashboard_findPatient')} />
            <GridTextField
              xs={12}
              label={trlb('commons_search')}
              searchIcon
              defaultValue={patientSearchText}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      edge='start'
                      onClick={() => {
                        patientSearchText
                          ? navigate({
                            pathname: routes.patientsList,
                            search: createSearchParams({
                              query: patientSearchText,
                            }).toString(),
                          })
                          : navigate(routes.patientsList)
                      }}
                      disabled={!patientSearchText}
                    >
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        )}
        <Space20 />
        {((canViewCases && canViewCasesBookingInfo) ||
          (canViewBookings && canViewCasesBookingInfo)) &&
          <Cases />}
      </Grid>
      <Space20 />
    </PageContainer>
  )
}

const Cases = () => {
  const checkPermission = useGetCheckPermission()
  const navigate = useNavigate()
  const cases = useAppSelector(state => state.cases)
  const contracts = useAppSelector(state => state.contracts)
  const user = useAppSelector(state => state.auth.user)
  const canViewCasesList = checkPermission(permissionRequests.canViewCasesList)
  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canSeeSeeAllCasesButton = canViewCasesList && canViewCases
  return (
    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
      <Grid
        item
        xs={8}
        gap={2}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <SectionTitle text={trlb('dashboard_recentCases')} />
        {Object.values(cases)
          .filter(
            (c: Case) => isBefore(c.bookingSection.date, new Date()) ||
              isSameDay(c.bookingSection.date, new Date()),
          )
          .sort((a: Case, b: Case) => +b.bookingSection.date - +a.bookingSection.date)
          .slice(0, lastCasesNumber)
          .map((c: Case) => {
            const canViewCase = checkPermission(permissionRequests.canViewCase, {
              caseItem: c,
              user,
            })
            return (
              <Paper style={{ width: '100%' }} sx={{ padding: '16px' }} key={c.caseId}>
                <Grid container>
                  <Grid item sx={{ display: 'flex' }} xs={11}>
                    <Grid
                      item
                      xs={2}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography>
                        <b>{`${c.caseNumber}`}</b>
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography>
                        <b>
                          {
                            getCaseOpStandard({
                              caseForm: c,
                              contracts,
                            })?.name
                          }
                        </b>
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={2}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography>
                        <b>{`${c.bookingPatient.name ?? ''} ${c.bookingPatient.surname ?? ''}`}</b>
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={3}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {`${c.bookingSection.date.toLocaleDateString()} - ${c.bookingSection.date.toLocaleTimeString()}`}
                    </Grid>
                  </Grid>
                  <Grid item xs={1}>
                    {canViewCase && (
                      <IconButton
                        component='span'
                        onClick={() => {
                          navigate(routes.mapCaseDetails(c.caseId))
                        }}
                        size='small'
                      >
                        <Info />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            )
          })}
        {canSeeSeeAllCasesButton && (
          <TextIconButton
            text={trlb('see_all_cases')}
            onClick={() => navigate(routes.cases)}
            icon={<FolderOpenIcon sx={{ marginRight: '10px' }} />}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default Dashboard
