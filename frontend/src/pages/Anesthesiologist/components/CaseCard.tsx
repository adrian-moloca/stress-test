import { AnestChipSources, calendarTimeHeightPx, CaseStatus, DnDItemTypes, getCaseContract, getFullName, ILimitedCaseForCard, IUser } from '@smambu/lib.constants'
import { Box, ClickAwayListener, Collapse, Typography } from '@mui/material'
import { Theme } from '@mui/system'
import { Space20 } from 'components/Commons'
import { format } from 'date-fns'
import { useAssignAnesthesiologistToCase } from 'hooks'
import React from 'react'
import { useDrop } from 'react-dnd'
import { useAppSelector } from 'store'
import { trlb } from 'utilities'
import AnesthesiologistsChipManager from './AnesthesiologistsChipManager'

const CaseCard = ({ c, timeStamp }: { c: ILimitedCaseForCard, timeStamp: number }) => {
  const contracts = useAppSelector(state => state.contracts)
  const contract = getCaseContract({
    caseForm: c,
    contracts,
  })
  const opStandard = contract?.opStandards?.[c.bookingSection.opStandardId]

  const doctorName = getFullName(c.associatedDoctor, true)
  const realHeight = ((calendarTimeHeightPx * (opStandard?.surgeryDurationInMinutes || 0)) / 5) - 2
  const miniumHeight = 10 * calendarTimeHeightPx
  const height = realHeight > miniumHeight ? realHeight : miniumHeight
  const [showMore, setShowMore] = React.useState(false)
  const assignAnesthesiologistToCase = useAssignAnesthesiologistToCase()

  const [{ isOver }, dropRef] = useDrop<IUser, void, { isOver: boolean }>(
    () => ({
      accept: DnDItemTypes.ANESTHESIOLOGIST,
      collect: monitor => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
      drop (item) {
        assignAnesthesiologistToCase({
          caseId: c.caseId,
          anesthesiologistId: item.id,
          timeStamp,
        })
      },
    }),
    [c.caseId, assignAnesthesiologistToCase],
  )

  const getBackgroundColor = (theme: Theme) => {
    if (isOver) return theme.palette.secondary.light

    if (c.anesthesiologistsId?.length > 0) return theme.palette.customColors[CaseStatus.CONFIRMED]

    return theme.palette.customColors[CaseStatus.ON_HOLD]
  }

  const offset = c.offset || 0
  return (
    <Box
      ref={dropRef}
      key={c.caseId}
      onClick={() => setShowMore(true)}
      sx={{
        height,
        boxShadow: theme => (showMore ? 'none' : theme.constants.boxShadow),
        mx: 1,
        borderRadius: theme => theme.constants.radius,
        width: showMore ? 'content-fit' : 'inherit',
        zIndex: showMore ? 1100 : c.zIndex,
        left: theme => theme.spacing(offset * 2),
        right: theme => (showMore ? 'inherit' : theme.spacing(-offset * 2)),
        position: 'absolute',
        top: 0,
      }}
    >
      <ClickAwayListener onClickAway={() => setShowMore(false)}>
        <Collapse
          in={showMore}
          collapsedSize={height}
          sx={{
            position: 'relative',
            backgroundColor: getBackgroundColor,
            boxShadow: theme => (showMore ? theme.constants.boxShadow : 'none'),
            borderRadius: theme => theme.constants.radius,
          }}
        >
          <Box
            sx={{
              minHeight: '100%',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: -1,
                justifyContent: 'space-between',
                mr: -1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 0 }}>
                <Typography variant='body1'>{opStandard?.name}</Typography>
              </Box>
            </Box>
            <Typography variant='caption'>
              {trlb('calendarCard_datetime') + ': '}
              <strong>{format(c.bookingSection.date, 'HH:mm')}</strong>
            </Typography>
            <Typography variant='caption'>
              {trlb('calendarCard_doctor') + ': '}
              <strong>{doctorName}</strong>
            </Typography>
          </Box>
          <Space20 />
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: theme => theme.spacing(1),
              display: 'flex',
              left: theme => theme.spacing(1),
              justifyContent: 'flex-end',
            }}
          >
            <AnesthesiologistsChipManager
              sourceId={c.caseId}
              anestsIds={c.anesthesiologistsId}
              showMore={showMore}
              source={AnestChipSources.CASE}
            />
          </Box>
        </Collapse>
      </ClickAwayListener>
      {showMore
        ? null
        : (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              height: theme => theme.spacing(1),
              backgroundColor: getBackgroundColor,
              borderRadius: theme => theme.constants.radius,
            }}
          />
        )}
    </Box>
  )
}

export default CaseCard
