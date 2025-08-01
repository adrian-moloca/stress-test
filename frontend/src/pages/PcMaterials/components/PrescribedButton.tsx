import { EPrescriptionStatus, IHydratedPrescription } from '@smambu/lib.constants'
import { useSetPrescriptionPrescribed } from 'hooks/pcMaterialsHooks'
import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { trlb } from 'utilities'

const PrescribedButton = ({
  prescription,
  refreshCurrentPage,
}: {
  prescription: IHydratedPrescription
  refreshCurrentPage: () => void
}) => {
  const setPrescriptionPrescribed = useSetPrescriptionPrescribed()

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setPrescriptionPrescribed(prescription._id)
    refreshCurrentPage()
  }

  if (prescription.status === EPrescriptionStatus.CANCELLED) return null

  if (prescription.status === EPrescriptionStatus.PRESCRIBED) return (
    <Box
      sx={{
        display: 'block',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Typography variant='body2' color='primary'>
        {trlb('prescriptions_prescribed')}
      </Typography>
    </Box>
  )

  return (
    <Button onClick={handleClick} variant='contained' color='primary' size='small'>
      {trlb('prescriptions_markAsPrescribedButton')}
    </Button>
  )
}

export default PrescribedButton
