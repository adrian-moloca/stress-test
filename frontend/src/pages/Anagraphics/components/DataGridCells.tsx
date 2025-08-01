import { IAnagraphicField, IAnagraphicRow, dataGridPreventedKeys, dataGridTrueValues } from '@smambu/lib.constants'
import { Checkbox, FormControl, FormHelperText, IconButton, TextField } from '@mui/material'
import { MobileDatePicker } from '@mui/x-date-pickers'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'
import AddressCell from './AddressCell'
import { Delete } from '@mui/icons-material'
import { NumericTextField } from 'components/Commons'

const DataCellSelector = ({
  field,
  params,
  form,
  edit,
  onEdit,
  disableSave,
  disabled,
  rowsWithDuplicateKeys,
  fieldKeys,
}: {
  field: IAnagraphicField
  params: any
  label?: string
  form: FormikProps<IAnagraphicRow[]>
  edit: boolean
  onEdit: ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => void
  disableSave: (status: boolean) => void
  disabled?: boolean
  rowsWithDuplicateKeys: string[]
  fieldKeys: string[]
}) => {
  const error =
    field.isKey &&
      rowsWithDuplicateKeys.includes(params.row.key) &&
      fieldKeys.some(key => params.row[key] != null)
      ? 'anagraphics_duplicate_key_error'
      : form.errors[params.row.id]?.[field.name]

  switch (field.type) {
    case 'date':
      return (
        <DateCell
          field={field}
          params={params}
          edit={edit}
          onEdit={onEdit}
          disableSave={disableSave}
          disabled={disabled}
        />
      )

    case 'string':
    case 'number':
    case 'price':
      return (
        <TextCell
          field={field}
          params={params}
          edit={edit}
          onEdit={onEdit}
          disableSave={disableSave}
          error={error}
          disabled={disabled}
        />
      )

    case 'address':
      return (
        <AddressCell
          field={field}
          params={params}
          edit={edit}
          onEdit={onEdit}
          disableSave={disableSave}
          readOnly={disabled}
        />
      )

    case 'boolean':
      return (
        <BooleanCell
          field={field}
          params={params}
          edit={edit}
          onEdit={onEdit}
          disableSave={disableSave}
          error={error}
          disabled={disabled}
        />
      )

    default:
      return <p>{String(params?.value ?? '')}</p>
  }
}

const BooleanCell = ({
  field,
  params,
  edit,
  onEdit,
  disableSave,
  error,
  disabled,
}: {
  field: IAnagraphicField
  params?: any
  label?: string
  edit: boolean
  onEdit: ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => void
  disableSave: (status: boolean) => void
  error?: string
  disabled?: boolean
}) => {
  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    disableSave(true)
    await onEdit({ name: field.name, value: event.target.checked, rowKey: params.row.key })
    disableSave(false)
  }

  return (
    <FormControl error={!!error}>
      <Checkbox
        disabled={disabled || !edit || field.readonly}
        checked={dataGridTrueValues.includes(params?.value)}
        onChange={onChange}
      />
      <FormHelperText>{trlb(error ?? '')}</FormHelperText>
    </FormControl>
  )
}

const DateCell = ({
  field,
  params,
  edit,
  onEdit,
  disableSave,
  disabled,
}: {
  field: IAnagraphicField
  params?: any
  label?: string
  edit: boolean
  onEdit: ({ name, value, rowKey }: { name: string; value: Date | null; rowKey: string }) => void
  disableSave: (status: boolean) => void
  disabled?: boolean
}) => {
  const [value, setValue] = React.useState<Date | null>(params?.value ?? null)
  const [forceDisabled, setForceDisabled] = React.useState(false)
  const cellDisabled = disabled || !edit || field.readonly || forceDisabled

  React.useEffect(() => {
    setValue(params?.value ?? null)
  }, [params?.value])

  const onChange = async (value: Date | null) => {
    if (value !== params?.value) {
      disableSave(true)
      setForceDisabled(true)
      setValue(value)
      await onEdit({ name: field.name, value, rowKey: params.row.key })
      setForceDisabled(false)
      disableSave(false)
    }
  }

  return (
    <MobileDatePicker
      inputFormat={trlb('dateTime_date_string')}
      disabled={cellDisabled}
      value={value || null}
      onChange={onChange}
      renderInput={params => (
        <TextField
          {...params}
          inputProps={{
            ...(params.inputProps ?? {}),
            style: {
              ...(params.inputProps?.style ?? {}),
              WebkitTextFillColor: 'black',
              backgroundColor: 'unset',
            },
          }}
          InputLabelProps={{
            ...(params.InputLabelProps ?? {}),
            shrink: true,
          }}
          InputProps={{
            ...(params.InputProps ?? {}),
            disableUnderline: disabled,
          }}
          variant='standard'
          onKeyDown={event => {
            if (dataGridPreventedKeys.includes(event.key)) event.stopPropagation()
          }}
        />
      )}
    />
  )
}

const TextCell = ({
  field,
  params,
  edit,
  onEdit,
  disableSave,
  error,
  disabled,
}: {
  field: IAnagraphicField
  params?: any
  label?: string
  edit: boolean
  onEdit: ({ name, value, rowKey }: { name: string; value: string; rowKey: string }) => void
  disableSave: (status: boolean) => void
  error?: string
  disabled?: boolean
}) => {
  const [value, setValue] = React.useState<string>(params?.value ?? '')
  const [forceDisabled, setForceDisabled] = React.useState(false)
  const cellDisabled = disabled || !edit || field.readonly || forceDisabled

  React.useEffect(() => {
    setValue(params?.value)
  }, [params?.value])

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    disableSave(true)
    setValue(event.target.value)
  }

  const onBlur = async () => {
    if (value !== params?.value) {
      setForceDisabled(true)
      await onEdit({ name: field.name, value, rowKey: params.row.key })
      setForceDisabled(false)
      disableSave(false)
    }
  }

  if (field.type === 'string')
    return (
      <TextField
        disabled={cellDisabled}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        variant='standard'
        error={Boolean(error)}
        helperText={trlb(error ?? '')}
        inputProps={{
          style: {
            WebkitTextFillColor: 'black',
            backgroundColor: 'unset',
          },
        }}
        InputProps={{
          disableUnderline: disabled,
        }}
        onKeyDown={event => {
          if (dataGridPreventedKeys.includes(event.key)) event.stopPropagation()
        }}
      />
    )

  const isPrice = field.type === 'price'
  const positiveOnly = field.type === 'number'

  return (
    <NumericTextField
      disabled={cellDisabled}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      variant='standard'
      error={Boolean(error)}
      helperText={trlb(error ?? '')}
      onKeyDown={event => {
        if (dataGridPreventedKeys.includes(event.key)) event.stopPropagation()
      }}
      isPrice={isPrice}
      positiveOnly={positiveOnly}
    />
  )
}

export const DeleteCell = ({
  edit,
  rowKey,
  deleteNewLine,
  isNewRow,
  disabled,
}: {
  edit: boolean
  rowKey: string
  deleteNewLine: (rowKey: string) => void
  isNewRow: boolean
  disabled?: boolean
}) => {
  if (!edit || !isNewRow) return null
  return (
    <IconButton onClick={() => deleteNewLine(rowKey)} disabled={disabled}>
      <Delete />
    </IconButton>
  )
}

export default DataCellSelector
