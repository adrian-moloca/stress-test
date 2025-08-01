import React, { ReactNode, SyntheticEvent, useEffect, useState } from 'react'
import {
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Typography,
  InputLabel,
  Select,
  Stack,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  InputAdornment,
  useTheme,
  IconButton,
  Toolbar,
  TextFieldProps,
  SelectProps,
  AutocompleteChangeReason,
  AutocompleteChangeDetails,
  FormControlLabelProps,
} from '@mui/material'
import { BackButton } from './Buttons'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloseIcon from '@mui/icons-material/Close'
import { trlb } from 'utilities/translator/translator'
import {
  DatePicker,
  DatePickerProps,
  PickersDay,
  PickersDayProps,
  StaticDatePicker,
  StaticDatePickerProps,
  TimePickerProps,
  MobileTimePicker,
} from '@mui/x-date-pickers'
import { endOfDay, format, isAfter, isBefore, isSameDay, isValid, startOfDay } from 'date-fns'
import { ampmEnabled, validateInsertedDate } from '@smambu/lib.constants'
import { FormikErrors, FormikProps, FormikTouched } from 'formik'
import TimestampPicker from 'pages/CaseDetails/components/TimestampPicker'
import { Clear } from '@mui/icons-material'
import { defaultStyles } from 'ThemeProvider'
import { WarningIcon } from './Icons'
import { useGetScreenSize } from 'hooks/uiHooks'
import NumericField from './NumericField'
import { MUIAutoCompleteSpaceFixer } from 'utilities/misc'

const HIDE_SIDEBAR_RESOLUTION = import.meta.env.VITE_HIDE_SIDEBAR_RESOLUTION

interface ContainerProps {
  children: ReactNode | ReactNode[]
  sx?: any
}

export const PageContainer = ({ children, sx }: ContainerProps) => {
  const { width } = useGetScreenSize()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: width < HIDE_SIDEBAR_RESOLUTION ? 1 : 4, ...(sx ?? {}) }}>
      {children}
    </Box>
  )
}

interface FormContainerProps extends ContainerProps {
  onSubmit: () => void
}

export const FormContainer = ({ children, onSubmit }: FormContainerProps) => {
  return (
    <form onSubmit={onSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 4 }}>{children}</Box>
    </form>
  )
}

export const Panel = ({ children, sx }: any) => {
  return (
    <Box
      sx={{
        backgroundColor: theme => theme.palette.panel.main,
        p: 3,
        borderRadius: theme => theme.constants.radius,
        width: '100%',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export interface AccordionContainerProps {
  text?: string
  background?: string
  accordionContent: React.ReactNode
  conditionalRendering?: boolean
  error?: boolean
}

export const AccordionContainer = ({
  text,
  accordionContent,
  background,
  conditionalRendering,
  error,
}: AccordionContainerProps) => {
  const [expanded, setExpanded] = React.useState<boolean>(false)
  const theme = useTheme()
  return (
    <Accordion
      elevation={0}
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        border: '1px solid lightGrey',
        margin: '10px 0px',
        borderRadius: theme => theme.constants.radius,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {error ? <WarningIcon sx={{ mr: 1 }} /> : null}
          <SectionSubtitle text={text || ''} sx={{ margin: 0, width: 'fit-content' }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          background: background || theme.palette.background.default,
          paddingTop: '20px',
          paddingBottom: '20px',
        }}
      >
        <Stack sx={{ alignItems: 'center' }}>{expanded || !conditionalRendering ? accordionContent : null}</Stack>
      </AccordionDetails>
    </Accordion>
  )
}

export const PageHeader = ({
  showBackButton,
  pageTitle,
  children,
  button,
  toolbarSx,
  backButtonSx,
  pageTitleSx,
  titleTypographySx,
}: any) => {
  return (
    <Toolbar
      disableGutters
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'transparent',
        backdropFilter: 'blur(6px)',
        zIndex: 1200,
        py: 3,
        mb: 0,
        flexShrink: 0,
        flexBasis: 0,
        flexGrow: 0,
        boxSizing: 'border-box',
        ...(toolbarSx ?? {}),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexBasis: 0,
          flexGrow: 1,
          ...(backButtonSx ?? {}),
        }}
      >
        {showBackButton ? <BackButton edit={false} setEdit={() => { }} /> : <Box />}
      </Box>
      {pageTitle
        ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexBasis: 0,
              flexGrow: 1,
              ...(pageTitleSx ?? {}),
            }}
          >
            <Typography
              variant='h4'
              sx={{
                fontWeight: 600,
                width: '100%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                ...(titleTypographySx ?? {}),
              }}
            >
              {pageTitle}
            </Typography>
          </Box>
        )
        : null}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexBasis: 0,
          flexGrow: 1,
          justifyContent: 'flex-end',
        }}
      >
        {children}
        {button}
      </Box>
    </Toolbar>
  )
}

