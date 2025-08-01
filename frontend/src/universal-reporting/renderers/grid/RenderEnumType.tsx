import { Autocomplete, TextField, Tooltip } from '@mui/material'
import React, { useCallback, useMemo } from 'react'
import { useFieldLogic } from './hooks'
import { tRenderer } from '../types'

type tEnumOption = {
  $value: string
  $label: string
} | string

const isEqual = (option: tEnumOption, value: tEnumOption) => {
  const id1 = typeof option === 'object' ? option.$value : option
  const id2 = typeof value === 'object' ? value.$value : value

  return id1 === id2
}

/*
This may need a review to better align it with the other renderers and better deal with high numbers of options
All details here: https://github.com/ambuflow/smambu/issues/1385
 */
export const RenderEnumType: tRenderer<'enum'> = inputProps => {
  const { value, fieldRepresentation, editable, locale, update, path } = inputProps
  const { componentData, setComponentData } =
  useFieldLogic({ data: value, fieldRepresentation, update, path })

  const [inputValue, setInputValue] = React.useState('')
  const options = useMemo(
    () => fieldRepresentation.viewAs.labelField || [],
    [fieldRepresentation.viewAs.labelField]
  )
  // todo: improve the logic to detect if it's an array of objects or an array of strings
  const isObject = typeof options[0] === 'object'

  const getLabel = useCallback((option: tEnumOption) => {
    if (typeof option === 'object')
      return option.$label
    if (isObject) {
      const o = options.find(opt => opt.$value === option)
      return o?.$label
    } else { return option }
  }, [isObject, options])

  const objValue = useMemo(() => {
    let val = componentData
    if (isObject)
      val = options.find(opt => opt.$value === componentData)

    return val === undefined ? null : val
  }, [options, isObject, componentData])

  return <Tooltip title={fieldRepresentation.description[locale]}>
    <Autocomplete
      value={objValue}
      onChange={(_event: any, newValue) => {
        setComponentData(typeof newValue === 'object' && newValue ? newValue.$value : newValue)
      }}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      isOptionEqualToValue={isEqual}
      getOptionLabel={getLabel}
      options={options}
      disabled={!editable}
      renderInput={params => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          label={fieldRepresentation.label[locale]}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  </Tooltip>
}
