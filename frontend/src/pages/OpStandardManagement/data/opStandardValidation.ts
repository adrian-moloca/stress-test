import {
  AnesthesiaRegion,
  tAnesthesiaSubRegion,
  AnesthesiaSubRegion,
  AnesthesiaType,
  CentralRegionAnesthesia,
  Instruction,
  OpStandard,
  OpStandardBookingSection,
  OpStandardEquipment,
  OpStandardIntraOpSection,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardPreOpSection,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import * as yup from 'yup'

const preOpSectionValidation = yup.object<OpStandardPreOpSection>().shape({
  instructions: yup.array().of(
    yup.object<Instruction>().shape({
      content: yup.string().required(trlb('contract_instruction_is_required')),
      mandatory: yup.boolean(),
    }),
  ),
  materials: yup.array().of(
    yup.object<OpStandardMaterial>().shape({
      materialId: yup.string().required(trlb('contract_material_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(0, trlb('contract_amount_must_not_be_zero_or_less_than_zero')),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
  medications: yup.array().of(
    yup.object<OpStandardMedication>().shape({
      medicationId: yup.string().required(trlb('contract_medication_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(-1, trlb('contract_amount_must_not_be_less_than_zero')),
      dosage: yup.number().notRequired()
        .moreThan(0, trlb('contract_dosage_must_not_be_zero_or_less_than_zero')),
      units: yup.string(),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
  notes: yup.string(),
})

const genericSectionValidation = yup.object<OpStandardPreOpSection>().shape({
  instructions: yup.array().of(
    yup.object<Instruction>().shape({
      content: yup.string().required(trlb('contract_instruction_is_required')),
      mandatory: yup.boolean(),
    }),
  ),
  materials: yup.array().of(
    yup.object<OpStandardMaterial>().shape({
      materialId: yup.string().required(trlb('contract_material_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(0, trlb('contract_amount_must_not_be_zero_or_less_than_zero')),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
  medications: yup.array().of(
    yup.object<OpStandardMedication>().shape({
      medicationId: yup.string().required(trlb('contract_medication_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(-1, trlb('contract_amount_must_not_be_less_than_zero')),
      dosage: yup.number().notRequired()
        .moreThan(0, trlb('contract_dosage_must_not_be_zero_or_less_than_zero')),
      units: yup.string(),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
  equipments: yup.array().of(
    yup.object<OpStandardEquipment>().shape({
      name: yup.string().required(trlb('contract_equipment_name_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(0, trlb('contract_amount_must_not_be_zero_or_less_than_zero')),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
  sterileGoods: yup.array().of(
    yup.object<OpStandardEquipment>().shape({
      unitType: yup.string().required(trlb('contract_unit_type_is_required')),
      sterileGood: yup.string().required(trlb('contract_sterile_good_is_required')),
      amount: yup
        .number()
        .required(trlb('contract_amount_is_required'))
        .moreThan(0, trlb('contract_amount_must_not_be_zero_or_less_than_zero')),
      mandatory: yup.boolean(),
      notes: yup.string(),
    }),
  ),
})

export const opStandardValidationSchema = yup.object<Omit<OpStandard, 'opStandardId'>>().shape({
  name: yup
    .string()
    .required(trlb('contract_op_standard_name_is_required'))
    .typeError(trlb('contract_op_standard_name_must_be_string')),
  previousContractOpStandardId: yup.string().required(trlb('select_op_standard_to_replace'))
    .nullable(),
  subjectArea: yup.string(),
  surgeryDurationInMinutes: yup
    .number()
    .required(trlb('contract_surgery_duration_is_required'))
    .moreThan(0, trlb('contract_surgery_duration_must_not_be_zero_or_less_than_zero'))
    .typeError(trlb('contract_surgery_duration_must_be_number')),
  operatingRoomIds: yup.array().of(yup.string())
    .min(1, 'contract_one_or_more_operating_room_must_be_selected'),
  bookingSection: yup.object<OpStandardBookingSection>().shape({
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
    sideRequired: yup.boolean(),
    bodyRegions: yup.array().of(yup.string()),
    spinalSegments: yup.array().of(yup.string()),
    fingers: yup.array().of(yup.string()),
    teeth: yup.array().of(yup.number()),
    feet: yup.array().of(yup.string()),
    positions: yup
      .array()
      .of(yup.string().required(trlb('commons_required')))
      .min(1, 'contract_position_one_required'),
    userCanUploadDocuments: yup.boolean(),
  }),
  preOpSection: preOpSectionValidation,
  intraOpSection: yup.object<OpStandardIntraOpSection>().shape({
    gloves: genericSectionValidation,
    positions: yup.array().of(yup.string().required(trlb('commons_required'))),
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
    tourniquet: yup.object().shape({
      blutleere: yup.object().shape({
        required: yup.boolean(),
      }),
      tourniquet: yup.object().shape({
        required: yup.boolean(),
      }),
    }),
    x_ray: yup.object().shape({
      required: yup.boolean(),
    }),
    drainage: yup.object().shape({
      required: yup.boolean(),
    }),
    monopolar: yup.object().shape({
      required: yup.boolean(),
    }),
    bipolar: yup.object().shape({
      required: yup.boolean(),
    }),
    histology: yup.object().shape({
      required: yup.boolean(),
    }),
    bacteriology: yup.object().shape({
      required: yup.boolean(),
    }),
    notes: yup.string(),
  }),
  postOpSection: preOpSectionValidation.shape({
    ...preOpSectionValidation.fields,
    postOperativeMeasures: yup.array().of(yup.string()),
    anesthesiologicalServices: yup.array().of(yup.string()),
  }),
  changeRequest: yup.string(),
})
