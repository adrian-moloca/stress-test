import React from 'react'
import { TextIconButton } from 'components/Buttons'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import { FlexDataTable } from '../../../components/FlexCommons'
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { getFieldFormPath, getFieldValue, trlb } from 'utilities'
import { FormikProps } from 'formik'
import { WarningIcon } from 'components/Icons'
import SectionWrapper from 'components/materials/SectionWrapper'
import { useGetScreenSize } from 'hooks/uiHooks'
import { TextFieldWithControlledInput, NumericTextField } from 'components/Commons'
import TimestampPicker from 'pages/CaseDetails/components/TimestampPicker'
import CellAlignWrapper from 'components/CellAlignWrapper'
import {
  OPSectionIsValid,
  getColumnFieldHasError,
  getColumnFieldHelperText,
  getColumnFieldIsDisabled,
  getFormFieldErrors,
  getItemId,
  hasBillingErrors,
  isWarnableField
} from 'utilities/cases-opstandards'
import { MUIAutoCompleteSpaceFixer } from 'utilities/misc'

const HIDE_SIDEBAR_RESOLUTION = import.meta.env.VITE_HIDE_SIDEBAR_RESOLUTION

const OpStandardTable = ({
  columns,
  rows,
  edit,
  deleteRows,
  addRow,
  addRowText,
  form,
  formPath,
  title,
  noAddButtonOnEmpty,
  warningFields,
  section,
  showDocumentationWarnings,
  showBillingWarning,
}: {
  columns: any[]
  rows: any[]
  edit: boolean
  deleteRows: (indexes: number[]) => void
  addRow: () => void
  addRowText: string
  form: FormikProps<any>
  formPath: string
  title: string
  noAddButtonOnEmpty?: boolean
  warningFields?: string[]
  section?: string
  showDocumentationWarnings?: boolean
  showBillingWarning?: boolean
}) => {
  const [selectionModel, setSelectionModel] = React.useState<number[]>([])
  const rowsWithId = React.useMemo(
    () =>
      rows.reduce(
        (acc, row, index) => ({
          ...acc,
          [`${index}/${rows.length}`]: { ...row, index, id: `${index}/${rows.length}` },
        }),
        {},
      ),
    [rows],
  )
  const rowsWithIdList = React.useMemo(() => Object.values(rowsWithId), [rowsWithId])
  const { width } = useGetScreenSize()

  const removeSelectedRows = () => {
    const indexes = selectionModel.map(id => rowsWithId[id].index)
    deleteRows(indexes)
    setSelectionModel([])
  }

  const getWarningIcon = (hasDocumentalWarning: boolean, hasBillingWarning: boolean) => {
    if (hasDocumentalWarning && hasBillingWarning)
      return (<>
        <svg width={0} height={0}>
          <linearGradient id='linearColors' gradientTransform='rotate(45)'>
            <stop offset='70%' stopColor='#ed6c02' />
            <stop offset='100%' stopColor='#d32f2f' />
          </linearGradient>
        </svg>
        <WarningIcon sx={{ fill: 'url(#linearColors)' }} />
      </>)

    if (hasBillingWarning)
      return (
        <WarningIcon variant='warning' />
      )

    return (
      <WarningIcon />
    )
  }

  const parsedColumns = React.useMemo(
    () =>
      columns.map(column => ({
        ...column,
        headerName: (
          <Typography variant='body1' sx={{ fontWeight: 600 }}>
            {trlb(column.headerName)}
          </Typography>
        ),
        renderCell: ({ row, id }: { row: any; id: number }) => {
          const index = rowsWithId[id].index
          const fieldPath = getFieldFormPath(formPath, column.field, index)

          const setFieldValue = (value: string | number | boolean | Date | null) => {
            if (column.onChange) {
              column.onChange(value, index)
            } else {
              let parsedValue = column.parseValue?.(value) ?? value
              if (column.type === 'number') parsedValue = isNaN(Number(parsedValue)) ? '' : Number(parsedValue)
              form.setFieldValue(fieldPath, parsedValue)
            }
          }
          const fieldError = getFormFieldErrors(form, fieldPath)

          const error = getColumnFieldHasError(column, row, fieldError)
          const helperText = getColumnFieldHelperText(column, row, fieldError)

          const disabled = getColumnFieldIsDisabled(column, row, edit)

          const currentItem = rowsWithId[id]
          const itemId = getItemId(currentItem)

          const hasZeroAmount = currentItem.amount === 0
          const fieldWithBillingWarning = hasBillingErrors(warningFields, `${section}.${itemId}.${column.field}`, true)

          const hasBillingWarning = (showBillingWarning &&
            (fieldWithBillingWarning || hasZeroAmount)) ||
            false
          const hasDocumentalWarning = (showDocumentationWarnings && hasZeroAmount) || false

          const isWarnable = isWarnableField(column.field)
          const hasAnyWarning = hasDocumentalWarning || hasBillingWarning

          const showWarning = isWarnable && hasAnyWarning

          const toolTipKey = hasBillingWarning ? 'case_tab_billing_field_necessary_for_billing' : 'commons_generic_required_value'
          const toolTip = trlb(toolTipKey)
          const helperTextLabel = trlb(helperText)

          switch (column.type) {
            case 'number':
              return (
                <CellAlignWrapper>
                  <NumericTextField
                    value={getFieldValue(form, fieldPath)}
                    error={error}
                    helperText={helperTextLabel}
                    // eslint-disable-next-line max-len
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue(e.target.value)}
                    InputProps={{
                      readOnly: !edit,
                      endAdornment: showWarning && (
                        <InputAdornment position='end'>
                          <Tooltip title={toolTip} enterTouchDelay={0}>
                            <IconButton sx={{ padding: 0 }}>
                              {getWarningIcon(hasDocumentalWarning, hasBillingWarning)}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    onBlur={() => form.setFieldTouched(fieldPath, true)}
                    fullWidth
                    variant='outlined'
                    disabled={disabled}
                    positiveOnly
                    color={showWarning ? 'warning' : 'primary'}
                  />
                </CellAlignWrapper>
              )

            case 'text':
              return (
                <CellAlignWrapper>
                  <TextFieldWithControlledInput
                    sourceValue={getFieldValue(form, fieldPath) ?? ''}
                    error={error}
                    helperText={trlb(helperText)}
                    remoteOnChange={setFieldValue}
                    inputProps={{ readOnly: !edit }}
                    remoteOnBlur={() => form.setFieldTouched(fieldPath, true)}
                    fullWidth
                    variant='outlined'
                    disabled={disabled}
                    type={column.type}
                    onKeyDown={e => {
                      e.stopPropagation()
                    }}
                  />
                </CellAlignWrapper>
              )

            case 'boolean':
              return (
                <CellAlignWrapper>
                  <FormControl error={error} sx={{ position: 'relative', alignItems: 'center' }}>
                    <Checkbox
                      sx={{ fill: '#fff' }}
                      checked={getFieldValue(form, fieldPath) ?? false}
                      onChange={() => edit &&
                        setFieldValue(!(getFieldValue(form, fieldPath) ?? false))}
                      disabled={disabled}
                    />
                    {showDocumentationWarnings && (
                      <FormHelperText sx={{ m: 0, position: 'absolute', bottom: -8 }}>{trlb(helperText)}</FormHelperText>
                    )}
                  </FormControl>
                </CellAlignWrapper>
              )

            case 'autocomplete':
              const options = column.getOptions?.(row) ?? column.options
              const getOptionLabel = (option: any) =>
                column.getOptionLabel?.(option) ??
                (option.value
                  ? `${option.value} - ${option?.label ?? ''}`
                  : `${option} - ${trlb('opStandardTable_missing_material')}`)

              return (
                <CellAlignWrapper>
                  <Autocomplete
                    options={options}
                    renderInput={params => (
                      <TextField {...params}
                        onKeyDown={MUIAutoCompleteSpaceFixer}
                        error={error} helperText={trlb(helperText)} variant='outlined' />
                    )}
                    value={
                      options.find((option: any) => option?.value === row?.[column.field]) ||
                      row?.[column.field] ||
                      undefined
                    }
                    onChange={(_e, v) => setFieldValue(v?.value ?? '')}
                    onBlur={() => form.setFieldTouched(fieldPath)}
                    getOptionLabel={getOptionLabel}
                    disabled={disabled}
                    fullWidth
                    renderOption={(props, item) => (
                      <li {...props} key={item.key ?? item.value}>
                        {getOptionLabel(item)}
                      </li>
                    )}
                  />
                </CellAlignWrapper>
              )

            case 'dateTime':
              return (
                <TimestampPicker
                  value={getFieldValue(form, fieldPath) ?? null}
                  onChange={(newValue: Date | null) => setFieldValue(newValue)}
                  label={trlb(column.headerName)}
                  disabled={!edit}
                />
              )

            default:
              return (
                <CellAlignWrapper
                  sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'start',
                    marginTop: '-5px'
                  }}
                >
                  {column.valueGetter({ row })}
                </CellAlignWrapper>
              )
          }
        },
        sortable: false,
        filterable: false,
      })),
    [columns],
  )

  if (rowsWithIdList.length === 0 && (!edit || noAddButtonOnEmpty)) return null

  if (rowsWithIdList.length === 0)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 2,
          p: 0.5,
          my: 1,
          bgcolor: 'primary.light',
          borderRadius: theme => theme.constants.radius,
        }}
      >
        {edit && (
          <TextIconButton
            icon={<AddIcon sx={{ mr: 2 }} />}
            onClick={addRow}
            text={trlb(addRowText)}
            variant='outlined'
          />
        )
        }
      </Box>
    )

  const sectionIsValid = OPSectionIsValid(form, formPath, true)
  const hasError = showDocumentationWarnings && !sectionIsValid
  const hasBillingWarning = hasBillingErrors(warningFields, formPath, false)

  const getTitleIcon = () => {
    if (!edit)
      return null

    const anySelected = selectionModel.length > 0
    const clickFun = anySelected ? removeSelectedRows : addRow
    const IconComponent = anySelected ? RemoveIcon : AddIcon

    return (
      <IconButton size='small' onClick={clickFun}>
        {hasError && <WarningIcon />}
        {hasBillingWarning && <WarningIcon variant='warning' />}
        <IconComponent sx={{ marginLeft: 1, marginRight: -2 }} />
      </IconButton>
    )
  }

  return (
    <SectionWrapper title={title} titleIcon={getTitleIcon()}>
      <FlexDataTable
        columns={parsedColumns}
        rows={rowsWithIdList}
        onSelectionModelChange={setSelectionModel}
        selectionModel={selectionModel}
        checkboxSelection={edit}
        rowHeight={120}
        showToolbar={edit}
        disableSelectionOnClick
        autoHeight
        rowsPerPageOptions={[10]}
        initialState={{
          pagination: {
            pageSize: 10,
          },
        }}
        sx={{
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-cell': {
            padding: width < HIDE_SIDEBAR_RESOLUTION ? '1px' : undefined,
            position: 'relative'
          },
          '& .MuiFormHelperText-root': {
            marginX: 0,
            whiteSpace: 'wrap'
          },
          border: 'hidden',
        }}
      />
    </SectionWrapper>
  )
}

export default OpStandardTable
