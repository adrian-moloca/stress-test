import { Add, Close } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { TextIconButton } from 'components/Buttons'
import React from 'react'
import { trlb } from 'utilities'

const CustomToolbar = ({
  selectionModel,
  addRow,
  deleteRow,
  availableMaterials,
}: {
  selectionModel: any
  addRow: () => void
  deleteRow: (selectionModel: any) => void
  availableMaterials: any[]
}) => {
  const deleting = selectionModel.length > 0 && deleteRow

  const getContent = () => {
    if (deleting)
      return (
        <TextIconButton
          onClick={() => deleteRow(selectionModel)}
          text={trlb('systemConfiguration_deleteRow')}
          icon={<Close sx={{ marginRight: '5px' }} />}
        />
      )

    if (availableMaterials?.length === 0)
      return <Typography sx={{ m: 1 }}>{trlb('systemConfiguration_noAvailableMaterials')}</Typography>

    if (addRow)
      return (
        <TextIconButton
          text={trlb('systemConfiguration_addRow')}
          icon={<Add sx={{ marginRight: '5px' }} />}
          onClick={() => addRow()}
        />
      )

    return null
  }

  return <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey' }}>{getContent()}</GridToolbarContainer>
}

export default CustomToolbar
