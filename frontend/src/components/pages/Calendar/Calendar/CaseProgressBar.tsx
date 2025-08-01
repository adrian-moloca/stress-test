import { calendarMinutesInterval, calendarTimeHeightPx } from '@smambu/lib.constants'
import { Box, Theme, Tooltip } from '@mui/material'
import { addMinutes, differenceInMinutes, isBefore, isValid } from 'date-fns'
import React from 'react'

interface CasePhase {
  start: Date
  end?: Date
}

// eslint-disable-next-line max-len
const minutesToPixels = (minutes: number) => (minutes / calendarMinutesInterval) * calendarTimeHeightPx

const phasesIsValid = (phase: CasePhase) => isValid(new Date(phase.start)) &&
  (phase.end == null ||
    (isValid(new Date(phase.end)) && isBefore(new Date(phase.start), new Date(phase.end))))
const phaseIsNotAfterOpenPhase = (_phase: CasePhase, index: number, phasesArray: CasePhase[]) =>
  index === 0 || phasesArray[index - 1].end != null

export const CaseProgressBar = ({
  phases,
  duration,
  date,
  cardHeight,
}: {
  phases: CasePhase[]
  duration: number
  date: Date,
  cardHeight: number
}) => {
  const endOfCase = React.useMemo(() => addMinutes(date, duration), [date, duration])
  const sortedPhases = React.useMemo(() =>
    phases
      .filter(phasesIsValid)
      .sort((a, b) => isBefore(a.start, b.start) ? -1 : 1)
      .filter(phaseIsNotAfterOpenPhase),
  [phases])

  const minutesBefore = sortedPhases[0]?.start
    ? differenceInMinutes(new Date(sortedPhases[0].start), date)
    : 0

  return (
    <Box sx={{ backgroundColor: 'lightgray', height: `${cardHeight}px`, width: '3px' }}>
      <Box
        sx={{
          height: `${minutesToPixels(minutesBefore)}px`,
          backgroundColor: 'transparent',
        }}
      />
      {sortedPhases.map((phase, idx) => {
        const startOfBar = new Date(phase.start)
        const endOfBar = phase.end != null ? new Date(phase.end) : endOfCase
        const phaseMinutes = differenceInMinutes(endOfBar, startOfBar)
        const getColor = (theme: Theme) => theme.palette.customColors[`caseProgressBar${idx}`]
        return (
          <Tooltip key={`_element_${idx}`} title={`${startOfBar.toLocaleTimeString()} - ${endOfBar.toLocaleTimeString()}`}>
            <Box
              key={`_element_${idx}`}
              sx={{
                height: `${minutesToPixels(phaseMinutes)}px`,
                backgroundImage: theme => phase.end == null
                  ? `linear-gradient(to bottom, ${getColor(theme)} 75%, transparent)`
                  : `linear-gradient(${getColor(theme)}, ${getColor(theme)})`,
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
}
