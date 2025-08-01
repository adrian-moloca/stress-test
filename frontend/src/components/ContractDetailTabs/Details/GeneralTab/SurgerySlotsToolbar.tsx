import { GridToolbarContainer } from '@mui/x-data-grid'
import { TextIconButton } from 'components/Buttons'
import React from 'react'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import { trlb } from 'utilities'

const SurgerySlotsToolbar = ({
  selectionModel,
  handleRemoveSelectedSlots,
  setShowAddTimeSlot,
  setSingleSlotProp,
  setShowRemoveTimeSlot,
}: {
  selectionModel: string[]
  handleRemoveSelectedSlots: () => void
  setShowAddTimeSlot: React.Dispatch<React.SetStateAction<boolean>>
  setSingleSlotProp: React.Dispatch<React.SetStateAction<boolean>>
  setShowRemoveTimeSlot: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  return (
    <GridToolbarContainer sx={{ borderBottom: '1px solid lightGrey' }}>
      {selectionModel.length
        ? (
          <TextIconButton
            text={trlb('remove_selected')}
            icon={<RemoveIcon sx={{ marginRight: '5px' }} />}
            onClick={handleRemoveSelectedSlots}
          />
        )
        : (
          <>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRight: '1px solid lightGrey',
                marginRight: '20px',
              }}
            />
            <TextIconButton
              icon={<AddIcon sx={{ marginRight: '10px' }} />}
              onClick={() => {
                setSingleSlotProp(true)
                setShowAddTimeSlot(true)
              }}
              text={trlb('add_single_slot')}
            />
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRight: '1px solid lightGrey',
                marginRight: '20px',
              }}
            />
            <TextIconButton
              icon={<AddIcon sx={{ marginRight: '10px' }} />}
              onClick={() => {
                setShowAddTimeSlot(true)
                setSingleSlotProp(false)
              }}
              text={trlb('add_multiple_slots')}
            />
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRight: '1px solid lightGrey',
                marginRight: '20px',
              }}
            />
            <TextIconButton
              text={trlb('remove_multiple_slots')}
              icon={<RemoveIcon sx={{ marginRight: '5px' }} />}
              onClick={() => setShowRemoveTimeSlot(true)}
            />
          </>
        )}
    </GridToolbarContainer>
  )
}

export default SurgerySlotsToolbar
