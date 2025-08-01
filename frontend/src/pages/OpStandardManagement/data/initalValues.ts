import { AnesthesiaType, OpStandard, OpStandardAnesthesiaRow } from '@smambu/lib.constants'

const emptySubSectionInitialValues = {
  instructions: [],
  materials: [],
  medications: [],
  equipments: [],
  sterileGoods: [],
}

// The us ask for all sections as empty, but may change in the future
const subSectionInitialValues = emptySubSectionInitialValues

export const getEmptyAnesthesiaRow = (): OpStandardAnesthesiaRow => ({
  anesthesiaType: AnesthesiaType.GENERAL_ANESTHESIA,
  anesthesiaBodyRegion: '',
  anesthesiaBodySubRegion: '',
  side: '',
})

export const opStandardInitialValues: Omit<OpStandard, 'opStandardId' | 'tenantId'> = {
  name: '',
  previousContractOpStandardId: '',
  subjectArea: '',
  operatingRoomIds: [],
  surgeryDurationInMinutes: 0,
  bookingSection: {
    anesthesiaList: [],
    sideRequired: false,
    bodyRegions: [],
    spinalSegments: [],
    fingers: [],
    teeth: [],
    feet: [],
    positions: [],
    userCanUploadDocuments: false,
  },
  preOpSection: {
    instructions: subSectionInitialValues.instructions,
    materials: subSectionInitialValues.materials,
    medications: subSectionInitialValues.medications,
    notes: '',
  },
  intraOpSection: {
    gloves: subSectionInitialValues,
    positions: [],
    positioningTools: subSectionInitialValues,
    equipment: subSectionInitialValues,
    disinfection: subSectionInitialValues,
    covering: subSectionInitialValues,
    surgicalInstruments: subSectionInitialValues,
    disposableMaterial: subSectionInitialValues,
    sutureMaterial: subSectionInitialValues,
    medication_rinse: subSectionInitialValues,
    extras: subSectionInitialValues,
    particularities: subSectionInitialValues,
    tourniquet: {
      blutleere: { required: false },
      tourniquet: { required: false },
    },
    x_ray: { required: false },
    drainage: { required: false },
    monopolar: { required: false },
    bipolar: { required: false },
    histology: { required: false },
    bacteriology: { required: false },
    notes: '',
  },
  postOpSection: {
    postOperativeMeasures: [],
    anesthesiologicalServices: [],
    instructions: subSectionInitialValues.instructions,
    materials: subSectionInitialValues.materials,
    medications: subSectionInitialValues.medications,
    notes: '',
  },
  changeRequest: '',
}
