import { Box, Chip } from '@mui/material'
import { trlb } from 'utilities'
import React from 'react'
import AnesthesiologistChip from './AnesthesiologistChip'
import { AnestChipSources } from '@smambu/lib.constants'

const AnesthesiologistsChipManager = ({
  sourceId, anestsIds, showMore, source
}: {
  sourceId: string; anestsIds: string[]; showMore: boolean; source: AnestChipSources
}) => {
  if (anestsIds.length === 0) return null
  if (anestsIds.length === 1) {
    const id = anestsIds[0]
    return <AnesthesiologistChip key={id + sourceId} {...{ id, source, sourceId }} />
  }
  if (!showMore)
    return (
      <Chip
        label={trlb('anesthesiologistChip_anestNum', { count: String(anestsIds.length) })}
        sx={{
          ml: 1,
          backgroundColor: theme => theme.palette.secondary.light,
          zIndex: 5,
          mb: '2px',
        }}
      />
    )
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {anestsIds.map(anestId => (
        <AnesthesiologistChip key={anestId + sourceId} {...{
          id: anestId,
          source,
          sourceId,
          sx: { mb: 1 }
        }} />
      ))}
    </Box>
  )
}

export default AnesthesiologistsChipManager
