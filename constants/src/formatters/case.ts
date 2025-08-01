import {
  Case,
  CaseIntraOpSection,
  CaseOpStandardEquipment,
  CaseOpStandardMaterial,
  CaseOpStandardMedication,
  CaseOpStandardStandardSection,
  CaseOpStandardSterileGood,
  CasePostOpSection,
  CasePreOpSection,
  CustomBg,
  ILimitedCase,
  OpStandard,
  OpStandardEquipment,
  OpStandardMaterial,
  OpStandardMedication,
  OpStandardPreOpSection,
  OpStandardStandardSection,
  OpStandardSterileGood,
} from '../types'
import { CaseStatus, getSnapshottedSurgeryName } from '../enums'

export const formatCaseResponse = (caseItem: Case | ILimitedCase) => ({
  ...caseItem,
  bookingPatient: {
    ...caseItem.bookingPatient,
    birthDate: new Date(caseItem.bookingPatient?.birthDate),
  },
  bookingSection: {
    ...caseItem.bookingSection,
    date: new Date(caseItem.bookingSection?.date),
  },
  lastStatusEdit: caseItem.lastStatusEdit ? new Date(caseItem.lastStatusEdit) : null,
  ...('associatedPatient' in caseItem && {
    associatedPatient: {
      ...caseItem.associatedPatient,
      birthDate: new Date(caseItem.associatedPatient?.birthDate),
    }
  }),
  ...('updatedAt' in caseItem && {
    updatedAt: new Date(caseItem.updatedAt)
  }),
})

export const formatCasesResponse = (cases: Case[]) => {
  if (!Array.isArray(cases)) return []

  const parsedCases = cases.map(current => {
    // XXX Clarification of the following expect-error: this function is used
    // very improperly all around the code, so the "case" array provided here
    // can contain:
    // - null
    // - undefined
    // - empty strings.
    // Yes, empty strings because a null response from an api call results in a
    // res.data containing an empty string.
    // @ts-expect-error the comparison is not unintentional
    if (current === null || current === undefined || current === '') return null

    return formatCaseResponse(current)
  })

  return parsedCases
}

