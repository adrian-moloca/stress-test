import { Contract, SurgerySlot } from '@smambu/lib.constants'
import { Grid, Modal, Paper } from '@mui/material'
import { CloseButton } from 'components/Buttons'
import { PageHeader, Space20 } from 'components/Commons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'
import MultipleSlots from './MultipleSlots'

const RemoveMultipleTimeSlots = ({
  form,
  showRemoveTimeSlot,
  setShowRemoveTimeSlot,
  onSave = () => { },
  currentSlots,
}: {
  form: FormikProps<Omit<Contract, 'contractId'>>
  showRemoveTimeSlot: boolean
  setShowRemoveTimeSlot: React.Dispatch<React.SetStateAction<boolean>>
  onSave: (slots: SurgerySlot[]) => void
  currentSlots: SurgerySlot[]
}) => {
  const validFrom = form?.values?.details?.validFrom
    ? new Date(form?.values?.details?.validFrom)
    : new Date()
  const validUntil = form?.values?.details?.validUntil
    ? new Date(form?.values?.details.validUntil)
    : new Date()
  const [slots, setSlots] = React.useState<SurgerySlot[]>(currentSlots)

  const handleRemoveSlots = () => {
    onSave(slots)
    setShowRemoveTimeSlot(false)
  }

  React.useEffect(() => {
    setSlots(currentSlots)
  }, [currentSlots])

  return (
    <Modal
      open={showRemoveTimeSlot}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClose={() => setShowRemoveTimeSlot(false)}
    >
      <Paper
        sx={{ maxHeight: '90%', maxWidth: '60%', padding: '20px', pt: 0, overflowY: 'auto', position: 'relative' }}
      >
        <PageHeader
          pageTitle={trlb('removeSlots_pageTitle')}
          button={<CloseButton onClick={() => setShowRemoveTimeSlot(false)} />}
        />
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          <Space20 />
          <MultipleSlots
            remove={true}
            {...{ validFrom, validUntil, currentSlots, setSlots, onSave: handleRemoveSlots }}
          />
        </Grid>
      </Paper>
    </Modal>
  )
}

export default RemoveMultipleTimeSlots
