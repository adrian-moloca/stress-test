import {
  OpStandardEquipment,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardSterileGood,
  OpStandardTabsProps,
  INTRAOPSECTIONS,
} from '@smambu/lib.constants'
import { Box } from '@mui/material'
import OpStandardSection from './OpStandardSection'
import React from 'react'
import { Positions, StandardRequiredSection, TablesSection, Tourniquet } from 'components/materials/IntraOpComponents'
import { Notes } from 'components/materials/CommonsSubSections'
import { trlb } from 'utilities'

const fieldNameOf = <T, >(name: keyof T) => {
  return name
}

export const CaseIntraOpSection = ({
  edit,
  form,
  formPath = '',
  caseDetails,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning,
}: OpStandardTabsProps) => {
  const columns: { [_key in INTRAOPSECTIONS]: string[] } = {
    [INTRAOPSECTIONS.EQUIPMENTS]: [
      fieldNameOf<OpStandardEquipment>('name'),
      fieldNameOf<OpStandardEquipment>('amount'),
      fieldNameOf<OpStandardEquipment>('notes'),
    ],
    [INTRAOPSECTIONS.MEDICATIONS]: [
      fieldNameOf<OpStandardMedication>('medicationId'),
      'code',
      fieldNameOf<OpStandardMedication>('amount'),
      fieldNameOf<OpStandardMedication>('dosage'),
      fieldNameOf<OpStandardMedication>('units'),
      fieldNameOf<OpStandardMedication>('notes'),
    ],
    [INTRAOPSECTIONS.STERILE_GOODS]: [
      fieldNameOf<OpStandardSterileGood>('unitType'),
      fieldNameOf<OpStandardSterileGood>('sterileGood'),
      fieldNameOf<OpStandardSterileGood>('amount'),
      fieldNameOf<OpStandardSterileGood>('notes'),
    ],
    [INTRAOPSECTIONS.MATERIALS]: [
      fieldNameOf<OpStandardMaterial>('materialId'),
      'code',
      fieldNameOf<OpStandardMaterial>('amount'),
      fieldNameOf<OpStandardMaterial>('notes'),
    ],
  }

  return (
    <IntraOpSectionBase
      {...{
        edit,
        form,
        formPath,
        caseDetails,
        columns,
        warningFields,
        showDocumentationWarnings,
        showBillingWarning
      }}
    />
  )
}

const IntraOpSection = ({ edit, form, formPath = '', caseDetails }: OpStandardTabsProps) => {
  return <IntraOpSectionBase {...{ edit, form, formPath, caseDetails }} />
}

const IntraOpSectionBase = ({
  edit,
  form,
  formPath = '',
  caseDetails,
  columns,
  warningFields,
  showDocumentationWarnings,
  showBillingWarning
}: OpStandardTabsProps & {
  columns?: { [_key in INTRAOPSECTIONS]: string[] }
  showDocumentationWarnings?: boolean
}) => {
  const intraOpSections = [
    {
      title: trlb('op_standard_gloves'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, TablesSection, warningFields }}
          formPath={formPath + 'gloves.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'gloves',
    },
    {
      title: trlb('positions'),
      component: (
        <Positions
          {...{ edit, form, caseDetails }}
          formPath={formPath + 'positions'}
          timestampsFormPath={`${formPath}positionsTimestamps`}
        />
      ),
      formPath: formPath + 'positions',
    },
    {
      title: trlb('op_standard_positioning_tools'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'positioningTools.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'positioningTools',
    },
    {
      title: trlb('op_standard_equipment'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'equipment.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'equipment',
    },
    {
      title: trlb('op_standard_disinfection'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'disinfection.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'disinfection',
    },
    {
      title: trlb('op_standard_covering'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'covering.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'covering',
    },
    {
      title: trlb('op_standard_surgical_instruments'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'surgicalInstruments.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'surgicalInstruments',
    },
    {
      title: trlb('op_standard_disposable_material'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'disposableMaterial.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'disposableMaterial',
    },
    {
      title: trlb('op_standard_suture_material'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'sutureMaterial.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'sutureMaterial',
    },
    {
      title: trlb('op_standard_medication_rinse'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'medication_rinse.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'medication_rinse',
    },
    {
      title: trlb('op_standard_extras'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'extras.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'extras',
    },
    {
      title: trlb('op_standard_particularities'),
      component: (
        <TablesSection
          {...{ edit, form, caseDetails, columns, warningFields }}
          formPath={formPath + 'particularities.'}
          showDocumentationWarnings={showDocumentationWarnings}
          showBillingWarning={showBillingWarning}
        />
      ),
      formPath: formPath + 'particularities',
    },
    ...(!caseDetails
      ? [
        {
          title: trlb('op_standard_tourniquet'),
          component: <Tourniquet {...{ edit, form }} formPath={formPath + 'tourniquet.'} />,
          formPath: formPath + 'tourniquet',
        },
        {
          title: trlb('op_standard_x_ray'),
          component: (
            <StandardRequiredSection {...{ edit, form }} formPath={formPath + 'x_ray.'} title='op_standard_x_ray' />
          ),
          formPath: formPath + 'x_ray',
        },
        {
          title: trlb('op_standard_drainage'),
          component: (
            <StandardRequiredSection
              {...{ edit, form }}
              formPath={formPath + 'drainage.'}
              title='op_standard_drainage'
            />
          ),
          formPath: formPath + 'drainage',
        },
        {
          title: trlb('op_standard_monopolar'),
          component: (
            <StandardRequiredSection
              {...{ edit, form }}
              formPath={formPath + 'monopolar.'}
              title='op_standard_monopolar'
            />
          ),
          formPath: formPath + 'monopolar',
        },
        {
          title: trlb('op_standard_bipolar'),
          component: (
            <StandardRequiredSection
              {...{ edit, form }}
              formPath={formPath + 'bipolar.'}
              title='op_standard_bipolar'
            />
          ),
          formPath: formPath + 'bipolar',
        },
        {
          title: trlb('op_standard_histology'),
          component: (
            <StandardRequiredSection
              {...{ edit, form }}
              formPath={formPath + 'histology.'}
              title='op_standard_histology'
            />
          ),
          formPath: formPath + 'histology',
        },
        {
          title: trlb('op_standard_bacteriology'),
          component: (
            <StandardRequiredSection
              {...{ edit, form }}
              formPath={formPath + 'bacteriology.'}
              title='op_standard_bacteriology'
            />
          ),
          formPath: formPath + 'bacteriology',
        },
        {
          title: trlb('op_standard_notes'),
          component: <Notes {...{ edit, form }} formPath={formPath + 'notes'} />,
          formPath: formPath + 'notes',
        },
      ]
      : []),
  ]
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <OpStandardSection form={form} sections={intraOpSections}
        warningFields={warningFields}
        showBillingWarning={showBillingWarning}
        showDocumentationWarnings={showDocumentationWarnings} />
      {!caseDetails ? <Notes {...{ edit, form }} formPath={formPath + 'notes'} /> : null}
    </Box>
  )
}

export default IntraOpSection
