import React from 'react'
import { NumericFormat } from 'react-number-format'
import { InputBaseComponentProps } from '@mui/material'
import { PREFERRED_LOCALE, TranslatorLanguages, allowedDecimalSeparators } from '@smambu/lib.constants'
import { useAppSelector } from 'store'

interface INumericFieldProps extends InputBaseComponentProps {
  positiveOnly?: boolean
  isPrice?: boolean
  negativePrice?: boolean
  noDecimalLimit?: boolean
}

const NumericField: React.FC<INumericFieldProps> = props => {
  const currencySymbol = useAppSelector(state => state.global.currencySymbol)
  const { positiveOnly, isPrice, negativePrice, noDecimalLimit, onChange, ...other } = props

  const preferredLanguage = sessionStorage.getItem(PREFERRED_LOCALE) ?? TranslatorLanguages.en

  const decimalSeparator = Number(1.1).toLocaleString(preferredLanguage)
    .charAt(1)

  const allowNegative = negativePrice || (!isPrice && !positiveOnly)

  let decimalScale
  if (noDecimalLimit) decimalScale = undefined
  else decimalScale = isPrice ? 2 : 0

  const fixedDecimalScale = isPrice && !noDecimalLimit
  // this library has currently a type bug, that causes a false type mismatch
  // see this issue for more info
  // https://github.com/s-yadav/react-number-format/issues/726
  // when this is fixed, we can remove the ! operator and the ts-ignore
  return (
    // @ts-expect-error see comment above
    <NumericFormat
      {...other}
      onValueChange={values => {
        onChange!({
          target: {
            // @ts-expect-error see comment above
            name: props.name,
            value: values.floatValue,
          },
        })
      }}
      allowedDecimalSeparators={allowedDecimalSeparators}
      decimalSeparator={decimalSeparator}
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      prefix={isPrice ? `${currencySymbol} ` : ''}
      allowNegative={allowNegative}
    />
  )
}

export default NumericField
