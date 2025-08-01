/* eslint-disable spaced-comment */
import React from 'react'
import { Box, Typography } from '@mui/material'
import { GridNumericField, GridTextField } from 'components/Commons'
import { trlb } from 'utilities'
import {
  ISystemConfigurationField,
  onSystemConfigurationChange,
  systemConfigurationSections,
} from '@smambu/lib.constants'

const FieldsConfigurations = ({
  translationPrefix,
  section,
  values,
  onChange,
  fields,
  numberAsPrices,
  noDecimalLimit,
}: {
  translationPrefix?: string
  section: systemConfigurationSections
  values: Record<string, any>
  onChange: onSystemConfigurationChange
  fields: ISystemConfigurationField[]
  numberAsPrices?: boolean
  noDecimalLimit?: boolean
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 4 }}>
      {fields.map(field => {
        const needsNumeric = field.type === 'number'
        const needsPriceField = numberAsPrices && needsNumeric

        return (
          <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography sx={{ flex: 1, textAlign: 'right' }}>
              {trlb(`${translationPrefix ?? 'systemConfiguration_'}${field.key}`)}
            </Typography>
            <Box sx={{ flex: 1 }}>
              {needsNumeric
                ? (
                  <GridNumericField
                    value={values[field.key] ?? field.defaultValue}
                    onChange={(e: any) => onChange(section, field.key, e.target.value)}
                    sx={{ flex: 1 }}
                    error={field.required && !values[field.key]}
                    helperText={field.required && !values[field.key] ? trlb('systemConfiguration_requiredField') : ''}
                    isPrice={needsPriceField}
                    noDecimalLimit={noDecimalLimit}
                  />
                )
                : (
                  <GridTextField
                    value={values[field.key] ?? field.defaultValue ?? ''}
                    onChange={(e: any) => onChange(section, field.key, e.target.value)}
                    type={field.type ?? 'text'}
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: field.endAdornment,
                    }}
                    error={field.required && !values[field.key]}
                    helperText={field.required && !values[field.key] ? trlb('systemConfiguration_requiredField') : ''}
                  />
                )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default FieldsConfigurations