export const SectionTitle = ({ text, margin, sx }: any) => {
  return (
    <Typography
      variant='h6'
      sx={{
        width: '100%',
        textAlign: 'center',
        m: margin || 'inherit',
        mt: 2,
        mb: 0,
        ...(sx ?? {}),
      }}
    >
      {text}
    </Typography>
  )
}
export const SectionSubtitle = ({
  text,
  margin,
  sx
}: { text: string;
  margin?: string; sx?: any }) => {
  return (
    <Typography
      variant='body1'
      sx={{
        width: '100%',
        textAlign: 'center',
        margin: margin ? { margin } : '20px 0px 10px 0px',
        fontWeight: '600',
        ...(sx ?? {}),
      }}
    >
      {text}
    </Typography>
  )
}

export type GridTextFieldProps = TextFieldProps & {
  xs: number
  searchIcon?: boolean
  warning?: string
  error?: string
}

export const GridTextField = ({
  xs,
  label,
  value,
  error,
  searchIcon,
  warning, ...props
}: GridTextFieldProps) => {
  return (
    <Grid item xs={xs} sx={{ display: 'flex', flexDirection: 'column' }}>
      <TextField
        label={label}
        variant='outlined'
        sx={{ width: '100%' }}
        value={value}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: searchIcon
            ? (
              <InputAdornment position='start'>
                <IconButton edge='start'>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
            : null,
        }}
        {...props}
      />
      <Box
        sx={{
          paddingLeft: '14px',
        }}
      >
        {warning && (
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        )}
      </Box>
    </Grid>
  )
}

export type NumericTextFieldProps = TextFieldProps & {
  positiveOnly?: boolean
  negativePrice?: boolean
  isPrice?: boolean
  noDecimalLimit?: boolean
}

export const NumericTextField = ({
  label,
  value,
  error,
  positiveOnly,
  isPrice,
  negativePrice,
  noDecimalLimit,
  ...props
}: NumericTextFieldProps) => {
  return (
    <TextField
      label={label}
      value={value}
      error={!!error}
      helperText={error}
      {...props}
      InputProps={{
        ...{
          inputComponent: NumericField,
          inputProps: { positiveOnly, isPrice, negativePrice, noDecimalLimit, ...props.inputProps },
        },
        ...props.InputProps,
      }}
    />
  )
}

export type ControlledInputsTextFieldProps = TextFieldProps & {
  sourceValue: string
  remoteOnChange: (value: string) => void
  remoteOnBlur: () => void
}

export const TextFieldWithControlledInput = ({
  sourceValue,
  remoteOnChange,
  remoteOnBlur,
  ...props
}: ControlledInputsTextFieldProps) => {
  const [value, setValue] = useState(sourceValue)

  useEffect(() => {
    setValue(sourceValue)
  }, [sourceValue])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)

  const localOnBlur = async () => {
    await remoteOnChange(value)

    remoteOnBlur()
  }

  return <TextField value={value} onChange={onChange} onBlur={localOnBlur} {...props} />
}

export type GridNumericFieldProps = TextFieldProps & {
  xs?: number
  md?: number
  lg?: number
  xl?: number
  positiveOnly?: boolean
  negativePrice?: boolean
  isPrice?: boolean
  noDecimalLimit?: boolean
  warning?: string
}

