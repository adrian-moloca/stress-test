import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Divider,
  useTheme,
  ListItemButton,
  ListItemIcon,
  Popover,
  SelectProps,
  InputLabel,
  Select,
  FormControl,
  FormHelperText,
  MenuItem,
  AutocompleteChangeReason,
  AutocompleteChangeDetails,
  TextFieldProps,
  Autocomplete,
  AutocompleteProps,
  SxProps,
} from '@mui/material'
import { MobileDatePicker } from '@mui/x-date-pickers'
import React from 'react'
import { trlb } from 'utilities'
import { CalendarMonth, Clear, Search, Info, ArrowDropDown } from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import {
  BillingCategory,
  Case,
  OpStandardBillingCategory_Name,
  TABLE_COLUMNS_HEADER_ALIGN,
  getCaseContract,
  getRandomUniqueId,
} from '@smambu/lib.constants'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { TextIconButton } from './Buttons'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from 'store'
import { format } from 'date-fns'
import { routes } from 'routes/routes'
import { defaultStyles } from 'ThemeProvider'

const defaultPaginationLimit = Number(import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT)
const defaultPaginationOptions = import.meta.env.VITE_DEFAULT_PAGINATION_OPTIONS.split(',').map(Number)

export const CategoryInfoButton = ({ billingCategory }:
{ billingCategory: BillingCategory | OpStandardBillingCategory_Name | null }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  if (!billingCategory || billingCategory === OpStandardBillingCategory_Name.AUTO) return null

  return (
    <>
      <IconButton component='span' onClick={handleClick} size='small'>
        <Info />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 400 }}>
          <Typography variant='h5' color='text.secondary' sx={{ mb: 2 }}>
            {trlb(`billingCategories_${billingCategory}_title`)}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {trlb(`billingCategories_${billingCategory}_description`)}
          </Typography>
        </Box>
      </Popover>
    </>
  )
}

export const FlexDateSelector = ({
  value,
  onChange,
  label,
  canEdit,
  error,
  ...props
}: {
  value?: Date | null
  onChange: (value: Date | null) => void
  label?: string
  canEdit: boolean
  error?: boolean
}) => {
  return (
    <MobileDatePicker
      inputFormat={trlb('dateTime_date_string')}
      label={label ? trlb(label) : undefined}
      value={value}
      onChange={onChange}
      disabled={!canEdit}
      renderInput={params => (
        <TextField
          {...params}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton>
                  <CalendarMonth />
                </IconButton>
              </InputAdornment>
            ),
          }}
          error={error}
        />
      )}
      {...props}
    />
  )
}

export const FlexSearchField = ({
  searchText,
  setSearchText,
  label,
  noDebounce,
  ...props
}: {
  searchText: string
  setSearchText: (value: string) => void
  label?: string
  noDebounce?: boolean
  props?: TextFieldProps
  sx?: SxProps
}) => {
  const [value, setValue] = React.useState(searchText)

  React.useEffect(() => {
    if (value !== searchText)
      if (!value || noDebounce) {
        setSearchText(value)
      } else {
        const timeout = setTimeout(() => {
          setSearchText(value)
        }, 500)
        return () => clearTimeout(timeout)
      }
  }, [value, searchText])

  return (
    <TextField
      label={trlb(label ?? 'commons_search')}
      value={value}
      onChange={e => setValue(e.target.value.toLowerCase())}
      InputProps={{
        endAdornment: value
          ? (
            <InputAdornment position='end'>
              <IconButton onClick={() => setValue('')} size='small'>
                <Clear />
              </IconButton>
            </InputAdornment>
          )
          : undefined,
        startAdornment: (
          <InputAdornment position='start'>
            {value !== searchText && !noDebounce ? <CircularProgress size={20} /> : <Search />}
          </InputAdornment>
        ),
      }}
      {...props}
    />
  )
}

export const FlexDataTable = ({ rowHeight, background, showToolbar, toolbar, ...props }: any) => {
  return (
    <Box
      style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DataGrid
        rowsPerPageOptions={defaultPaginationOptions}
        sx={{
          '& .MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          background: background || null,
          ...(props.sx || {}),
        }}
        rowHeight={rowHeight || 52}
        components={{
          Toolbar: showToolbar ? toolbar : null,
        }}
        initialState={{
          pagination: {
            pageSize: defaultPaginationLimit,
            ...(props.initialState?.pagination || {}),
          },
          ...(props.initialState || {}),
        }}
        {...props}
        columns={props.columns.map((col: any) => ({
          ...col,
          headerAlign: col.headerAlign ?? TABLE_COLUMNS_HEADER_ALIGN,
        }))}
      />
    </Box>
  )
}

