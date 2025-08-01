import { Box, Typography } from '@mui/material'
import React from 'react'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { ConnectDropTarget } from 'react-dnd'
import { trlb } from 'utilities'

interface RequestsAccordionProps {
  title: string
  details: React.ReactNode
  dropRef?: ConnectDropTarget
  isOver?: boolean
  isLast?: boolean
  open: boolean
  setOpen: () => void
  titleButton?: React.ReactNode
}

const RequestsAccordion = ({
  title, details, dropRef, isOver, isLast, open, setOpen, titleButton,
}: RequestsAccordionProps) => {
  return (
    <>
      <Box
        ref={dropRef}
        sx={{
          p: 1,
          backgroundColor: theme => (isOver
            ? theme.palette.secondary.light
            : theme.palette.primary.light),
          transition: 'flex 0.5s',
          flex: open ? '1 1 auto' : '0 0 auto',
          minHeight: 48,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            alignSelf: 'stretch',
            cursor: 'pointer',
            mb: open ? 2 : 0,
          }}
          onClick={setOpen}
        >
          {titleButton}
          <Typography sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '1rem' }}>{trlb(title)}</Typography>
          {open ? <ExpandLess /> : <ExpandMore />}
        </Box>
        <Box
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            display: 'flex',
            visibility: open ? 'visible' : 'hidden',
            transition: 'visibility 5s',
            maxHeight: 'calc(100% - 40px)',
            overflowY: 'auto',
          }}
        >
          {open ? details : null}
        </Box>
      </Box>
      {!isLast
        ? (
          <Box sx={{ width: '100%', height: '1px', display: 'flex', px: '8px' }}>
            <Box sx={{ flexGrow: 1, height: '1px', backgroundColor: 'lightgrey' }} />
          </Box>
        )
        : null}
    </>
  )
}

export default RequestsAccordion
