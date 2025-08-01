import { Box, Tab, Tabs, Typography } from '@mui/material'
import { Space20 } from 'components/Commons'
import { WarningIcon } from 'components/Icons'
import { FormikProps } from 'formik'
import React from 'react'
import { trlb } from 'utilities'
import { OPSectionIsValid, hasBillingErrors } from 'utilities/cases-opstandards'

const TabsBar = ({
  form,
  selectedTab,
  setSelectedTab,
  sections,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning,
}: {
  form: FormikProps<any>
  selectedTab: number
  setSelectedTab: (newValue: number) => void
  sections: { title: string; formPath: string; component: React.ReactNode }[]
  warningFields?: string[]
  showDocumentationWarnings?: boolean
  showBillingWarning?: boolean
}) => {
  return (
    <Tabs
      variant='standard'
      value={selectedTab}
      onChange={(_e, newValue) => setSelectedTab(newValue)}
      textColor='primary'
      indicatorColor='primary'
      sx={{
        maxWidth: '100%',
        '& .MuiTabs-flexContainer': { flexWrap: 'wrap', justifyContent: 'center' },
        '& .MuiButtonBase-root': { height: 32 },
        '& .MuiTabs-indicator': { display: 'none' },
      }}
    >
      {sections.map((section, index) => {
        const isValid = OPSectionIsValid(form, section.formPath)
        const showWarning = showDocumentationWarnings && !isValid
        const hasMissingInfo = hasBillingErrors(warningFields, section.formPath, false)
        const showMissingInfo = showBillingWarning && hasMissingInfo
        const isSelected = selectedTab === index

        return (
          <Tab
            key={section.title}
            value={index}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {showWarning && <WarningIcon />}
                {showMissingInfo && <WarningIcon variant='warning' />}
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: '600',
                    fontSize: '0.7rem',
                    color: isSelected ? 'primary.dark' : 'primary.main',
                  }}
                >
                  {trlb(section.title)}
                </Typography>
              </Box>
            }
            sx={{
              p: 0,
              mx: 1,
              bgcolor: isSelected ? 'primary.light' : undefined,
              borderRadius: theme => theme.constants.radius,
              width: 120,
            }}
          />
        )
      })}
    </Tabs>
  )
}

const OpStandardSection = ({
  form,
  sections,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning,
}: {
  form: FormikProps<any>
  sections: { title: string; component: React.ReactNode; formPath: string }[]
  warningFields?: string[]
  showDocumentationWarnings?: boolean
  showBillingWarning?: boolean
}) => {
  const [selectedTab, setSelectedTab] = React.useState(0)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <TabsBar form={form} selectedTab={selectedTab} setSelectedTab={setSelectedTab}
        sections={sections} warningFields={warningFields}
        showBillingWarning={showBillingWarning}
        showDocumentationWarnings={showDocumentationWarnings} />
      <Space20 />
      {sections.map((section, index) => {
        return (
          <Box key={section.title} sx={{ display: selectedTab === index ? 'block' : 'none' }}>
            {section.component}
          </Box>
        )
      })}
    </Box>
  )
}

export default OpStandardSection
