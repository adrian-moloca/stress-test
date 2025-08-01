import {
  CurrencySymbol,
  CurrencySymbols,
  TranslatorLanguage,
  TranslatorLanguages,
  onSystemConfigurationChange,
  systemConfigurationSections,
  tSystemEnvironmentConfig,
} from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { SimpleStyledSelect } from 'components/Commons'
import React from 'react'
import { trlb } from 'utilities'

interface IEnviromentConfigurationsFieldsProps {
  fields: tSystemEnvironmentConfig
  onChange: onSystemConfigurationChange
}

const getTranslationValue = (translation: TranslatorLanguage) => `${translation}`
const getTranslationLabel = (translation: TranslatorLanguage) => {
  const key = `systemConfiguration_environmentConfigurations_${translation}`

  return trlb(key)
}

const getCurrencyValue = (currency: CurrencySymbol) => `${currency}`
const getCurrencyLabel = (currency: CurrencySymbol) => {
  const key = `systemConfiguration_environmentConfigurations_${currency}`

  return trlb(key)
}

const EnviromentConfigurationsFields: React.FC<IEnviromentConfigurationsFieldsProps> = ({
  fields,
  onChange
}) => {
  const changeLanguage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = event.target.value as TranslatorLanguage
    const updatedConfig: tSystemEnvironmentConfig = { ...fields, language: updatedValue }

    onChange(systemConfigurationSections.ENVIRONMENT_CONFIG, null, updatedConfig)
  }

  const changeCurrency = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = event.target.value as CurrencySymbol
    const updatedConfig: tSystemEnvironmentConfig = { ...fields, currency: updatedValue }

    onChange(systemConfigurationSections.ENVIRONMENT_CONFIG, null, updatedConfig)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
        alignItems: 'center',
        pt: 8,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>{trlb('systemConfiguration_language_label')}</Typography>
        <SimpleStyledSelect<TranslatorLanguage>
          value={fields?.language}
          changeFun={changeLanguage}
          getValueFun={getTranslationValue}
          getLabelFun={getTranslationLabel}
          menuItems={Object.values(TranslatorLanguages) as TranslatorLanguage[]}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>{trlb('systemConfiguration_currency_label')}</Typography>
        <SimpleStyledSelect<CurrencySymbol>
          value={fields?.currency}
          changeFun={changeCurrency}
          getValueFun={getCurrencyValue}
          getLabelFun={getCurrencyLabel}
          menuItems={Object.values(CurrencySymbols) as CurrencySymbol[]}
        />
      </Box>
    </Box>
  )
}

export default EnviromentConfigurationsFields
