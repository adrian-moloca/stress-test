import { IAnagraphicField, ToastType } from '@smambu/lib.constants'
import { Edit } from '@mui/icons-material'
import { Box, IconButton, Popover, TextField, Toolbar, Typography } from '@mui/material'
import StandardDialog from 'components/StandardDialog'
import React from 'react'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { trlb } from 'utilities'

const getEmptyAddress = () => ({
  street: '',
  streetNumber: '',
  city: '',
  postalCode: '',
  country: '',
})

const AddressCell = ({
  field,
  params,
  edit,
  onEdit,
  disableSave,
  readOnly,
}: {
  field: IAnagraphicField
  params?: any
  label?: string
  edit: boolean
  onEdit: ({ name, value, rowKey }: { name: string; value: any; rowKey: string }) => void
  disableSave: (status: boolean) => void
  readOnly?: boolean
}) => {
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [values, setValues] = React.useState(params?.value ?? getEmptyAddress())
  const disabled = !edit || readOnly
  const dispatch = useDispatch()

  React.useEffect(() => {
    if (Object.entries(params?.value ?? {}).some(([key, value]) => values?.[key] !== value))
      setValues({ ...(params?.value ?? {}) } ?? getEmptyAddress())
  }, [params?.value])

  const onConfirm = async () => {
    disableSave(true)
    setOpen(false)
    await onEdit({ name: field.name, value: values, rowKey: params.row.key })
    dispatch({
      type: GLOBAL_ACTION.ADD_TOAST,
      data: {
        text: 'anagraphics_addressSaved_success',
        type: ToastType.success,
      },
    })
    disableSave(false)
  }

  const onClose = () => {
    setOpen(false)
    setValues({ ...(params?.value ?? {}) } ?? getEmptyAddress())
  }

  const stringifiedValue = Object.values(params?.value ?? {})
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <Box
        sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}
        onClick={e => setAnchorEl(e.currentTarget)}
      >
        {!disabled && (
          <IconButton
            size='small'
            onClick={e => {
              setOpen(true)
              e.stopPropagation()
            }}
          >
            <Edit />
          </IconButton>
        )}
        <Typography>{stringifiedValue}</Typography>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography>{stringifiedValue}</Typography>
        </Box>
      </Popover>
      <StandardDialog open={open} onClose={onClose} onConfirm={onConfirm} titleKey={'anagraphics_address_name'}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <TextField
            label={trlb('anagraphics_address_street')}
            value={values.street}
            onChange={e => setValues({ ...values, street: e.target.value })}
            sx={{ width: 'calc(100% - 120px)' }}
          />
          <TextField
            label={trlb('anagraphics_address_streetNumber')}
            value={values.streetNumber}
            onChange={e => setValues({ ...values, streetNumber: e.target.value })}
            sx={{ width: 100 }}
          />
        </Toolbar>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <TextField
            label={trlb('anagraphics_address_city')}
            value={values.city}
            onChange={e => setValues({ ...values, city: e.target.value })}
            sx={{ width: '30%' }}
          />
          <TextField
            label={trlb('anagraphics_address_postalCode')}
            value={values.postalCode}
            onChange={e => setValues({ ...values, postalCode: e.target.value })}
            sx={{ width: '30%' }}
          />
          <TextField
            label={trlb('anagraphics_address_country')}
            value={values.country}
            onChange={e => setValues({ ...values, country: e.target.value })}
            sx={{ width: '30%' }}
          />
        </Toolbar>
      </StandardDialog>
    </>
  )
}

export default AddressCell