export const formatCase: any = (c: Partial<Case>) => ({
  tenantId: c?.tenantId ?? '',
  caseId: c?.caseId ?? '',
  caseNumber: c?.caseNumber ?? '',
  lastEdit: c?.lastEdit ?? null,
  lastStatusEdit: c?.lastStatusEdit ?? null,
  bookingPatient: {
    patientId: c?.bookingPatient?.patientId ?? '',
    patientNumber: c?.bookingPatient?.patientNumber ?? '',
    debtorNumber: c?.bookingPatient?.debtorNumber ?? '',
    title: c?.bookingPatient?.title ?? '',
    name: c?.bookingPatient?.name ?? '',
    surname: c?.bookingPatient?.surname ?? '',
    birthDate: c?.bookingPatient?.birthDate ?? null,
    gender: c?.bookingPatient?.gender ?? '',
    genderBirth: c?.bookingPatient?.genderBirth ?? '',
    genderSpecifics: c?.bookingPatient?.genderSpecifics ?? '',
    nationality: c?.bookingPatient?.nationality ?? '',
    phoneNumber: c?.bookingPatient?.phoneNumber ?? '',
    email: c?.bookingPatient?.email ?? '',
    address: {
      street: c?.bookingPatient?.address?.street ?? '',
      houseNumber: c?.bookingPatient?.address?.houseNumber ?? '',
      postalCode: c?.bookingPatient?.address?.postalCode ?? '',
      city: c?.bookingPatient?.address?.city ?? '',
      country: c?.bookingPatient?.address?.country ?? '',
    },
  },
  costEstimate: c?.costEstimate ?? [],
  receipts: c?.receipts ?? [],
  uploads: c?.uploads ?? [],
  checkinUploads: c?.checkinUploads ?? [],
  checkoutUploads: c?.checkoutUploads ?? [],
  intraOpUploads: c?.intraOpUploads ?? [],
  timestamps: {
    patientArrivalTimestamp: c?.timestamps?.patientArrivalTimestamp ?? null,
    preopStartedTimestamp: c?.timestamps?.preopStartedTimestamp ?? null,
    preopFinishedTimestamp: c?.timestamps?.preopFinishedTimestamp ?? null,
    anesthesiologistOnSiteTimestamp: c?.timestamps?.anesthesiologistOnSiteTimestamp ?? null,
    anesthesiaStartedTimestamp: c?.timestamps?.anesthesiaStartedTimestamp ?? null,
    intubationTimestap: c?.timestamps?.intubationTimestap ?? null,
    releaseForSurgeryTimestap: c?.timestamps?.releaseForSurgeryTimestap ?? null,
    cutTimestap: c?.timestamps?.cutTimestap ?? null,
    endOfSurgeryTimestap: c?.timestamps?.endOfSurgeryTimestap ?? null,
    extubationTimestap: c?.timestamps?.extubationTimestap ?? null,
    anesthesiaFinishedTimestap: c?.timestamps?.anesthesiaFinishedTimestap ?? null,
    surgeryStartTimestamp: c?.timestamps?.surgeryStartTimestamp ?? null,
    surgeryEndTimestamp: c?.timestamps?.surgeryEndTimestamp ?? null,
    roomEnterTimestamp: c?.timestamps?.roomEnterTimestamp ?? null,
    readyForRecoveryTimestamp: c?.timestamps?.readyForRecoveryTimestamp ?? null,
    roomExitTimestmap: c?.timestamps?.roomExitTimestmap ?? null,
    postOpStartedTimestap: c?.timestamps?.postOpStartedTimestap ?? null,
    postOpFinishedTimestap: c?.timestamps?.postOpFinishedTimestap ?? null,
    dischargedTimestamp: c?.timestamps?.dischargedTimestamp ?? null,
    arrivedInRecoveryRoomTimestamp: c?.timestamps?.arrivedInRecoveryRoomTimestamp ?? null,
    readyForReleaseTimestamp: c?.timestamps?.readyForReleaseTimestamp ?? null,
    endOfSurgicalMeasuresTimestamp: c?.timestamps?.endOfSurgicalMeasuresTimestamp ?? null,
  },
  status: c?.status ?? CaseStatus.PENDING,
  anesthesiologistsId: c?.anesthesiologistsId ?? [],
  operatingRoomId: c?.operatingRoomId ?? '',
  snapshottedContract: c?.snapshottedContract ?? {},

  bookingSection: {
    doctorId: c?.bookingSection?.doctorId ?? '',
    date: c?.bookingSection?.date ?? null,
    contractId: c?.bookingSection?.contractId ?? '',
    opStandardId: c?.bookingSection?.opStandardId ?? '',
    roomType: c?.bookingSection?.roomType ?? null,
    name: c?.bookingSection?.name ?? '',
    duration: c?.bookingSection?.duration ?? null,
    calendarNotes: c?.bookingSection?.calendarNotes ?? '',
    calendarPreOpNotes: c?.bookingSection?.calendarPreOpNotes ?? '',
    calendarPostOpNotes: c?.bookingSection?.calendarPostOpNotes ?? '',
  },
  notesSection: {
    notes: c?.notesSection?.notes ?? '',
  },
  surgerySection: {
    anesthesiologistOpStandardId: c?.surgerySection?.anesthesiologistOpStandardId ?? '',
    side: c?.surgerySection?.side ?? '',
    positions: c?.surgerySection?.positions ?? [],
    preferredAnesthesia: c?.surgerySection?.preferredAnesthesia ?? null,
    surgeryBodyLocations: c?.surgerySection?.surgeryBodyLocations ?? [],
  },
  preOpSection: c?.preOpSection ?? {},
  anesthesiaSection: {
    anesthesiologistPresence: c?.anesthesiaSection?.anesthesiologistPresence ?? '',
    anesthesiologistOpStandardId: c?.anesthesiaSection?.anesthesiologistOpStandardId ?? '',
    name: c?.anesthesiaSection?.name ?? '',
    validFrom: c?.anesthesiaSection?.validFrom ?? null,
    region: c?.anesthesiaSection?.region ?? null,
    subregion: c?.anesthesiaSection?.subregion ?? null,
    side: c?.anesthesiaSection?.side ?? null,
    createdBy: c?.anesthesiaSection?.createdBy ?? '',
    preExistingConditions: c?.anesthesiaSection?.preExistingConditions ?? [],
    interoperativeMeasure: c?.anesthesiaSection?.interoperativeMeasure ?? [],
    materials: c?.anesthesiaSection?.materials ?? [],
    ventilationMaterials: c?.anesthesiaSection?.ventilationMaterials ?? [],
    medications: c?.anesthesiaSection?.medications ?? [],
    positions: c?.anesthesiaSection?.positions ?? [],
    requiredServices: c?.anesthesiaSection?.requiredServices ?? [],
    anesthesiaList: c?.anesthesiaSection?.anesthesiaList ?? [],
    volatileAnestheticsTimestamps: c?.anesthesiaSection?.volatileAnestheticsTimestamps ?? {
      oxygen: [
        {
          start: null,
          end: null,
        },
      ],
      n20: [
        {
          start: null,
          end: null,
        },
      ],
      desflurane: [
        {
          start: null,
          end: null,
        },
      ],
      sevoflurane: [
        {
          start: null,
          end: null,
        },
      ],
    },
    anesthesiologistOpStandard: c?.anesthesiaSection?.anesthesiologistOpStandard ?? null,
  },
  intraOpSection: c?.intraOpSection ?? {},
  postOpSection: c?.postOpSection ?? {},
  snapshottedCountControl: c?.snapshottedCountControl ?? null,
  confirmationNote: c?.confirmationNote ?? '',
  patientRef: c?.patientRef ?? undefined,
  updatedAt: c?.updatedAt ?? undefined,
  // XXX i don't like this one bit, but we should fix this when we fix all the
  // formatters scattered around
  closed: c?.closed ?? false
})

