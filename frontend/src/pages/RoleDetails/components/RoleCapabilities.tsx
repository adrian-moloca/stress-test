import React from 'react'

import { Box, useTheme } from '@mui/material'
import { Space20, SectionSubtitle } from 'components/Commons'
import {
  ICapabilityName,
  IFormattedCapability,
  PERMISSION_DOMAIN,
  Role,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { CapabilityButton, ChangesCounter } from './RoleCapabilitiesComponents'

const RoleCapabilities = ({
  role,
  edit,
  capabilities,
  domainFilter,
  form,
  searchText,
  capabilitiesList,
}: {
  role: Role | undefined
  edit?: boolean
  capabilities: ICapabilityName[]
  domainFilter: string | null
  form: any
  searchText: string
  capabilitiesList: IFormattedCapability[]
}) => {
  const theme = useTheme()

  const addCapability = (capability: string) => {
    form.setFieldValue('capabilities', [...form.getFieldProps('capabilities').value, capability])
  }

  const removeCapability = (capability: string) => {
    form.setFieldValue(
      'capabilities',
      form.getFieldProps('capabilities').value.filter((ex_capability: string) => ex_capability !== capability),
    )
  }

  const addedCapabilities = React.useMemo(
    () =>
      capabilities?.reduce(
        (sum, cur) => (!(role?.capabilities ?? [])
          .includes(cur as ICapabilityName)
          ? sum + 1
          : sum),
        0,
      ),
    [capabilities, role?.capabilities],
  )

  const removedCapabilities = React.useMemo(
    () => (role?.capabilities ?? [])
      .reduce((sum, cur) => (!capabilities?.includes(cur) ? sum + 1 : sum), 0),
    [capabilities, role?.capabilities],
  )

  const filterByDomain = React.useCallback((capability: IFormattedCapability) =>
    domainFilter === null || domainFilter === PERMISSION_DOMAIN[capability.key!],
  [domainFilter])

  const filterBySearch = React.useCallback((capability: IFormattedCapability) =>
    (!searchText ||
      `${capability?.name ?? ''} ${capability?.permission ?? ''}`
        .toLowerCase()
        .includes(searchText)),
  [searchText])

  const availableCapabilities = React.useMemo(
    () =>
      capabilitiesList.filter(
        cap =>
          cap?.value != null && cap.key != null &&
          !capabilities?.includes?.(cap.value) &&
          filterByDomain(cap) &&
          filterBySearch(cap),
      ),
    [capabilities, filterBySearch, filterByDomain],
  )

  const roleCapabilities = React.useMemo(
    () =>
      capabilities == null
        ? []
        : capabilities
          .map(capValue => capabilitiesList.find(cap => cap.value === capValue))
          .filter(
            cap =>
              cap?.value != null && cap.key != null &&
              filterByDomain(cap) &&
              filterBySearch(cap)
          ),
    [capabilities, filterBySearch, filterByDomain],
  ) as IFormattedCapability[]

  return (
    <>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          flexDirection: 'column',
          gap: theme.spacing(2),
          overflow: 'hidden',
          flex: '1 1 66%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            border: '1px solid lightGrey',
            borderRadius: theme => theme.constants.radius,
            background: theme.palette.customColors,
          }}
        >
          {edit
            ? (
              <Box sx={{ padding: '10px 0px', height: '100%', overflowY: 'auto', overflowX: 'hidden', flex: '1 1 50%' }}>
                <SectionSubtitle text={`${trlb('available_capabilities')}:`} margin='0' />
                <Space20 />
                <div
                  style={{
                    minHeight: '150px',
                    borderRight: '1px solid lightGrey',
                  }}
                >
                  {availableCapabilities.map(capability => (
                    <CapabilityButton
                      key={`${capability.name}: ${capability.permission}`}
                      capability={capability}
                      edit={edit}
                      addCapability={addCapability}
                    />
                  ))}
                </div>
              </Box>
            )
            : null}
          <Box
            sx={{
              padding: '10px 0px',
              flexGrow: 1,
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: '1 1 50%',
            }}
          >
            <SectionSubtitle text={`${trlb('role_capabilities')}:`} margin='0' />
            <Space20 />
            <div style={{ minHeight: '150px', borderLeft: '1px solid lightGrey' }}>
              {roleCapabilities.map(capability => (
                <CapabilityButton
                  key={`${capability.name}: ${capability.permission}`}
                  capability={capability}
                  edit={edit}
                  removeCapability={removeCapability}
                />
              ))}
            </div>
          </Box>
        </Box>
        <ChangesCounter addedCapabilities={addedCapabilities}
          removedCapabilities={removedCapabilities}
          edit={edit} />
      </Box>
    </>
  )
}

export default RoleCapabilities
