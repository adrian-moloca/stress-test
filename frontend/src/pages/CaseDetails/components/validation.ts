import * as yup from 'yup'
import { trlb } from 'utilities/translator/translator'
import {
  AnesthesiaRegion,
  AnesthesiaSubRegion,
  tAnesthesiaSubRegion,
  AnesthesiaType,
  AnesthesiologicalService,
  AnesthesiologistOpStandard,
  CaseIntraOpSection,
  CaseOpStandardEquipment,
  CaseOpStandardStandardSection,
  CaseOpStandardSterileGood,
  CasePreOpSection,
  CentralRegionAnesthesia,
  Identifier,
  Instruction,
  Measures,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardPosition_Name,
  OpStandardPostOpSection,
  PreExistingCondition,
} from '@smambu/lib.constants'

const opStandardMaterialValidation = yup // : yup.Schema<OpStandardMaterial> = yup
  .object<OpStandardMaterial>()
  .shape({
    amount: yup.number()
      .required(trlb('contract_amount_is_required'))
      .min(0, trlb('case_amount_min_zero')),
    notes: yup.string(),
    materialId: yup.mixed<Identifier>().required(trlb('commons_generic_required_value')),
  })

const opStandardMedicationValidation = yup // : yup.Schema<OpStandardMedication> = yup
  .object<OpStandardMedication>()
  .shape({
    medicationId: yup.mixed<Identifier>().required(trlb('commons_generic_required_value')),
    amount: yup.number()
      .required(trlb('contract_amount_is_required'))
      .min(0, trlb('case_amount_min_zero')),
    dosage: yup.number().nullable(),
    units: yup.string(),
    notes: yup.string(),
  })

export const anesthesiaValidation = // : yup.ObjectSchema<Omit<AnesthesiologistOpStandard, 'anesthesiologistOpStandardId'>> =
  yup.object<AnesthesiologistOpStandard>().shape({
    preExistingConditions: yup
      .array()
      .of(yup.mixed<PreExistingCondition>().oneOf(Object.values(PreExistingCondition))
        .required())
      .defined()
      .required(),
    interoperativeMeasure: yup
      .array()
      .of(yup.mixed<Measures>().oneOf(Object.values(Measures))
        .required())
      .defined(),
    materials: yup.array().of(opStandardMaterialValidation)
      .required(),
    medications: yup.array().of(opStandardMedicationValidation)
      .required(),
    ventilationMaterials: yup.array().of(opStandardMaterialValidation)
      .required(),
    positions: yup
      .array()
      .of(yup.mixed<OpStandardPosition_Name>().oneOf(Object.values(OpStandardPosition_Name))
        .required())
      .defined(),
    requiredServices: yup
      .array()
      .of(yup.mixed<AnesthesiologicalService>().oneOf(Object.values(AnesthesiologicalService))
        .required())
      .defined(),
    anesthesiaList: yup
      .array()
      .of(
        yup.lazy(item => {
          switch (item.anesthesiaType) {
            case AnesthesiaType.GENERAL_ANESTHESIA:
            case AnesthesiaType.ANALGOSEDATION:
            case AnesthesiaType.STAND_BY:
              return yup.object().shape({
                anesthesiaType: yup.string().required(trlb('op_standard_anesthesia_value_required')),
                anesthesiaBodyRegion: yup.string(),
                anesthesiaBodySubRegion: yup.string(),
                side: yup.string(),
              })
            case AnesthesiaType.PERIPHERAL_REGION_ANESTHESIA:
              return yup.object().shape({
                anesthesiaType: yup.string().required(trlb('op_standard_anesthesia_value_required')),
                anesthesiaBodyRegion: yup
                  .mixed<AnesthesiaRegion>()
                  .oneOf(Object.values(AnesthesiaRegion))
                  .required(trlb('op_standard_anesthesia_value_required')),
                anesthesiaBodySubRegion: yup
                  .mixed<tAnesthesiaSubRegion>()
                  .oneOf(Object.values(AnesthesiaSubRegion))
                  .required(trlb('op_standard_anesthesia_value_required')),
              })
            case AnesthesiaType.CENTRAL_REGION_ANESTHESIA:
              return yup.object().shape({
                anesthesiaType: yup.string().required(trlb('op_standard_anesthesia_value_required')),
                anesthesiaBodyRegion: yup
                  .mixed<CentralRegionAnesthesia>()
                  .oneOf(Object.values(CentralRegionAnesthesia))
                  .required(trlb('op_standard_anesthesia_value_required')),
                anesthesiaBodySubRegion: yup.string(),
                side: yup.string(),
              })
            default:
              return yup.object().shape({
                anesthesiaType: yup.string().required(trlb('op_standard_anesthesia_value_required')),
              })
          }
        }),
      )
      .required('contract_anesthesia_list_one_required'),
  })

export const preOpSectionValidation = yup.object<CasePreOpSection>().shape({
  instructions: yup.array().of(
    yup.object<Instruction>().shape({
      content: yup.string().required(trlb('contract_instruction_is_required')),
      mandatory: yup.boolean(),
    }),
  ),
  materials: yup.array().of(opStandardMaterialValidation),
  medications: yup.array().of(opStandardMedicationValidation),
})

const genericSectionValidation = yup.object<CaseOpStandardStandardSection>().shape({
  instructions: yup.array().of(
    yup.object<Instruction>().shape({
      content: yup.string().required(trlb('contract_instruction_is_required')),
      mandatory: yup.boolean(),
    }),
  ),
  materials: yup.array().of(opStandardMaterialValidation),
  medications: yup.array().of(opStandardMedicationValidation),
  equipments: yup.array().of(
    yup.object<CaseOpStandardEquipment>().shape({
      name: yup.string().required(trlb('contract_equipment_name_is_required')),
      amount: yup.number().required(trlb('contract_amount_is_required'))
        .min(0, trlb('case_amount_min_zero')),
      notes: yup.string(),
    }),
  ),
  sterileGoods: yup.array().of(
    yup.object<CaseOpStandardSterileGood>().shape({
      unitType: yup.string().required(trlb('contract_unit_type_is_required')),
      sterileGood: yup.string().required(trlb('contract_sterile_good_is_required')),
      amount: yup.number().required(trlb('contract_amount_is_required'))
        .min(0, trlb('case_amount_min_zero')),
      notes: yup.string(),
    }),
  ),
})

export const intraOpValidation = yup.object<CaseIntraOpSection>().shape({
  gloves: genericSectionValidation,
  positions: yup.array().of(yup.string()),
  positioningTools: genericSectionValidation,
  equipment: genericSectionValidation,
  disinfection: genericSectionValidation,
  covering: genericSectionValidation,
  surgicalInstruments: genericSectionValidation,
  disposableMaterial: genericSectionValidation,

  sutureMaterial: genericSectionValidation,
  medication_rinse: genericSectionValidation,
  extras: genericSectionValidation,
  particularities: genericSectionValidation,
})

export const postOpValidation = yup.object<OpStandardPostOpSection>().shape({
  postOperativeMeasures: yup.array().of(yup.string()),
  anesthesiologicalServices: yup.array().of(yup.string()),
  materials: yup.array().of(opStandardMaterialValidation),
  medications: yup.array().of(opStandardMedicationValidation),
  notes: yup.string(),
})