export const FlexSelector = ({
  value,
  options,
  onChange,
  label,
  disabled,
  error,
  clearable,
  noEmptyOption,
  ...props
}: {
  value?: string | null
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  error?: boolean
  clearable?: boolean
  noEmptyOption?: boolean
  sx?: SxProps
}) => {
  return (
    <TextField
      label={trlb(label ?? 'commons_select')}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      error={error}
      select
      SelectProps={{
        MenuProps: defaultStyles.MenuProps,
      }}
      {...props}
    >
      {!noEmptyOption && <MenuItem sx={defaultStyles.MenuItemSx} value='' />}
      {options.map(option => (
        <MenuItem key={option.value} value={option.value} sx={defaultStyles.MenuItemSx}>
          {trlb(option.label)}
        </MenuItem>
      ))}
    </TextField>
  )
}

export const FlexPatientCases = ({ patientCases, patientId }:
{ patientCases: Case[]; patientId: string }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const contracts = useAppSelector(state => state.contracts)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      {Object.values(patientCases).map(patientCase => {
        return (
          <Box
            key={getRandomUniqueId()}
            sx={{
              background: 'white',
              width: '100%',
              boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              margin: '10px',
              padding: '10px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ padding: '15px 15px' }}>
              <Typography>{trlb('case_n')}</Typography>
              <Typography>{patientCase.caseNumber}</Typography>
            </Box>
            <Divider orientation='vertical' variant='middle' flexItem />
            <Box sx={{ padding: '15px 15px' }}>
              <Typography variant='button'>{trlb('surgery_name')}</Typography>
              <Typography>
                {getCaseContract({
                  caseForm: patientCase,
                  contracts,
                })?.opStandards?.[patientCase?.bookingSection?.opStandardId ?? '']?.name ?? ''}
              </Typography>
            </Box>
            <Divider orientation='vertical' variant='middle' flexItem />
            <Box sx={{ padding: '15px 15px' }}>
              <Typography>{trlb('commons_time')}</Typography>
              <Typography>{format(patientCase.bookingSection?.date, 'HH:mm')}</Typography>
            </Box>
            <Divider orientation='vertical' variant='middle' flexItem />
            <Box sx={{ padding: '15px 15px' }}>
              <Typography>{trlb('commons_date')}</Typography>
              <Typography>{format(patientCase.bookingSection?.date, 'dd/MM/yyyy')}</Typography>
            </Box>
            <Box sx={{ padding: '15px 15px', display: 'flex', alignItems: 'center' }}>
              <InfoOutlinedIcon
                onClick={() => navigate(`${routes.cases}/${patientCase.caseId}`)}
                sx={{
                  width: '20px',
                  color: theme.palette.primary.main,
                  marginLeft: '10px',
                }}
              />
            </Box>
          </Box>
        )
      })}
      <ListItemButton
        onClick={() => navigate(routes.patientCases.replace(':patientId', patientId))}
        sx={{ maxWidth: '200px' }}
      >
        <ListItemIcon>
          <FolderOpenIcon sx={{ color: theme.palette.primary.main }} />
        </ListItemIcon>
        <TextIconButton text={trlb('see_all_cases')} sx={{ whiteSpace: 'nowrap' }}></TextIconButton>
      </ListItemButton>
    </Box>
  )
}

export const FlexSelect = ({
  label,
  menuItems,
  value,
  onChange,
  background,
  helperText,
  disabled = false,
  ...props
}: SelectProps & {
  label?: string
  name: string
  menuItems: { label: string; value: string | number }[]
  background?: string
  helperText?: string
  value?: string
}) => {
  return (
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
        {(menuItems ?? []).map(menuItem => {
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
  )
}

export interface FlexAutocompleteProps<T>
  extends Omit<AutocompleteProps<T, boolean | undefined, boolean | undefined, boolean | undefined>, 'renderInput'> {
  label?: string
  options: any[]
  searchIcon?: boolean
  selected?: { value: string; label: string } | { value: string; label: string }[]
  disabled?: boolean
  onSelectValue?: (
    e: React.SyntheticEvent<Element, Event>,
    value: any,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<any>,
  ) => void
  textProps?: TextFieldProps
  error?: boolean
  helperText?: string
}

// eslint-disable-next-line max-len
export const FlexAutocomplete: React.FC<FlexAutocompleteProps<{ value: string; label: string }>> = ({
  onSelectValue,
  label,
  options,
  selected,
  searchIcon,
  disabled,
  ...props
}) => {
  return (
    <Autocomplete
      options={options}
      sx={{ width: '100%' }}
      popupIcon={searchIcon ? <Search /> : <ArrowDropDown />}
      value={selected}
      onChange={onSelectValue}
      disabled={disabled}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderOption={(props: any, option?: { value: string; label: string }) => {
        if (!option) return null
        return (
          <li {...props} key={option.value}>
            {option.label}
          </li>
        )
      }}
      {...props}
      renderInput={(params: any) => <TextField {...params}
        label={label}
        {...props}
        disabled={disabled} />}
    />
  )
}
