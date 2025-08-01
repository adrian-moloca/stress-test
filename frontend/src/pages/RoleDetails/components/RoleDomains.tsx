import React from 'react'
import { ListItemText, useTheme, Button, Box } from '@mui/material'
import { GridSelect } from 'components/Commons'
import { PERMISSIONS_DOMAINS_SCOPES, tPermissionDomains } from '@smambu/lib.constants'
import { trlb } from 'utilities'

const RoleDomains = ({
  edit,
  domainFilter,
  setDomainFilter,
  form,
  searchText,
  domains,
}: {
  edit?: boolean
  domainFilter: string | null
  setDomainFilter: (domain: string | null) => void
  form: any
  searchText: string
  domains: tPermissionDomains
}) => {
  const theme = useTheme()

  const changeDomainScope = (key: string, value: string) => {
    form.setFieldValue('domain_scopes', {
      ...form.getFieldProps('domain_scopes').value,
      [key]: value,
    })
  }

  const domainList = React.useMemo(
    () =>
      Object.entries(form.getFieldProps('domain_scopes').value ?? {})
        .filter(cap => !searchText || cap[0].toLowerCase().includes(searchText.toLowerCase()))
        .map(el => el as [string, string]),
    [searchText, form],
  )

  const menuItems = React.useMemo(
    () => Object.values(PERMISSIONS_DOMAINS_SCOPES).map(el => ({ value: el, label: trlb(el) })),
    [],
  )

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        overflowY: 'auto',
        flex: '0 1 33%',
        pr: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Button
          onClick={() => {
            setDomainFilter(null)
          }}
          variant='contained'
          color={domainFilter === null ? 'primary' : 'inherit'}
          sx={{
            borderRadius: theme => theme.constants.radius,
            flex: 1,
          }}
        >
          <ListItemText
            primaryTypographyProps={{
              style: { overflow: 'hidden', textOverflow: 'ellipsis' },
            }}
            sx={{
              textAlign: 'center',
              color: domainFilter === null ? theme.palette.primary.contrastText : 'inherit',
            }}
          >
            {trlb('generic_all')}
          </ListItemText>
        </Button>
        <GridSelect
          name=''
          xs={6}
          label=''
          value=''
          menuItems={[''].map(el => ({ value: el, label: el }))}
          {...{
            disabled: true,
            sx: { flex: 1, display: 'none' },
          }}
        />
      </Box>
      {domainList.map(cap => (
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 1,
            mt: 2,
          }}
          key={cap[0]}
        >
          <Button
            onClick={() => {
              setDomainFilter(cap[0])
            }}
            variant='contained'
            color={domainFilter === cap[0] ? 'primary' : 'inherit'}
            sx={{
              borderRadius: theme => theme.constants.radius,
              flex: 1,
            }}
          >
            <ListItemText
              primaryTypographyProps={{
                style: { overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
              sx={{
                textAlign: 'center',
                color: domainFilter === cap[0] ? theme.palette.primary.contrastText : 'inherit',
              }}
            >
              {cap[0]}
            </ListItemText>
          </Button>
          <GridSelect
            name={cap[0]}
            xs={6}
            label={trlb('can_access_data_of')}
            menuItems={menuItems}
            onChange={(event: any) => changeDomainScope(cap[0], event.target.value)}
            value={cap[1]}
            size='small'
            disabled={!edit}
            sx={{ flex: 1 }}
          />
        </Box>
      ))}
    </Box>
  )
}

export default RoleDomains
