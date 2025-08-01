import { Contract, IUser, Identifier, OpStandard } from '@smambu/lib.constants'
import { Card, Tab, Tabs } from '@mui/material'
import { Box } from '@mui/system'
import { OPStandardTab } from 'components/ContractDetailTabs'
import React, { SyntheticEvent } from 'react'
import { trlb } from 'utilities/translator/translator'
import Details from './Details'
import { routes } from 'routes/routes'
import { defaultStyles } from 'ThemeProvider'

interface TabsContainerProps {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  edit: boolean
  doctors: Record<Identifier, IUser>
  isNew: boolean
  form: any
  lastContract?: Contract | null
  contractOpStandards: OpStandard[]
  handleSelectDoctor: (doctor?: IUser) => void
  canViewOpStandards: boolean
  contractsErrors: string[]
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  value,
  setValue,
  edit,
  isNew,
  doctors,
  form,
  lastContract,
  contractOpStandards,
  handleSelectDoctor,
  canViewOpStandards,
  contractsErrors,
}) => {
  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string) => {
    setValue(newValue)
  }

  const tabs = [
    {
      title: trlb('commons_details'),
      key: routes.caseDetailsTabs[0],
      component: (
        <Details
          isNew={isNew}
          edit={edit}
          doctors={doctors}
          form={form}
          handleSelectDoctor={handleSelectDoctor}
          contractsErrors={contractsErrors}
        />
      ),
    },
    ...(canViewOpStandards
      ? [
        {
          title: trlb('op_standard'),
          key: routes.caseDetailsTabs[1],
          component: (
            <OPStandardTab
              isNew={isNew}
              edit={edit}
              form={form}
              lastContract={lastContract}
              contractOpStandards={contractOpStandards}
            />
          ),
        },
      ]
      : []),
  ]

  return (
    <Card sx={{ width: '100%', p: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        textColor='primary'
        indicatorColor='primary'
        centered
        sx={defaultStyles.HorizontalTabsSx}
      >
        {tabs.map((tab, index) => {
          return <Tab key={index} value={tab.key} label={tab.title} sx={{ fontWeight: '600' }} />
        })}
      </Tabs>
      {tabs.map((tab, index) => {
        return (
          <Box key={index} role='tabpanel' hidden={value !== tab.key} sx={{ mt: 2 }}>
            {tab.component}
          </Box>
        )
      })}
    </Card>
  )
}

export default TabsContainer
