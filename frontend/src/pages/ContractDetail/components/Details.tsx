import {
  IUser,
  Identifier,
} from '@smambu/lib.constants'
import { Grid, Tab, Tabs } from '@mui/material'
import { Box } from '@mui/system'
import { defaultStyles } from 'ThemeProvider'
import { DetailsAccordionContent } from 'components/ContractDetailTabs'
import React, { useState } from 'react'
import { trlb } from 'utilities/translator/translator'

interface DetailsProps {
  edit: boolean
  isNew: boolean
  doctors: Record<Identifier, IUser>
  form: any
  handleSelectDoctor: (doctor?: IUser) => void
  contractsErrors: string[]
}

const Details: React.FC<DetailsProps> = ({
  edit,
  isNew,
  doctors,
  form,
  handleSelectDoctor,
  contractsErrors,
}) => {
  const [value, setValue] = useState('details')
  const handleChange = (_event: React.SyntheticEvent<Element, Event>, newValue: any) => {
    setValue(newValue)
  }

  const tabTitleSx = {
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  }

  const tabs = [
    {
      value: 'details',
      title: <Box sx={tabTitleSx}>{trlb('general')}</Box>,
      component: (
        <DetailsAccordionContent
          edit={edit || isNew}
          isNew={isNew}
          doctors={doctors}
          form={form}
          handleSelectDoctor={handleSelectDoctor}
          contractsErrors={contractsErrors}
        />
      ),
    },
  ]
  return (
    <Grid container spacing={4}>
      <Grid item xs={3}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor='primary'
          indicatorColor='primary'
          orientation='vertical'
          sx={defaultStyles.VerticalTabsSx}
        >
          {tabs.map((tab, index) => {
            return (
              <Tab
                key={index}
                value={tab.value}
                label={tab.title}
                sx={{ fontWeight: '600', alignItems: 'flex-start' }}
              />
            )
          })}
        </Tabs>
      </Grid>
      <Grid item xs={9}>
        {tabs.map((tab, index) => {
          if (value !== tab.value) return null
          return (
            <Box key={index} role='tabpanel' hidden={value !== tab.value} sx={{ mt: 2 }}>
              {tab.component}
            </Box>
          )
        })}
      </Grid>
    </Grid>
  )
}

export default Details
