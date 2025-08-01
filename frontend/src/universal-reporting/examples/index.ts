import { tField, tViewItem } from '@smambu/lib.constants'
import { InsuranceData } from './Insurances/Data'
import { InsuranceFields } from './Insurances/Fields'
import { insuranceRepresentation } from './Insurances/Representation'
import { complex1Data } from './Complex1/Complex1Data'
import { complex1Fields } from './Complex1/Complex1Fields'
import { complex1Representation } from './Complex1/Complex1Representation'
import { vatValuesData } from './VatValues/VatValuesData'
import { vatValuesFields } from './VatValues/VatValuesFields'
import { vatValuesRepresentation } from './VatValues/VatValuesRepresentation'
import { automaticTableData } from './AutomaticTable/AutomaticTableData'
import { automaticTableFields } from './AutomaticTable/AutomaticTableFields'
import { automaticTableRepresentation } from './AutomaticTable/AutomaticTableRepresentation'
import { simple1Data } from './Simple1/Simple1Data'
import { simple1Fields } from './Simple1/Simple1Fields'
import { simple1Representation } from './Simple1/Simple1Representation'
import { simple3Data } from './Simple3/Simple3Data'
import { simple3Fields } from './Simple3/Simple3Fields'
import { simple3Representation } from './Simple3/Simple3Representation'
import { simple2Data } from './Simple2/Simple2Data'
import { simple2Fields } from './Simple2/Simple2Fields'
import { simple2Representation } from './Simple2/Simple2Representation'
import { simple5Data } from './Simple5/Simple5Data'
import { simple5Fields } from './Simple5/Simple5Fields'
import { simple5Representation } from './Simple5/Simple5Representation'

export interface Example {
  title: string
  inputRepresentation: tViewItem[]
  inputFields: tField[]
  data: Record<string, any>
}

export const allExamples: Example[] = [

  {
    title: 'Complex 1 (auto-values)',
    inputRepresentation: complex1Representation,
    inputFields: complex1Fields,
    data: complex1Data,
  },
  {
    title: 'vat values',
    inputRepresentation: vatValuesRepresentation,
    inputFields: vatValuesFields,
    data: vatValuesData,
  },
  {
    title: 'insurance',
    inputRepresentation: insuranceRepresentation,
    inputFields: InsuranceFields,
    data: InsuranceData,
  },
  {
    title: 'automatic table',
    inputRepresentation: automaticTableRepresentation,
    inputFields: automaticTableFields,
    data: automaticTableData,
  },
  {
    title: 'simple 1',
    inputRepresentation: simple1Representation,
    inputFields: simple1Fields,
    data: simple1Data,
  },
  {
    title: 'simple 2',
    inputRepresentation: simple2Representation,
    inputFields: simple2Fields,
    data: simple2Data,
  },
  {
    title: 'simple 3',
    inputRepresentation: simple3Representation,
    inputFields: simple3Fields,
    data: simple3Data,
  },
  {
    title: 'simple 5',
    inputRepresentation: simple5Representation,
    inputFields: simple5Fields,
    data: simple5Data,
  }
]