export const formatCaseForm: any = (c: Partial<Case>) => ({
  ...formatCase(c),
  documentsToUpload: [],
  checkinDocumentsToUpload: [],
  checkoutDocumentsToUpload: [],
  filesToDelete: [],
})

export const formatCaseToLimitedCase = (caseItem: Case): ILimitedCase => ({
  caseId: caseItem.caseId,
  caseNumber: caseItem.caseNumber,
  patientRef: caseItem.patientRef,
  surgeryName: getSnapshottedSurgeryName(caseItem),
  anesthesiologistsId: caseItem.anesthesiologistsId,
  confirmationNote: caseItem.confirmationNote,
  bookingSection: {
    name: caseItem.bookingSection.name,
    contractId: caseItem.bookingSection.contractId,
    opStandardId: caseItem.bookingSection.opStandardId,
    date: caseItem.bookingSection.date,
    duration: caseItem.bookingSection.duration,
    doctorId: caseItem.bookingSection.doctorId,
    roomType: caseItem.bookingSection.roomType,
    calendarNotes: caseItem.bookingSection.calendarNotes,
    calendarPreOpNotes: caseItem.bookingSection.calendarPreOpNotes,
    calendarPostOpNotes: caseItem.bookingSection.calendarPostOpNotes,
  },
  associatedDoctor: {
    id: caseItem.associatedDoctor?.id,
    _id: caseItem.associatedDoctor?._id,
    title: caseItem.associatedDoctor?.title,
    firstName: caseItem.associatedDoctor?.firstName,
    lastName: caseItem.associatedDoctor?.lastName,
    debtorNumber: caseItem.associatedDoctor?.debtorNumber,
  },
  bookingPatient: {
    patientId: caseItem.bookingPatient?.patientId,
    name: caseItem.bookingPatient?.name,
    surname: caseItem.bookingPatient?.surname,
    birthDate: caseItem.bookingPatient?.birthDate,
    gender: caseItem.bookingPatient?.gender,
    genderBirth: caseItem.bookingPatient?.genderBirth,
    genderSpecifics: caseItem.bookingPatient?.genderSpecifics,
  },
  operatingRoomId: caseItem.operatingRoomId,
  timestamps: caseItem.timestamps,
  lastStatusEdit: caseItem.lastStatusEdit,
  status: caseItem.status,
  tenantId: caseItem.tenantId,
  closed: caseItem.closed,
  pcMaterial: caseItem.pcMaterial,
})

