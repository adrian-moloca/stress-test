import React from 'react'
import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { trlb } from 'utilities/translator/translator'
import { onSystemConfigurationChange, systemConfigurationSections } from '@smambu/lib.constants'

export const FreeFieldsConfigurations = ({
  section,
  values,
  onChange,
}: {
  section: systemConfigurationSections
  values: string[]
  onChange: onSystemConfigurationChange
}) => {
  const setValues = (values: string[]) => {
    onChange(section, null, values)
  }

  const addRow = () => {
    setValues([...values, ''])
  }

  const deleteRow = (index: number) => {
    setValues(values.filter((_, i) => i !== index))
  }

  const onChangeRow = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    setValues(newValues)
  }

  // TODO: Add validation for subject area duplication or permit to create them
  return (
    <Box display='flex' flexDirection='column' alignItems='center'>
      {values.length === 0 && (
        <Typography variant='h6' sx={{ my: 8 }}>
          {trlb('systemConfiguration_noRows')}
        </Typography>
      )}
      {values.map((value, index) => {
        const duplicate = values.filter(v => v === value).length > 1

        let helperText
        if (value === '')
          helperText = trlb('systemConfiguration_requiredField')
        else
          helperText = duplicate
            ? trlb('systemConfiguration_duplicateField')
            : ''

        return (
          <Box
            key={index}
            sx={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}
          >
            <TextField
              key={index}
              value={value ?? ''}
              onChange={(e: any) => onChangeRow(index, e?.target.value)}
              sx={{ maxWidth: 500 }}
              fullWidth
              error={duplicate || value === ''}
              helperText={helperText}
            />
            <IconButton onClick={() => deleteRow(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      })}
      <Button
        variant='contained'
        color='primary'
        startIcon={<AddIcon sx={{ fill: theme => theme.palette.primary.contrastText }} />}
        onClick={addRow}
        sx={{ my: 4 }}
      >
        {trlb('systemConfiguration_addRow')}
      </Button>
    </Box>
  )
}

export default FreeFieldsConfigurations
