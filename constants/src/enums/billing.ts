import { AnesthesiaType } from './others'

export enum InvoiceType {
  CHARGE_ABGABE = 'CHARGE_ABGABE',
  SACHKOSTEN = 'SACHKOSTEN',
  ANAESTHESIA = 'ANAESTHESIA',
  MATERIAL_PRIVATE = 'MATERIAL_PRIVATE',
  PLASTIC_SURGERY = 'PLASTIC_SURGERY',
  PLASTIC_SURGERY_VAT = 'PLASTIC_SURGERY_VAT',
  SELF_PAYER = 'SELF_PAYER',
  PC_MATERIALS = 'PC_MATERIALS',
  OVERNIGHT_STAY = 'OVERNIGHT_STAY',
  EXTERNAL = 'EXTERNAL',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum InvoiceStatus {
  EMITTED = 'EMITTED',
  PARTIALLY_CANCELLED = 'PARTIALLY_CANCELLED',
  CANCELLED = 'CANCELLED',
  CREATED = 'CREATED',
  PRESCRIBED = 'PRESCRIBED',
}

export enum InvoicePDFArchiveStatus {
  REQUESTED = 'REQUESTED',
  READY_FOR_DOWNLOAD = 'READY_FOR_DOWNLOAD',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  READY_FOR_DELETION = 'READY_FOR_DELETION',
  DELETED = 'DELETED'
}

export const exportableInvoicesStatuses = [
  InvoiceStatus.EMITTED,
  InvoiceStatus.PARTIALLY_CANCELLED,
  InvoiceStatus.CANCELLED,
]

export const payableInvoicesStatuses = [InvoiceStatus.EMITTED, InvoiceStatus.PARTIALLY_CANCELLED]

export const cancellableBillsStatuses = [
  InvoiceStatus.PARTIALLY_CANCELLED,
  InvoiceStatus.EMITTED,
  InvoiceStatus.PRESCRIBED,
]

export const notCancellableBillsTypes = [InvoiceType.CREDIT_NOTE]
export const invoiceTypesWithInvoiceNumber = [
  InvoiceType.ANAESTHESIA,
  InvoiceType.CHARGE_ABGABE,
  InvoiceType.MATERIAL_PRIVATE,
  InvoiceType.OVERNIGHT_STAY,
  InvoiceType.PC_MATERIALS,
  InvoiceType.PLASTIC_SURGERY,
  InvoiceType.PLASTIC_SURGERY_VAT,
  InvoiceType.SACHKOSTEN,
  InvoiceType.SELF_PAYER,
]

export enum BillingCategory {
  A = 'A',
  B = 'B',
  C1 = 'C1',
  C2 = 'C2',
  C3 = 'C3',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
}

export enum BillingPreviewTypes {
  GENERATE = 'GENERATE',
  CANCEL = 'CANCEL',
}

export enum BillsListCSVExport {
  INVOICES = 'INVOICES',
  RECIPIENT = 'RECIPIENT',
}

export const GoACategories = [BillingCategory.A, BillingCategory.B]
export const OPSCategories = [BillingCategory.D, BillingCategory.E, BillingCategory.F]
export const ICDCategories = [BillingCategory.D, BillingCategory.E, BillingCategory.F]

export const intraOpMaterialsSubSections = [
  'gloves',
  'positioningTools',
  'equipment',
  'disinfection',
  'covering',
  'surgicalInstruments',
  'disposableMaterial',
  'sutureMaterial',
  'medication_rinse',
  'extras',
  'particularities',
]

const intraOpMaterialsMissingInfo = (label: string) => ({
  materials: { amount: (id: string) => `intraOpSection.${label}.materials.${id}.amount` },
  medications: { amount: (id: string) => `intraOpSection.${label}.medications.${id}.amount` },
  equipments: { amount: (id: string) => `intraOpSection.${label}.equipments.${id}.amount` },
  sterileGoods: { amount: (id: string) => `intraOpSection.${label}.sterileGoods.${id}.amount` },
})

export const MissingInfo = {
  bookingPatient: {
    patientId: 'bookingPatient.patientId',
    name: 'bookingPatient.name',
    surname: 'bookingPatient.surname',
    birthDate: 'bookingPatient.birthDate',
    debtorNumber: 'bookingPatient.debtorNumber',
    address: {
      street: 'bookingPatient.address.street',
      houseNumber: 'bookingPatient.address.houseNumber',
      postalCode: 'bookingPatient.address.postalCode',
      city: 'bookingPatient.address.city',
      country: 'bookingPatient.address.country',
    },
    germanInsuranceId: 'bookingPatient.germanInsuranceId',
  },
  receipts: {
    amount: (id: string) => `receipts.${id}.amount`,
  },
  surgeon: {
    debtorNumber: 'surgeon.debtorNumber',
    firstName: 'surgeon.firstName',
    lastName: 'surgeon.lastName',
    address: {
      street: 'surgeon.address.street',
      houseNumber: 'surgeon.address.houseNumber',
      postalCode: 'surgeon.address.postalCode',
      city: 'surgeon.address.city',
      country: 'surgeon.address.country',
    },
  },
  bg: {
    debtorNumber: 'bg.debtorNumber',
    firstName: 'bg.firstName',
    lastName: 'bg.lastName',
    address: {
      street: 'bg.address.street',
      houseNumber: 'bg.address.houseNumber',
      postalCode: 'bg.address.postalCode',
      city: 'bg.address.city',
      country: 'bg.address.country',
    },
  },
  billingSection: {
    billingSection: 'billingSection',
    opsCode: 'billingSection.opsCode',
    goaNumber: 'billingSection.goaNumber',
    matchingGOA: 'billingSection.matchingGOA',
    effectiveAnesthesia: 'billingSection.effectiveAnesthesia',
    thirdPartyBillingContact: {
      debtorNumber: 'billingSection.thirdPartyBillingContact.debtorNumber',
      name: 'billingSection.thirdPartyBillingContact.name',
      surname: 'billingSection.thirdPartyBillingContact.surname',
      address: {
        street: 'billingSection.thirdPartyBillingContact.address.street',
        houseNumber: 'billingSection.thirdPartyBillingContact.address.houseNumber',
        postalCode: 'billingSection.thirdPartyBillingContact.address.postalCode',
        city: 'billingSection.thirdPartyBillingContact.address.city',
        country: 'billingSection.thirdPartyBillingContact.address.country',
      },
    },
  },
  preOpSection: {
    materials: {
      amount: (id: string) => `preOpSection.materials.${id}.amount`,
    },
    medications: {
      amount: (id: string) => `preOpSection.medications.${id}.amount`,
    },
  },
  intraOpSection: intraOpMaterialsSubSections.reduce(
    (acc, label) => ({
      ...acc,
      [label]: intraOpMaterialsMissingInfo(label),
    }),
    {},
  ),
  postOpSection: {
    materials: {
      amount: (id: string) => `postOpSection.materials.${id}.amount`,
    },
    medications: {
      amount: (id: string) => `postOpSection.medications.${id}.amount`,
    },
  },
  bookingSection: {
    validVat: 'bookingSection.validVat',
    date: 'bookingSection.date',
    opStandardId: 'bookingSection.opStandardId',
    billingContact: 'bookingSection.billingContact',
  },
  timestamps: {
    releaseForSurgeryTimestap: 'timestamps.releaseForSurgeryTimestap',
    endOfSurgicalMeasuresTimestamp: 'timestamps.endOfSurgicalMeasuresTimestamp',
    roomEnterTimestamp: 'timestamps.roomEnterTimestamp',
    roomExitTimestmap: 'timestamps.roomExitTimestmap',
  },
  materialsDatabase: {
    extraMaterials: {
      amount: (id: string) => `materialsDatabase.extraMaterials.${id}.amount`,
      originalPrice: (id: string) => `materialsDatabase.extraMaterials.${id}.originalPrice`,
      name: (id: string) => `materialsDatabase.extraMaterials.${id}.name`,
    },
    material: {
      amount: (id: string) => `materialsDatabase.material.${id}.amount`,
      price: (id: string) => `materialsDatabase.material.${id}.price`,
      name: (id: string) => `materialsDatabase.material.${id}.name`,
      sammelFactor: (id: string) => `materialsDatabase.material.${id}.sammelFactor`,
      pzn: (id: string) => `materialsDatabase.material.${id}.pzn`,
      id: (id: string) => `materialsDatabase.material.${id}.id`,
      steuerart: (id: string) => `materialsDatabase.material.${id}.steuerart`,
    },
    sammelSachkostenConflict: (id: string) => `materialsDatabase.material.${id}.sammelSachkostenConflict`,
  },
  contract: {
    billingC1: {
      materialPrices: 'contract.billingC1.materialPrices',
      materialPrice: (id: string) => `contract.billingC1.materialPrices.${id}.price`,
    },
    billingC2: {
      overrides: 'contract.billingC2.overrides',
      opstandardOverride: (id: string) => `contract.billingC2.overrides.${id}`,
    },
    billingD: {
      overrides: 'contract.billingD.overrides',
      materialPrice: (id: string) => `contract.billingD.overrides.materialPrices.${id}.price`,
      opstandardOverride: (id: string) => `contract.billingD.overrides.${id}`,
    },
    billingG: {
      materialPrices: 'contract.billingG.materialPrices',
      materialPrice: (id: string) => `contract.billingG.materialPrices.${id}.price`,
    },
    billingC3: { firstHourFee: 'contract.billingC3.firstHourFee', halfHourFee: 'contract.billingC3.halfHourFee' },
    billingE: { scenario: 'contract.billingE.scenario', minimumCharge: 'contract.billingE.minimumCharge' },
    billingAB: {
      scenario: (cat: string) => `contract.billing${cat}.scenario`,
      minimumCharge: (cat: string) => `contract.billing${cat}.minimumCharge`,
    },
    overnightStayFee1Bed: 'contract.overnightStayFee1Bed',
    overnightStayFee2Bed: 'contract.overnightStayFee2Bed',
    overnightStayFee3Bed: 'contract.overnightStayFee3Bed',
    prices: {
      firstHourWithAnesthesiologistFee: 'contract.prices.firstHourWithAnesthesiologistFee',
      withAnesthesiologistFeePerMinute: 'contract.prices.withAnesthesiologistFeePerMinute',
      noAnesthesiologistFeePerMinute: 'contract.prices.noAnesthesiologistFeePerMinute',
    },
    override: {
      anesthesiaFee: 'contract.override.anesthesiaFee',
      charge: 'contract.override.charge',
      insurances: 'contract.override.insurances',
      materialPrices: 'contract.override.materialPrices',
    },
  },
  systemConfig: {
    vatAnagraphic: {
      fullVatPercentage: 'systemConfig.vatAnagraphic.fullVatPercentage',
      reducedVatPercentage: 'systemConfig.vatAnagraphic.reducedVatPercentage',
    },
    pricePerPoints: 'systemConfig.pricePerPoints',
    generalData: {
      companyName: 'systemConfig.generalData.companyName',
      surgeryCenterName: 'systemConfig.generalData.surgeryCenterName',
      companyStreet: 'systemConfig.generalData.companyStreet',
      companyHouseNumber: 'systemConfig.generalData.companyHouseNumber',
      companyPostalCode: 'systemConfig.generalData.companyPostalCode',
      companyCity: 'systemConfig.generalData.companyCity',
      bankAccount: 'systemConfig.generalData.bankAccount',
      companyTaxNumber: 'systemConfig.generalData.companyTaxNumber',
      companySalesTaxNumber: 'systemConfig.generalData.companySalesTaxNumber',
      companySeat: 'systemConfig.generalData.companySeat',
      tradeRegisterNumber: 'systemConfig.generalData.tradeRegisterNumber',
      managingDirectors: 'systemConfig.generalData.managingDirectors',
    },
  },
  goaAnagraphic: {
    price: 'goaAnagraphic.price',
    number: 'goaAnagraphic.number',
  },
  ebmAnagraphic: {
    ebmAnagraphic: 'ebmAnagraphic',
    points: 'ebmAnagraphic.points',
    categoryNumber: 'ebmAnagraphic.categoryNumber',
    description: 'ebmAnagraphic.description',
  },
  opsAnagraphic: {
    ambulanteOperation: 'opsAnagraphic.ambulanteOperation',
    categoryNumber: 'opsAnagraphic.categoryNumber',
    matchingEBM: 'opsAnagraphic.matchingEBM',
  },
  extraCosts: {
    price: (name: string) => `extraCosts.${name}.price`,
  },
} as const

export const GeneralAnesthesiaTypes = [AnesthesiaType.GENERAL_ANESTHESIA,
  AnesthesiaType.ANALGOSEDATION]

export const PrivatePriceCategories = [
  BillingCategory.A,
  BillingCategory.B,
  BillingCategory.C1,
  BillingCategory.C3,
  BillingCategory.G,
  BillingCategory.C2,
]

export const PublicPriceCategories = [BillingCategory.D, BillingCategory.E, BillingCategory.F]