export const GridNumericField = ({
  xs,
  md,
  lg,
  xl,
  label,
  value,
  error,
  positiveOnly,
  negativePrice,
  isPrice,
  noDecimalLimit,
  warning,
  ...props
}: GridNumericFieldProps) => {
  return (
    <Grid item xs={xs} md={md} lg={lg} xl={xl} sx={{ display: 'flex', flexDirection: 'column' }}>
      <NumericTextField
        label={label}
        variant='outlined'
        sx={{ width: '100%' }}
        value={value}
        error={!!error}
        helperText={error}
        positiveOnly={positiveOnly}
        negativePrice={negativePrice}
        isPrice={isPrice}
        noDecimalLimit={noDecimalLimit}
        {...props}
      />
      <Box
        sx={{
          paddingLeft: '14px',
        }}
      >
        {warning && (
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        )}
      </Box>
    </Grid>
  )
}

export const FormikGridTextField = ({
  xs,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  warning,
  helperText,
  onChange,
  ...props
}: {
  xs: number
  label: string
  values: any
  form: any
  section?: string
  touched?: any
  errors?: any
  name: string
  warning?: string
  helperText?: string
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  inputProps?: TextFieldProps['inputProps']
  multiline?: boolean
  fullWidth?: boolean
}) => {
  return (
    <Grid item xs={xs} sx={{ display: 'flex', flexDirection: 'column' }}>
      <TextField
        label={label}
        variant='outlined'
        sx={{ width: '100%' }}
        name={section ? section + '.' + name : name}
        value={values?.[name] ?? ''}
        onChange={onChange ?? form.handleChange}
        onBlur={form.handleBlur}
        error={Boolean(errors?.[name] && touched?.[name])}
        helperText={touched?.[name] && errors?.[name] ? errors[name] : helperText ?? ''}
        {...props}
      />
      {warning && (
        <Box
          sx={{
            paddingLeft: '14px',
          }}
        >
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        </Box>
      )}
    </Grid>
  )
}

export const FormikGridNumberField = ({
  xs,
  md,
  lg,
  xl,
  positiveOnly,
  negativePrice,
  isPrice,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  warning,
  helperText,
  ...props
}: {
  xs?: number
  md?: number
  lg?: number
  xl?: number
  positiveOnly?: boolean
  negativePrice?: boolean
  isPrice?: boolean
  label: string
  values: any
  form: any
  section?: string
  touched?: any
  errors?: any
  name: string
  warning?: string
  helperText?: string
}) => {
  return (
    <Grid item xs={xs} md={md} lg={lg} xl={xl} sx={{ display: 'flex', flexDirection: 'column' }}>
      <NumericTextField
        label={label}
        variant='outlined'
        sx={{ width: '100%' }}
        name={section ? section + '.' + name : name}
        value={values?.[name] ?? ''}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={Boolean(errors?.[name] && touched?.[name])}
        helperText={touched?.[name] && errors?.[name] ? errors[name] : helperText ?? ''}
        positiveOnly={positiveOnly}
        isPrice={isPrice}
        negativePrice={negativePrice}
        {...props}
      />
      {warning && (
        <Box
          sx={{
            paddingLeft: '14px',
          }}
        >
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        </Box>
      )}
    </Grid>
  )
}

type FormikGridSelectProps = Omit<TextFieldProps, 'variant'> & {
  xs?: number
  label: string
  form: FormikProps<any>
  section: string
  touched?: FormikTouched<any>
  errors?: FormikErrors<any>
  name: string
  menuItems: { label: string; value: string | number }[]
  values: Record<string, any>
  warning?: string
}

