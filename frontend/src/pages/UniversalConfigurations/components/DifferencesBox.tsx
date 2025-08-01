import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { URConfigs } from '@smambu/lib.constants'
import { ExpandMore } from '@mui/icons-material'

// TODO UR: type oldData and newData
const DifferencesBox = ({
  oldData,
  newData,
  onReset,
  onConfirm,
}: {
  oldData: any
  newData: any,
  onReset: () => void,
  onConfirm: () => void
}) => {
  return (
    <Box
      sx={{ width: '100%', height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}
    >
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }} >
        <Typography variant='h5' color='error'>{trlb('ur_configs_differences')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', width: '100%', maxHeight: '55vh', flexGrow: 1, textAlign: 'left', overflow: 'auto' }} >
        {Object.values(URConfigs).map(key => {
          // TODO: type this better when they get typed in the "father" component
          const oldValue = JSON.stringify(oldData?.[key] ?? null, null, 2)
          const newValue = JSON.stringify(newData?.[key] ?? null, null, 2)

          const hasChanges = oldValue !== newValue

          return (
            <Accordion key={key} defaultExpanded={hasChanges}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6'>{key}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ReactDiffViewer
                  key={key}
                  oldValue={oldValue}
                  newValue={newValue}
                  splitView={true}
                  disableWordDiff={true}
                />
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-evenly' }}>
        <Button variant='outlined' color='primary' onClick={onReset}>
          {trlb('commons_cancel')}
        </Button>
        <Button variant='contained' color='primary' onClick={onConfirm}>
          {trlb('commons_confirm')}
        </Button>
      </Box>
    </Box>
  )
}

export default DifferencesBox
