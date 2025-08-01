import { CaseStatus, caseStatusOrder, drawerWidth, getDayTimestamp } from '@smambu/lib.constants'
import { ExpandCircleDown } from '@mui/icons-material'
import { Box, Button, IconButton, Theme, Typography } from '@mui/material'
import { PageContainer, PageHeader, Panel } from 'components/Commons'
import { useDiscardAnesthesiologistsSchedule, useGetCalendarCases, useSaveAnesthesiologistsSchedule } from 'hooks'
import { NavMenu } from 'pages/Calendar'
import React, { useEffect, useState } from 'react'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import AnesthesiologistsSidebar from './components/AnesthesiologistsSidebar'
import DayTab from './components/DayTab'
import { format } from 'date-fns'
import { useSelectedDate } from 'hooks/globalHooks'
import ColorLegend from './components/ColorLegend'
import { useEditOrScheduling, useGetOrScheduling } from 'hooks/roomsHooks'

const timeZone = import.meta.env.VITE_TIME_ZONE

const AnesthesiologistManagement = () => {
  const orScheduling = useAppSelector(state => state.orScheduling)
  const [openSidebar, setOpenSidebar] = useState(true)
  const [expandedBefore, setExpandedBefore] = useState(false)
  const [expandedAfter, setExpandedAfter] = useState(false)
  const [draggingAnesthesiologistId, setDraggingAnesthesiologistId] = useState('')
  const { date, setDate } = useSelectedDate()
  const { getCalendarCases } = useGetCalendarCases()
  const saveAnesthesiologistsSchedule = useSaveAnesthesiologistsSchedule()
  const discardAnesthesiologistsSchedule = useDiscardAnesthesiologistsSchedule()
  const allCases = useAppSelector(state => state.limitedCases)
  const anesthesiologistsSchedule = useAppSelector(state => state.anesthesiologistsSchedule)
  const changed = orScheduling.some(o => o.edited)
  const editOrScheduling = useEditOrScheduling()
  const getOrScheduling = useGetOrScheduling()
  const timeStamp = getDayTimestamp(date, timeZone)

  const lastUpdatedAt = orScheduling.reduce((acc, o) =>
    (!o.edited && o.updatedAt != null && (acc == null || o.updatedAt > acc) ? o.updatedAt : acc),
  null as Date | null)

  const cases = Object.fromEntries(
    Object.entries(allCases)
      .filter(([_caseId, c]) => c.status === CaseStatus.CONFIRMED ||
      caseStatusOrder.includes(c.status))
      .map(([caseId, c]) => [
        caseId,
        {
          ...c,
          anesthesiologistsId: anesthesiologistsSchedule[c.caseId!] ?? c.anesthesiologistsId,
        },
      ]),
  )

  useEffect(() => {
    getCalendarCases('days', date)
    getOrScheduling(date)
  }, [date])

  const handleSave = async () => {
    await editOrScheduling()
    await saveAnesthesiologistsSchedule()
  }

  const handleDiscard = async () => {
    await getOrScheduling(date)
    await discardAnesthesiologistsSchedule(date)
  }

  return (
    <PageContainer
      sx={{
        p: 0,
        px: 1,
        maxHeight: 'calc(100vh - 64px)',
        ...(openSidebar
          ? {
            transition: (theme: Theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
            width: `calc(100% - ${drawerWidth}px)`,
          }
          : {
            transition: (theme: Theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            width: `calc(100% - ${0}px)`,
          }),
      }}
    >
      <PageHeader
        backButtonSx={{ display: 'none' }}
        pageTitleSx={{ alignItems: 'flex-start' }}
        titleTypographySx={{ width: 'fit-content' }}
        pageTitle={trlb('anesthesiologistSchedule_title')}
        {...{ openSidebar, setOpenSidebar }}
      >
        <NavMenu {...{ date, setDate, timeStep: 'days' }} />
        <IconButton
          onClick={() => setOpenSidebar(!openSidebar)}
          sx={{ transform: `rotate(${openSidebar ? 270 : 90}deg)` }}
        >
          <ExpandCircleDown />
        </IconButton>
      </PageHeader>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flexGrow: 1 }} />
        {(lastUpdatedAt != null || changed) && (
          <Panel
            sx={{
              py: 1,
              px: 3,
              mr: 2,
              backgroundColor: (theme: Theme) => theme.palette.primary.light,
              textAlign: 'center',
            }}
          >
            {changed
              ? (
                <Typography>{trlb('calendar_changesNotConfirmed')}</Typography>
              )
              : (
                <Typography>
                  {trlb('calendar_lastConfirmation', { date: format(lastUpdatedAt!, trlb('dateTime_date_time_string')) })}
                </Typography>
              )}
          </Panel>
        )}
        {changed
          ? (
            <>
              <Button variant='contained' color='secondary' onClick={handleSave}>
                {trlb('commons_save')}
              </Button>
              <Button sx={{ whiteSpace: 'nowrap', ml: 2 }} variant='text' color='primary' onClick={handleDiscard}>
                {trlb('commons_discardChanges')}
              </Button>
            </>
          )
          : null}
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <DayTab
          {...{
            date,
            orId: 'all',
            cases,
            expandedBefore,
            setExpandedBefore,
            expandedAfter,
            setExpandedAfter,
            draggingAnesthesiologistId,
            openSidebar,
            timeStamp,
          }}
        />
      </Box>
      <AnesthesiologistsSidebar {...{
        openSidebar,
        draggingAnesthesiologistId,
        setDraggingAnesthesiologistId,
        date,
        timeStamp
      }} />
      <ColorLegend />
    </PageContainer>
  )
}

export default AnesthesiologistManagement
