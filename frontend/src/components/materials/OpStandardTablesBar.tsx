import { Add } from '@mui/icons-material'
import { Box } from '@mui/material'
import { TextIconButton } from 'components/Buttons'
import React from 'react'
import { trlb } from 'utilities'

const OpStandardTablesBar = ({
  edit,
  tablesProps,
}: {
  edit?: boolean
  tablesProps: {
    rows: any[]
    addRow: () => void
    addRowText: string
  }[]
}) => {
  const emptyTablesProp = tablesProps.filter(tableProp => tableProp.rows?.length === 0)

  if (emptyTablesProp.length === 0 || !edit) return null

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 2,
        p: 0.5,
        my: 1,
        bgcolor: 'primary.light',
        borderRadius: theme => theme.constants.radius,
        flexWrap: 'wrap',
      }}
    >
      {emptyTablesProp.map((tableProp: any) => (
        <TextIconButton
          key={tableProp.addRowText}
          icon={<Add sx={{ mr: 2 }} />}
          onClick={tableProp.addRow ? tableProp.addRow : () => {}}
          text={trlb(tableProp.addRowText)}
          variant='outlined'
          sx={{ whiteSpace: 'nowrap', backgroundColor: 'primary.light' }}
        />
      ))}
    </Box>
  )
}

export default OpStandardTablesBar
