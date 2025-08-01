import { Add, Close } from '@mui/icons-material'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { TextIconButton } from 'components/Buttons'
import React from 'react'
import { trlb } from 'utilities'

const MaterialPricesTableToolBar = ({
  selectionModel,
  addRow,
  deleteRow,
  edit,
}: {
  selectionModel: any
  addRow: () => void
  deleteRow: (selectionModel: any) => void
  edit?: boolean
}) => {
  const getElement = () => {
    if (edit && selectionModel.length > 0 && deleteRow)
      return (
        <TextIconButton
          onClick={() => deleteRow(selectionModel)}
          text={trlb('insurancesPopover_deleteRow')}
          icon={<Close sx={{ marginRight: '5px' }} />}
        />
      )

    if (edit && addRow)
      return (
        <TextIconButton
          text={trlb('insurancesPopover_addRow')}
          icon={<Add sx={{ marginRight: '5px' }} />}
          onClick={() => addRow()}
        />
      )

    return null
  }

  return <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey' }}>{getElement()}</GridToolbarContainer>
}

export default MaterialPricesTableToolBar
