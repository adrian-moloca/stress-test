import { Contract, SurgerySlot, getRandomUniqueId } from '@smambu/lib.constants'
import { Grid, Modal, Paper } from '@mui/material'
import { CloseButton } from 'components/Buttons'
import { PageHeader, Space20 } from 'components/Commons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'
import MultipleSlots from './MultipleSlots'

const AddMultipleTimeSlots = ({
  showAddTimeSlot,
  setShowAddTimeSlot,
  form,
  currentSlots,
  setSurgerySlots,
}: {
  showAddTimeSlot: boolean
  setShowAddTimeSlot: (value: boolean) => void
  form: FormikProps<Omit<Contract, 'contractId'>>
  currentSlots: SurgerySlot[]
  setSurgerySlots: (value: SurgerySlot[]) => void
}) => {
  const validFrom = form?.values?.details?.validFrom
    ? new Date(form?.values?.details?.validFrom)
    : new Date()
  const validUntil = form?.values?.details?.validUntil
    ? new Date(form?.values?.details.validUntil)
    : new Date()
  const [slots, setSlots] = React.useState<SurgerySlot[]>([])

  const checkGeneralError = () => {
    const sortedSurgerySlots = [...currentSlots, ...slots]
      .sort((a, b) => (a.from > b.from ? 1 : -1))
    for (let i = 0; i < sortedSurgerySlots.length - 1; i++) {
      const parsedFromDate = new Date(sortedSurgerySlots[i].from)
      const parsedToDate = new Date(sortedSurgerySlots[i].to)

      if (parsedFromDate.getTime() > parsedToDate.getTime())
        return 'contract_slotDatesMismatch'

      const parsedIncrementedToDate = new Date(sortedSurgerySlots[i + 1].from)
      if (parsedToDate.getTime() > parsedIncrementedToDate.getTime())
        return 'contract_slotsDatesOverlap'
    }
  }

  const error = checkGeneralError()

  const onSave = () => {
    setSurgerySlots(
      [...currentSlots, ...slots].map(obj => ({
        id: obj.id ?? getRandomUniqueId(),
        from: new Date(obj.from),
        to: new Date(obj.to),
      })),
    )
    onClose()
  }

  const onClose = () => {
    setShowAddTimeSlot(false)
  }

  return (
    <Modal
      open={showAddTimeSlot}
      onClose={onClose}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{ maxHeight: '90%', maxWidth: '60%', padding: '20px', pt: 0, overflowY: 'auto', position: 'relative' }}
      >
        <PageHeader
          toolbarSx={{ top: 0 }}
          pageTitle={trlb('addSlots_pageTitle')}
          button={<CloseButton onClick={onClose} />}
        />
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          <Space20 />
          <MultipleSlots {...{
            validFrom,
            validUntil,
            currentSlots,
            setSlots,
            error,
            onSave
          }} />
        </Grid>
      </Paper>
    </Modal>
  )
}

export default AddMultipleTimeSlots
