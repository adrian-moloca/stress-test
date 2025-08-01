/* eslint-disable etc/no-commented-out-code */
import React, { useState } from 'react'
import { IconButton, Dialog, DialogContent, DialogTitle } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { RenderTableType } from 'universal-reporting/renderers/grid/RenderTableType'

export const RenderColumnTableType: ColumnRenderer<'table'> = inputProps => {
  const {
    field,
    fieldRepresentation,
    fieldDef,
    path,
    locale,
    editable,
    wholePayload,
    update,
    params,
  } = inputProps
  const [open, setOpen] = useState(true)

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <IconButton onClick={handleOpen}>
        <SearchIcon />
      </IconButton>

      {!!open && (
        <Dialog open={open}
          onClose={handleClose}
          fullWidth
          maxWidth='xl'>
          <DialogTitle>Object Details</DialogTitle>
          <DialogContent>
            <pre style={{ fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
              <RenderTableType
                fields={[fieldDef]}
                value={field}
                fieldRepresentation={{ ...fieldRepresentation, margin: 0, span: 12 } as any} // TODO: is it possible to avoid this cast?
                path={path}
                locale={locale}
                editable={editable}
                wholePayload={wholePayload}
                update={update}
              />
            </pre>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