export const extractCaseDataFromOpStandard = (
  opStandard: OpStandard,
): {
  preOpSection: CasePreOpSection
  intraOpSection: Partial<CaseIntraOpSection>
  postOpSection: CasePostOpSection
} => {
  const parseOpStandardMaterials = (input: OpStandardMaterial[]): CaseOpStandardMaterial[] => {
    return input.map(mat => ({
      amount: mat.prefill
        ? mat.amount
        : 0,
      materialId: mat.materialId,
      notes: mat.notes
    }))
  }

  const parseOpStandardEquipments = (input: OpStandardEquipment[]): CaseOpStandardEquipment[] => {
    return input.map(equip => ({
      amount: equip.prefill
        ? equip.amount
        : 0,
      name: equip.name,
      notes: equip.notes
    }))
  }

  const parseOpStandardSterileGoods = (input: OpStandardSterileGood[]):
  CaseOpStandardSterileGood[] => {
    return input.map(good => ({
      amount: good.prefill ? good.amount : 0,
      sterileGood: good.sterileGood,
      notes: good.notes,
      unitType: good.unitType,
    }))
  }

  const parseOpStandardMedications = (input: OpStandardMedication[]):
  CaseOpStandardMedication[] => {
    return input.map(med => ({
      amount: med.prefill ? med.amount : 0,
      medicationId: med.medicationId,
      notes: med.notes,
      dosage: med.dosage,
      units: med.units,
    }))
  }

  const parseCaseOpStandardSection = (input: OpStandardStandardSection):
  CaseOpStandardStandardSection => {
    return {
      instructions: input.instructions,
      materials: parseOpStandardMaterials(input.materials),
      medications: parseOpStandardMedications(input.medications),
      equipments: parseOpStandardEquipments(input.equipments),
      sterileGoods: parseOpStandardSterileGoods(input.sterileGoods),
    }
  }

  const parseOpStandardPostOpSection = (input: OpStandard): CasePostOpSection => {
    return {
      ...input.postOpSection,
      materials: parseOpStandardMaterials(input.postOpSection.materials),
      medications: parseOpStandardMedications(input.postOpSection.medications),
      anesthesiologicalServices: [],
      postOperativeMeasures: [],
    }
  }

  const parseOpStandardIntraOpSection = (input: OpStandard): Partial<CaseIntraOpSection> => {
    return {
      covering: parseCaseOpStandardSection(input.intraOpSection.covering),
      disinfection: parseCaseOpStandardSection(input.intraOpSection.disinfection),
      disposableMaterial: parseCaseOpStandardSection(input.intraOpSection.disposableMaterial),
      equipment: parseCaseOpStandardSection(input.intraOpSection.equipment),
      extras: parseCaseOpStandardSection(input.intraOpSection.extras),
      gloves: parseCaseOpStandardSection(input.intraOpSection.gloves),
      medication_rinse: parseCaseOpStandardSection(input.intraOpSection.medication_rinse),
      particularities: parseCaseOpStandardSection(input.intraOpSection.particularities),
      positioningTools: parseCaseOpStandardSection(input.intraOpSection.positioningTools),
      surgicalInstruments: parseCaseOpStandardSection(input.intraOpSection.surgicalInstruments),
      sutureMaterial: parseCaseOpStandardSection(input.intraOpSection.sutureMaterial),
      notes: input.intraOpSection.notes,
    }
  }

  const parsePreOpSection = (preOpSection: OpStandardPreOpSection): CasePreOpSection => ({
    instructions: preOpSection.instructions,
    materials: parseOpStandardMaterials(preOpSection.materials),
    medications: parseOpStandardMedications(preOpSection.medications),
    notes: preOpSection.notes,
  })

  return {
    preOpSection: parsePreOpSection(opStandard.preOpSection),
    intraOpSection: parseOpStandardIntraOpSection(opStandard),
    postOpSection: parseOpStandardPostOpSection(opStandard),
  }
}

export const getNewCustomBG = (): CustomBg => ({
  company: '',
  name: '',
  surname: '',
  street: '',
  streetNumber: '',
  city: '',
  postalCode: '',
  country: '',
  bgDebtorNumber: '',
})
