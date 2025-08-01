import React, { useState } from 'react'
import { IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { ColumnRenderer } from 'universal-reporting/renderers/types'
import { RenderObjectType } from 'universal-reporting/renderers/grid/RenderObjectType'

export const RenderColumnObjectType: ColumnRenderer<'object'> = inputProps => {
  const {
    field,
    fieldRepresentation,
    fieldDef,
    path,
    locale,
    editable,
    wholePayload,
    update,
  } = inputProps
  const [open, setOpen] = useState(false)

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
              <RenderObjectType
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
