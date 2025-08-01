import React from 'react'
import { ListItemText, ListItem, Typography, ListItemIcon, Box } from '@mui/material'
import { Add, Check, InfoOutlined, Remove } from '@mui/icons-material'
import { IFormattedCapability } from '@smambu/lib.constants'
import { trlb } from 'utilities'
import StandardDialog from 'components/StandardDialog'

export const CapabilityButton = ({
  edit,
  capability,
  addCapability,
  removeCapability,
}: {
  edit?: boolean
  capability: IFormattedCapability
  addCapability?: (capability: string) => void
  removeCapability?: (capability: string) => void
}) => {
  const [showInfoModal, setShowInfoModal] = React.useState(false)
  return (
    <>
      {showInfoModal && (
        <StandardDialog
          open={showInfoModal}
          titleKey={`${capability.name}: ${capability.permission}`}
          textKey={`${capability.value}_description`}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      <ListItem sx={{ paddingRight: '30px', paddingLeft: '30px' }}>
        {edit && removeCapability
          ? (
            <ListItemIcon
              onClick={() => removeCapability(capability?.value!)}
              sx={{ cursor: 'pointer', minWidth: '20px', bgcolor: 'primary.light', borderRadius: '100%', p: 0.5 }}
            >
              <Remove />
            </ListItemIcon>
          )
          : null}
        <ListItemIcon onClick={() => setShowInfoModal(true)} sx={{ cursor: 'pointer', minWidth: '20px' }}>
          <InfoOutlined sx={{ fontSize: '16px' }} />
        </ListItemIcon>
        <ListItemText sx={{ maxWidth: '400px' }}>
          <b>{capability.name}</b> {capability.permission}
        </ListItemText>
        {edit && addCapability
          ? (
            <ListItemIcon
              onClick={() => addCapability(capability?.value!)}
              sx={{ cursor: 'pointer', minWidth: '20px', bgcolor: 'primary.light', borderRadius: '100%', p: 0.5 }}
            >
              <Add />
            </ListItemIcon>
          )
          : null}
        {edit && removeCapability
          ? (
            <ListItemIcon sx={{ minWidth: '20px' }}>
              <Check />
            </ListItemIcon>
          )
          : null}
      </ListItem>
    </>
  )
}

export const ChangesCounter = ({
  addedCapabilities,
  removedCapabilities,
  edit,
}: {
  addedCapabilities: number
  removedCapabilities: number
  edit?: boolean
}) => {
  if (!edit) return null
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        mt: -2,
      }}
    >
      <Typography variant='body1' sx={{ marginRight: '50px' }}>
        <b>{`${trlb('adding')}: `}</b>
        {addedCapabilities === 1 ? trlb('roles_oneCapability') : `${addedCapabilities} ${trlb('capabilities')}`}
      </Typography>
      <Typography variant='body1' sx={{ marginRight: '30px' }}>
        <b>{`${trlb('removing')}: `}</b>
        {removedCapabilities === 1 ? trlb('roles_oneCapability') : `${removedCapabilities} ${trlb('capabilities')}`}
      </Typography>
    </Box>
  )
}