export const FormikGridSelect: React.FC<FormikGridSelectProps> = ({
  xs,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  menuItems,
  helperText,
  warning,
  ...props
}) => {
  return (
    <Grid container item xs={xs} sx={{ display: 'flex', justifyContent: 'center' }}>
      <TextField
        label={label}
        select
        variant='outlined'
        sx={{ width: '100%' }}
        name={section ? section + '.' + name : name}
        value={values[name]}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={Boolean(errors?.[name] && touched?.[name])}
        helperText={touched?.[name] && errors?.[name]
          ? trlb(errors?.[name] as string)
          : helperText ?? null}
        SelectProps={{
          MenuProps: defaultStyles.MenuProps,
        }}
        {...props}
      >
        {menuItems?.map(menuItem => (
          <MenuItem value={menuItem.value} key={menuItem.value} sx={defaultStyles.MenuItemSx}>
            {trlb(menuItem.label)}
          </MenuItem>
        ))}
      </TextField>
      {warning && (
        <Box
          sx={{
            paddingLeft: '14px',
          }}
        >
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        </Box>
      )}
    </Grid>
  )
}

type GridSelectProps = SelectProps & {
  xs: number
  label?: string
  name: string
  menuItems: { label: string; value: string | number }[]
  background?: string
  helperText?: string
  value?: string | number
}

export const GridSelect: React.FC<GridSelectProps> = ({
  xs,
  label,
  menuItems,
  value,
  onChange,
  background,
  helperText,
  disabled = false,
  ...props
}) => {
  return (
    <Grid container item xs={xs} sx={{ display: 'flex', justifyContent: 'center' }}>
      <FormControl sx={{ width: '100%' }} disabled={disabled} error={props.error}>
        <InputLabel>{label}</InputLabel>
        <Select
          sx={{ background: background || null }}
          id={label}
          label={label}
          value={value}
          onChange={onChange}
          MenuProps={defaultStyles.MenuProps}
          {...props}
        >
          {menuItems.map(menuItem => {
            return (
              <MenuItem
                value={menuItem.value}
                key={menuItem.value}
                style={{ display: value === menuItem.value ? 'none' : 'block' }}
                sx={defaultStyles.MenuItemSx}
              >
                {menuItem.label}
              </MenuItem>
            )
          })}
        </Select>
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
    </Grid>
  )
}

type GridAutocompleteProps = TextFieldProps & {
  xs: number
  label: string
  options: any[]
  searchIcon?: boolean
  selected?: string | number | { label: string; value: string | number } | null
  getOptionLabel?: (option: any) => string
  onSelectValue?: (
    e: SyntheticEvent<Element, Event>,
    value: any,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<any>,
  ) => void
  disabled?: boolean
  warning?: string
  disableClearable?: boolean
}

export const GridAutocomplete: React.FC<GridAutocompleteProps> = ({
  onSelectValue,
  xs,
  label,
  options,
  selected,
  searchIcon,
  getOptionLabel,
  disabled,
  warning,
  disableClearable,
  ...props
}) => {
  return (
    <Grid item xs={xs} sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
      <Autocomplete
        id='combo-box'
        options={options}
        renderInput={(params: any) => <TextField {...params} label={label} {...props} />}
        sx={{ width: '100%' }}
        popupIcon={searchIcon ? <SearchIcon /> : <ArrowDropDownIcon />}
        value={selected}
        getOptionLabel={getOptionLabel}
        onChange={onSelectValue}
        disabled={disabled}
        disableClearable={disableClearable}
        onKeyDown={MUIAutoCompleteSpaceFixer}
      />
      {warning && (
        <Box
          sx={{
            paddingLeft: '14px',
          }}
        >
          <Typography variant='caption' sx={{ color: 'error.main' }}>
            {warning}
          </Typography>
        </Box>
      )}
    </Grid>
  )
}
export const FormikGridAutocomplete = ({
  xs,
  label,
  options,
  searchIcon,
  values,
  form,
  section,
  touched,
  errors,
  name,
  warning,
  disableClearable,
  onSelectValue,
  disabled,
  ...props
}: {
  xs: number
  label: string
  options: any[]
  searchIcon?: boolean
  values: any
  form: FormikProps<any>
  section?: string
  touched: any
  errors: any
  name: string
  warning?: string
  disableClearable?: boolean
  disabled?: boolean
  onSelectValue?: (
    e: SyntheticEvent<Element, Event>,
    value: any,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<any>,
  ) => void
  disabled?: boolean
  helperText?: string
}) => {
  return (
    <GridAutocomplete
      xs={xs}
      label={label}
      name={section ? section + '.' + name : name}
      error={Boolean(errors?.[name] && touched?.[name])}
      onBlur={form.handleBlur}
      helperText={props.helperText ?? (touched?.[name] ? errors?.[name] : null)}
      selected={options?.find(option => option.value === values[name])?.label || values[name]}
      options={options}
      disabled={disabled}
      searchIcon={searchIcon}
      onSelectValue={
        onSelectValue ??
        ((_e, option) => form.setFieldValue(section ? section + '.' + name : name, option?.value ?? null))
      }
      onChange={
        props.onChange ??
        ((_e, option) => {
          if (option) form.setFieldValue(section ? section + '.' + name : name, option.value)
        })
      }
      warning={warning}
      disableClearable={disableClearable}
    />
  )
}

