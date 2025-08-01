import React from 'react'
import { tRenderer } from '../types'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DynamicRendererInner } from 'universal-reporting/DynamicRendererInner'

export const RenderAccordionType: tRenderer<'accordion'> = data => {
  const { value, fieldRepresentation, wholePayload, editable, path, locale, update, fields } = data

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls='panel1a-content'
        id='panel1a-header'
      >
        <Typography>{fieldRepresentation.label[locale]}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <DynamicRendererInner
          wholePayload={wholePayload}
          data={value}
          setData={update}
          fields={fields}
          representation={fieldRepresentation.viewAs.subFields}
          editable={editable}
          locale={'en'}
          path={!path ? fieldRepresentation.fieldId : `${path}.${fieldRepresentation.fieldId}`} />
      </AccordionDetails>
    </Accordion>
  )
}
