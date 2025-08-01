import { OpStandard } from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { Panel, SectionTitle, Space10 } from 'components/Commons'
import { FlexAutocomplete } from 'components/FlexCommons'
import { trlb } from 'utilities'
import React from 'react'
import { useOpStandardManagementContext } from 'components/materials/OpStandardContext'

// todo: add logic if doctor then edit only for notes

const DuplicatePanel = ({
  selectedOpStandard,
  handleChangeOpStandard,
  isNew,
}: {
  selectedOpStandard?: Omit<OpStandard, 'opStandardId'>
  handleChangeOpStandard: (value: OpStandard) => void
  isNew: boolean
}) => {
  const { doctorOpstandards: opStandards } = useOpStandardManagementContext()

  if (!isNew) return null

  return (
    <Panel>
      <SectionTitle text={trlb('duplicate_op_standard')} />
      <Space10 />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FlexAutocomplete
          label={trlb('op_standard_name')}
          options={opStandards.map(opStandard => ({
            value: opStandard._id,
            label: opStandard.name
          }))}
          selected={selectedOpStandard
            ? {
              value: selectedOpStandard._id!,
              label: selectedOpStandard.name
            }
            : undefined}
          onSelectValue={(_e, value) => {
            const op = opStandards.find((opStandard: OpStandard) => opStandard._id === value?.value)

            if (op === undefined) return
            handleChangeOpStandard(op)
          }}
        />
      </Box>
      <Space10 />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
          {trlb('orFill_in_the_fields')}
        </Typography>
      </Box>
    </Panel>
  )
}

export default DuplicatePanel