interface tFormikGridCheckboxProps extends Omit<Partial<FormControlLabelProps>, 'form'> {
  xs?: number
  label: string
  values: any
  form: FormikProps<any>
  section: string
  touched: any
  errors: any
  name: string
}

export const FormikGridCheckbox = ({
  xs,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  ...props
}: tFormikGridCheckboxProps) => {
  const checked = props.value ?? values[name]
  const onChange = () => {
    form.setFieldValue(section + '.' + name, !checked)
  }
  return (
    <Grid item xs={xs}>
      <FormControlLabel
        label={label}
        onChange={onChange}
        name={section + '.' + name}
        onBlur={form.handleBlur}
        error={Boolean(errors?.[name] && touched?.[name])}
        helperText={touched?.[name] ? errors?.[name] : null}
        {...props}
        control={<Checkbox checked={checked} />}
      />
    </Grid>
  )
}

export const FormikGridStaticDateTimePicker = ({
  xs,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  onChange,
  ...props
}: {
  xs: number
  label: string
  values: any
  form: any
  section: string
  touched: any
  errors: any
  name: string
  onChange?: (date: Date, forceTime?: boolean) => void
}) => {
  const [timeValue, setTimeValue] = React.useState(values[name])
  return (
    <Grid
      item
      xs={xs}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Button
          variant='contained'
          disabled={props.disabled || isSameDay(values[name], new Date())}
          onClick={() => {
            if (onChange) onChange(new Date(), true)
            else form.setFieldValue(section + '.' + name, new Date())
          }}
        >
          {trlb('commons_today')}
        </Button>
        <Typography variant='h5'>{label}</Typography>
        <MobileTimePicker
          ampm={ampmEnabled}
          inputFormat={trlb('dateTime_time_string')}
          value={values[name]}
          renderInput={(params: any) => (
            <TextField
              {...params}
              placeholder={trlb('dateTime_time_placeHolder')}
              onBlur={e => {
                form.handleBlur(e)
              }}
              name={section + '.' + name}
              error={Boolean(!isValid(timeValue) && touched?.[name])}
              helperText={touched?.[name] && !isValid(timeValue) ? trlb('commons_invalid_time') : null}
              sx={{ width: 120 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <InputAdornment position='end'>
                    <AccessTimeIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {...props}
          onChange={newDatetime => {
            if (isValid(newDatetime))
              if (onChange) onChange(newDatetime, true)
              else form.setFieldValue(section + '.' + name, newDatetime)
            setTimeValue(newDatetime)
          }}
        />
      </Box>
      <StaticDatePicker
        inputFormat={trlb('dateTime_date_string')}
        displayStaticWrapperAs='desktop'
        openTo='day'
        value={values[name]}
        onChange={
          onChange ? newValue => onChange(newValue) : newValue => form.setFieldValue(section + '.' + name, newValue)
        }
        {...props}
      />
    </Grid>
  )
}
export const FormikGridInlineDatePicker = ({
  xs,
  label,
  values,
  form,
  section,
  touched,
  errors,
  name,
  warning,
  helperText,
  FormHelperTextProps,
  ...props
}: {
  xs: number
  label: string
  values: any
  form: any
  section?: string
  touched?: any
  errors?: any
  name: string
  warning?: boolean
  helperText?: string
  FormHelperTextProps?: any
}) => {
  const sectionName = section ? section + '.' + name : name
  return (
    <Grid
      item
      xs={xs}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <DatePicker
        inputFormat={trlb('dateTime_date_string')}
        label={label}
        value={values?.[name] ?? null}
        onChange={newValue => form.setFieldValue(sectionName, validateInsertedDate(newValue))}
        renderInput={(params: any) => (
          <TextField
            {...params}
            helperText={touched?.[name] && errors?.[name] ? errors[name] : helperText ?? ''}
            onBlur={form.handleBlur}
            name={sectionName}
            error={Boolean(errors?.[name] && touched?.[name])}
            FormHelperTextProps={FormHelperTextProps}
          />
        )}
        {...props}
      />
      <Box
        sx={{
          paddingLeft: '14px',
        }}
      >
        <Typography variant='caption' sx={{ color: 'error.main' }}>
          {warning}
        </Typography>
      </Box>
    </Grid>
  )
}

type tAddPositionFieldProps = FormikGridSelectProps & {
  disabledDeleteButton: boolean
  showTimeStamp?: boolean
  timeStampLabel?: string
  values: any
  form: any
  section: string
  touched: any
  errors: any
  name: string
  onDelete: () => void
  onTimestampChange?: (newValue: Date) => void
  timestampValue?: Date
  showPositionsTimestamps?: boolean
  disableTimestamp?: boolean
}

export const AddPositionField = ({
  disabledDeleteButton,
  label,
  menuItems,
  showTimeStamp,
  timeStampLabel,
  values,
  form,
  section,
  touched,
  errors,
  name,
  onDelete,
  onTimestampChange,
  timestampValue,
  showPositionsTimestamps = false,
  disableTimestamp = false,
  ...props
}: tAddPositionFieldProps) => {
  return (
    <Grid
      item
      xs={12}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        maxHeight: '80px',
        mb: 2,
      }}
    >
      <FormikGridSelect
        {...{
          label,
          menuItems,
          values,
          form,
          section,
          name,
          touched,
          errors,
          ...props,
          xs: showPositionsTimestamps ? 8 : 11,
        }}
      />
      {showPositionsTimestamps && (
        <Grid
          item
          xs={4}
          sx={{
            marginLeft: '20px',
          }}
        >
          <TimestampPicker
            disabled={disableTimestamp}
            label={timeStampLabel!}
            value={timestampValue!}
            onChange={newValue => onTimestampChange?.(newValue!)}
          />
        </Grid>
      )}
      {!disabledDeleteButton && (
        <Grid item xs={1}>
          <IconButton onClick={onDelete}>
            <CloseIcon />
          </IconButton>
        </Grid>
      )}
    </Grid>
  )
}

type GridDateSelectorProps = Omit<DatePickerProps<any, any>, 'renderInput'> & {
  xs?: number
  error?: boolean
  helperText?: string
  onBlur?: () => void
  disabled?: boolean
}

export const GridDateSelector: React.FC<GridDateSelectorProps> = ({
  xs,
  value,
  label,
  disabled,
  ...props
}) => {
  return (
    <Grid item xs={xs} sx={{ display: 'flex', justifyContent: 'center' }}>
      <DatePicker
        inputFormat={trlb('dateTime_date_string')}
        label={label}
        value={value}
        disabled={disabled}
        {...props}
        onChange={newValue => props.onChange(validateInsertedDate(newValue))}
        renderInput={(params: any) => (
          <TextField
            {...params}
            style={{ width: '100%' }}
            onBlur={props.onBlur}
            error={Boolean(props.error)}
            helperText={props.helperText}
            disabled={false}
            inputProps={{ ...params.inputProps, readOnly: disabled }}
          />
        )}
      />
    </Grid>
  )
}

type GridDateRangeSelectorProps = {
  xs?: number
  value?: [Date | number | null, Date | number | null]
  error?: boolean
  helperText?: string
  onChange: (value: [Date | null, Date | null]) => void
  forceError?: boolean
  allChanges?: boolean
  forceValue?: boolean
}

export const GridDateRangeSelector: React.FC<GridDateRangeSelectorProps> = ({
  xs,
  value,
  onChange,
  allChanges,
  forceError,
  forceValue,
  ...props
}) => {
  // eslint-disable-next-line max-len
  const [tempValue, setTempValue] = React.useState<[Date | null, Date | null]>([
    value?.[0] != null ? new Date(value[0]) : null,
    value?.[1] != null ? new Date(value[1]) : null,
  ])
  const [touched, setTouched] = React.useState<[boolean, boolean]>([false, false])

  React.useEffect(() => {
    if (
      value?.[0] != null &&
      value?.[1] != null &&
      forceValue
    )
      setTempValue([startOfDay(new Date(value[0])), endOfDay(new Date(value[1]))])
  }, [value?.[0], value?.[1], forceValue])

  React.useEffect(() => {
    if (allChanges) {
      const startDate = validateInsertedDate(tempValue[0])
      const endDate = validateInsertedDate(tempValue[1])
      onChange([isValid(startDate)
        ? startOfDay(startDate!)
        : null,
      isValid(endDate)
        ? endOfDay(endDate!)
        : null])
    } else if (tempValue[0] && tempValue[1]) {
      const date0 = new Date(tempValue[0])
      const date1 = new Date(tempValue[1])
      if (isValid(date0) && isValid(date1) && isBefore(startOfDay(date0), endOfDay(date1)))
        onChange?.([startOfDay(date0), endOfDay(date1)])
    } else if (!tempValue[0] && !tempValue[1]) {
      onChange?.([null, null])
    }
  }, [tempValue, allChanges])

  const errorFrom = tempValue[0] && !isValid(validateInsertedDate(tempValue[0]))

  const errorTo =
    tempValue[1] &&
    (!isValid(validateInsertedDate(tempValue[1])) ||
      (isValid(tempValue[0]) && isValid(tempValue[1]) && isAfter(startOfDay(tempValue[0]!),
        endOfDay(tempValue[1]!))))

  return (
    <Grid item xs={xs} sx={{ display: 'flex', justifyContent: 'start' }}>
      <DatePicker
        {...props}
        inputFormat={trlb('dateTime_date_string')}
        label={trlb('commons_start_date')}
        value={tempValue?.[0] ?? null}
        onChange={newValue => {
          setTempValue([newValue, tempValue[1]])
        }}
        renderInput={(params: any) => (
          <TextField
            {...params}
            style={{ width: '100%' }}
            error={(touched[0] || forceError) && Boolean(errorFrom || props.error)}
            helperText={props.helperText}
            onBlur={() => setTouched([tempValue[0] != null, touched[1]])}
          />
        )}
      />
      <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>{trlb('dateTime_dateRange_separator')}</Box>
      <DatePicker
        {...props}
        inputFormat={trlb('dateTime_date_string')}
        label={trlb('commons_end_date')}
        value={tempValue?.[1] ?? null}
        onChange={newValue => {
          setTempValue([tempValue[0], newValue])
        }}
        renderInput={(params: any) => (
          <TextField
            {...params}
            style={{ width: '100%' }}
            error={(touched[1] || forceError) && Boolean(errorTo || props.error)}
            helperText={props.helperText}
            onBlur={() => setTouched([touched[0], tempValue[1] != null])}
          />
        )}
      />
    </Grid>
  )
}

type GridMultiDateSelectoProps = Partial<StaticDatePickerProps<any, any>> & {
  xs?: number
  label?: string
}

export const GridMultiDateSelector: React.FC<GridMultiDateSelectoProps> = ({
  xs = 12,
  onChange = () => { },
  minDate,
  maxDate,
  value,
  label,
}) => {
  const [values, setValues] = React.useState(
    value?.map((obj: Date) => startOfDay(new Date(obj))) ?? [startOfDay(new Date())],
  )

  const findDate = (dates: Date[], date: Date) => {
    const dateTime = format(date, 'dd/MM/yyyy')
    return dates.find(item => {
      const itemDate = format(item, 'dd/MM/yyyy')
      return itemDate === dateTime
    })
  }

  const findIndexDate = (dates: Date[], date: Date) => {
    const dateTime = format(date, 'dd/MM/yyyy')
    return dates.findIndex(item => {
      const itemDate = format(item, 'dd/MM/yyyy')
      return itemDate === dateTime
    })
  }

  const renderPickerDay = (date: Date,
    _selectedDates: Date[],
    pickersDayProps: PickersDayProps<Date>) => {
    if (!values) return <PickersDay {...pickersDayProps} />

    const selected = !!findDate(values, startOfDay(date))

    return <PickersDay {...pickersDayProps} disableMargin selected={selected} />
  }

  useEffect(() => {
    if (value) setValues(value)
  }, [value])

  const onClear = () => {
    setValues([])
    onChange([])
  }

  return (
    <Grid item xs={xs} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <StaticDatePicker
        inputFormat={trlb('dateTime_date_string')}
        displayStaticWrapperAs='desktop'
        value={value ?? values}
        onChange={newValue => {
          const array = [...values]
          const date = startOfDay(newValue ?? minDate)
          const index = findIndexDate(array, date)
          if (index >= 0) array.splice(index, 1)
          else array.push(date)

          setValues(array)
          onChange(array)
        }}
        renderDay={renderPickerDay}
        label={label}
        renderInput={params => <TextField {...params} />}
        minDate={minDate}
        maxDate={maxDate}
      />
      <IconButton disabled={!values?.length}
        sx={{ opacity: !values.length ? 0.5 : 1 }}
        onClick={onClear}>
        <Clear />
      </IconButton>
    </Grid>
  )
}

interface GridTimeSelectorProps extends Partial<TimePickerProps<Date, Date>> {
  xs: number
  label?: string
  form?: any
  value: Date | null
  error?: boolean
  helperText?: string
  onBlur?: () => void
}

export const GridTimeSelector = ({
  xs,
  label,
  form,
  onChange = () => { },
  value,
  error,
  helperText,
  onBlur,
  ...props
}: GridTimeSelectorProps) => {
  return (
    <Grid item xs={xs} sx={{ display: 'flex', justifyContent: 'center' }}>
      <MobileTimePicker
        {...props}
        ampm={ampmEnabled}
        inputFormat={trlb('dateTime_time_string')}
        label={label}
        value={value}
        onChange={onChange}
        renderInput={params => (
          <TextField
            {...params}
            onBlur={onBlur}
            error={Boolean(error)}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <InputAdornment position='end'>
                  <AccessTimeIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    </Grid>
  )
}

export const Space10 = () => {
  return <Box sx={{ width: '100%', height: theme => theme.spacing(1), flexShrink: 0 }} />
}
export const Space20 = () => {
  return <Box sx={{ width: '100%', height: theme => theme.spacing(2), flexShrink: 0 }} />
}
export const Space40 = () => {
  return <Box sx={{ width: '100%', height: theme => theme.spacing(4), flexShrink: 0 }} />
}

export type FlexContainerProps = {
  children: ReactNode | ReactNode[]
  isFull?: boolean
}

export const FlexContainer = ({ children, isFull }: FlexContainerProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        ...(isFull ? { width: '100%' } : {}),
      }}
    >
      {children}
    </Box>
  )
}

type tSimpleStyledSelectProps<T> = {
  value: T
  menuItems: T[]
  changeFun: (event: React.ChangeEvent<HTMLInputElement>) => void
  getValueFun: (value: T) => string | number | readonly string[] | undefined
  getLabelFun: (value: T) => string
}

export function SimpleStyledSelect<T> (props: tSimpleStyledSelectProps<T>) {
  const { value, menuItems, changeFun, getValueFun, getLabelFun } = props
  return (
    <TextField
      select
      variant='outlined'
      value={value}
      onChange={changeFun}
      sx={{ minWidth: '25%' }}
      SelectProps={{
        MenuProps: defaultStyles.MenuProps,
      }}
    >
      {menuItems.map(current => {
        const itemValue = getValueFun(current)
        const itemLabel = getLabelFun(current)
        const key = `${current}`

        return (
          <MenuItem value={itemValue} key={key} sx={defaultStyles.MenuItemSx}>
            {itemLabel}
          </MenuItem>
        )
      })}
    </TextField>
  )
}
