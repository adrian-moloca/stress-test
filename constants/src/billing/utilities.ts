import {
  BillingCategory,
  InsuranceStatus,
  InvoiceType,
  MissingInfo,
  OpStandardBillingCategory_Name,
  PrivatePriceCategories,
  PublicPriceCategories,
  ReceiptType,
} from '../enums'
import {
  Case,
  CostEstimate,
  IBillObj,
  ICaseBillingSnapshot,
  IUser,
  ICaseOPItem,
  LightCaseOPItem,
  ParsedSammel,
  ISammelPosition,
  ISammelCheckpoint,
} from '../types'
import { addDays, checkMissingInfo, isCustomBgSelected } from './generic-utilities'
import { computeChargeInvoiceBill } from './invoices/charge-invoice'
import { computeMaterialPrivateBill } from './invoices/material-private-invoice'
import { computePlasticSurgeryInvoiceBill } from './invoices/plastic-surgery-invoice'
import { computeAnesthesiaInvoiceBill } from './invoices/anesthesia-invoice'
import { computeSelfPayerInvoiceBill } from './invoices/self-payer-invoice'
import { computeSachkostenInvoiceBill } from './invoices/sachkosten-invoice'
import { computePlasticSurgeryWithVatInvoiceBill } from './invoices/plastic-surgery-with-vat'
import { computeOvernightStayInvoice } from './invoices/overnight-stay-invoice'
import { computePCMaterialsInvoice } from './invoices/pc-materials-invoice'
import Translator from '../translator'
import { min, lastDayOfMonth } from 'date-fns'

export const autoGuessCaseCategory = (
  translator: Translator,
  caseObj: any, // Removed type Case to prevent type error without having having to delete the whole function
  contract: any, // Removed type Contract to prevent type error without having to delete the whole function
) => {
  // booking.IsWorkRelatedAccident = true -> A
  const booking = caseObj.bookingSection
  const patient = caseObj.bookingPatient as any // Removed type Patient to prevent type error without having to delete the whole function

  if (!booking) {
    const bookingErrorLabel = translator.fromLabel('booking_section_missing_error')

    throw new Error(bookingErrorLabel)
  }

  const hasBG = booking.bgId || isCustomBgSelected(booking.customBG)
  const hasInsurance = patient.germanInsuranceStatus !== InsuranceStatus.NONE

  if (hasBG && hasInsurance) return BillingCategory.A

  if (!contract) {
    const contractErrorLabel = translator.fromLabel('contract_missing_error')

    throw new Error(contractErrorLabel)
  }

  const opStandardId = booking.opStandardId

  const opStandard = contract.opStandards?.[opStandardId]

  // UR TODO: billingSection is not present anymore
  const opsBillingSection = (opStandard as any)?.billingSection

  // opStandard.BillingCategory = C1 -> C1
  if (opsBillingSection?.billingCategory === OpStandardBillingCategory_Name.C1)
    return BillingCategory.C1

  // opStandard.BillingCategory = C2 -> C2
  if (opsBillingSection?.billingCategory === OpStandardBillingCategory_Name.C2)
    return BillingCategory.C2

  // opStandard.BillingCategory = D and
  // booking.GermanInsuranceName is in surgeon.contract.catD.{opStandard}.insurances -> D

  const overrides = contract.billingD?.opstandardOverrides
    .find((current: any) => current.opStandardId === opStandardId)

  const insuranceIncluded = overrides?.insurances
    .find(({ nummer }: any) => nummer === patient.germanInsuranceId)

  if (opsBillingSection?.billingCategory === OpStandardBillingCategory_Name.D && insuranceIncluded)
    return BillingCategory.D

  // opStandard.BillingCategory = G -> G
  if (opsBillingSection?.billingCategory === OpStandardBillingCategory_Name.G)
    return BillingCategory.G

  // userDetails.HasKassenZulassung = false and
  // booking.GermanInsuranceKind = Public -> F
  if (!contract.details.kassenzulassung && patient.germanInsuranceStatus === InsuranceStatus.PUBLIC)
    return BillingCategory.F

  // booking.GermanInsuranceKind = Private -> B
  if (patient.germanInsuranceStatus === InsuranceStatus.PRIVATE) return BillingCategory.B

  // booking.GermanInsuranceKind = None -> C3
  if (patient.germanInsuranceStatus === InsuranceStatus.NONE) return BillingCategory.C3

  // booking.GermanInsuranceKind = Public -> E
  if (patient.germanInsuranceStatus === InsuranceStatus.PUBLIC) return BillingCategory.E

  // else -> F
  return null
}

export const getNeededInvoices = (
  caseObj: any, // Removed type Case to prevent type error without having to delete the whole function
) => {
  const booking = caseObj.bookingSection
  const isOvernight = booking.roomType != null

  const bills = []

  const category = caseObj.billingSection.billingCategory

  switch (category) {
    case BillingCategory.A:
    case BillingCategory.B:
      // In this category we generate:
      // a "Charge" invoice
      // a "Materials privat" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      bills.push(InvoiceType.CHARGE_ABGABE, InvoiceType.MATERIAL_PRIVATE)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.C1:
      // In this category we generate a single "Plastic Surgery" invoice, where the debtor is the surgeon.
      // Optionally, we can generate an "Overnight Stay" invoice (see section "Overnight Stay invoice").

      bills.push(InvoiceType.PLASTIC_SURGERY)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.C2:
      // In this category we generate:
      // a "Charge" invoice
      // an "Anesthesia" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      bills.push(InvoiceType.CHARGE_ABGABE, InvoiceType.ANAESTHESIA)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.C3:
      // In this category we generate a single "Self payer" invoice

      bills.push(InvoiceType.SELF_PAYER)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.D:
      // In this category we generate:
      // a "Charge" invoice
      // a "PC Material" invoice
      // an "Anesthesia" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      bills.push(InvoiceType.CHARGE_ABGABE, InvoiceType.PC_MATERIALS, InvoiceType.ANAESTHESIA)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.E:
      // In this category we generate:
      // a "Charge" invoice
      // a "Sachkosten" invoice
      // a "PC Material" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      bills.push(InvoiceType.CHARGE_ABGABE, InvoiceType.PC_MATERIALS, InvoiceType.SACHKOSTEN)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    case BillingCategory.F:
      // this category is not handled by SMAMBU directly,
      // and can only be marked as "billed externally".
      break

    case BillingCategory.G:
      // In this category we only generate a "Plastic surgery + VAT" invoice.
      // Optionally, we can generate an "Overnight Stay" invoice (see section "Overnight Stay invoice").

      bills.push(InvoiceType.PLASTIC_SURGERY_VAT)
      if (isOvernight) bills.push(InvoiceType.OVERNIGHT_STAY)

      break

    default:
      throw new Error('unsupported_category_error')
  }

  // we remove "null" bills, i.e. the one that are not created
  return bills.filter(bill => bill)
}

export const createCaseInvoiceBill = (
  translator: Translator,
  snapshot: ICaseBillingSnapshot,
  bills?: IBillObj[]
) => {
  const caseObj = snapshot.case as any // Removed type Case to prevent type error without having to delete the whole function
  const patient = caseObj.bookingPatient
  const booking = caseObj.bookingSection
  const contract = snapshot.contract
  const surgeon = contract.associatedDoctor ?? <IUser>{}
  const goaAnagraphic = snapshot.goaAnagraphic
  const caseOPItems = snapshot.caseOPItems
  const anesthesiaOPItems = snapshot.anesthesiaOPItems
  const bg = snapshot.parsedBG
  const timestamps = caseObj.timestamps
  const recType = caseObj.billingSection.billingContact
  const thirdParty = caseObj.billingSection.thirdPartyBillingContact
  const ebmAnagraphic = snapshot.ebmAnagraphic
  const isOvernight = booking.roomType != null
  const externalMaterialPrices = snapshot.externalMaterialPrices

  const chargeInvoiceBill =
    bills?.find(current => current.type === InvoiceType.CHARGE_ABGABE) ??
    <IBillObj>{
      type: InvoiceType.CHARGE_ABGABE,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const materialPrivateBill =
    bills?.find(current => current.type === InvoiceType.MATERIAL_PRIVATE) ??
    <IBillObj>{
      type: InvoiceType.MATERIAL_PRIVATE,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const anesthesiaBill =
    bills?.find(current => current.type === InvoiceType.ANAESTHESIA) ??
    <IBillObj>{
      type: InvoiceType.ANAESTHESIA,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const plasticSurgeryBill =
    bills?.find(current => current.type === InvoiceType.PLASTIC_SURGERY) ??
    <IBillObj>{
      type: InvoiceType.PLASTIC_SURGERY,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const pcMaterialBill =
    bills?.find(current => current.type === InvoiceType.PC_MATERIALS) ??
    <IBillObj>{
      type: InvoiceType.PC_MATERIALS,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const externalInvoiceBill =
    bills?.find(current => current.type === InvoiceType.EXTERNAL) ??
    <IBillObj>{ type: InvoiceType.EXTERNAL, missingData: <string[]>[], missingItems: <string[]>[] }

  const selfPayerInvoiceBill =
    bills?.find(current => current.type === InvoiceType.SELF_PAYER) ??
    <IBillObj>{
      type: InvoiceType.SELF_PAYER,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const sachkostenBill =
    bills?.find(current => current.type === InvoiceType.SACHKOSTEN) ??
    <IBillObj>{
      type: InvoiceType.SACHKOSTEN,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const overnightBill =
    bills?.find(current => current.type === InvoiceType.OVERNIGHT_STAY) ??
    <IBillObj>{
      type: InvoiceType.OVERNIGHT_STAY,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const plasticSurgeryVatBill =
    bills?.find(current => current.type === InvoiceType.PLASTIC_SURGERY_VAT) ??
    <IBillObj>{
      type: InvoiceType.PLASTIC_SURGERY_VAT,
      missingData: <string[]>[],
      missingItems: <string[]>[]
    }

  const category = caseObj.billingSection.billingCategory

  switch (category) {
    case BillingCategory.A:
      // In this category we generate:
      // a "Charge" invoice
      // a "Materials privat" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      computeChargeInvoiceBill(
        translator,
        chargeInvoiceBill,
        category,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        goaAnagraphic,
        ebmAnagraphic,
      )

      computeMaterialPrivateBill(
        translator,
        materialPrivateBill,
        category,
        caseOPItems,
        patient,
        booking,
        contract,
        externalMaterialPrices,
        caseObj,
        bg,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.B:
      // In this category we generate:
      // a "Charge" invoice
      // a "Materials privat" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      computeChargeInvoiceBill(
        translator,
        chargeInvoiceBill,
        category,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        goaAnagraphic,
        ebmAnagraphic,
      )

      computeMaterialPrivateBill(
        translator,
        materialPrivateBill,
        category,
        caseOPItems,
        patient,
        booking,
        contract,
        externalMaterialPrices,
        caseObj,
        bg,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.C1:
      // In this category we generate a single "Plastic Surgery" invoice, where the debtor is the surgeon.
      // Optionally, we can generate an "Overnight Stay" invoice (see section "Overnight Stay invoice").

      computePlasticSurgeryInvoiceBill(
        translator,
        plasticSurgeryBill,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        timestamps,
        caseObj.anesthesiaSection,
        externalMaterialPrices,
        caseObj,
        anesthesiaOPItems,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.C2:
      // In this category we generate:
      // a "Charge" invoice
      // an "Anesthesia" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      computeChargeInvoiceBill(
        translator,
        chargeInvoiceBill,
        category,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        goaAnagraphic,
        ebmAnagraphic,
      )

      computeAnesthesiaInvoiceBill(
        translator,
        anesthesiaBill,
        category,
        patient,
        contract,
        booking,
        externalMaterialPrices,
        caseObj,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.C3:
      // In this category we generate a single "Self payer" invoice

      computeSelfPayerInvoiceBill(
        translator,
        selfPayerInvoiceBill,
        patient,
        contract,
        booking,
        recType,
        timestamps,
        thirdParty,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        surgeon,
        anesthesiaOPItems,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.D:
      // In this category we generate:
      // a "Charge" invoice
      // a "PC Material" invoice
      // an "Anesthesia" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      computeChargeInvoiceBill(
        translator,
        chargeInvoiceBill,
        category,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        goaAnagraphic,
        ebmAnagraphic,
      )

      computeAnesthesiaInvoiceBill(
        translator,
        anesthesiaBill,
        category,
        patient,
        contract,
        booking,
        externalMaterialPrices,
        caseObj,
      )

      computePCMaterialsInvoice(translator, pcMaterialBill, surgeon, patient, caseOPItems)

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.E:
      // In this category we generate:
      // a "Charge" invoice
      // a "Sachkosten" invoice
      // a "PC Material" invoice
      // optionally, an "Overnight Stay" invoice (see section "Overnight Stay invoice")

      computeChargeInvoiceBill(
        translator,
        chargeInvoiceBill,
        category,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        externalMaterialPrices,
        caseObj,
        goaAnagraphic,
        ebmAnagraphic,
      )

      computeSachkostenInvoiceBill(
        translator,
        sachkostenBill,
        surgeon,
        patient,
        booking,
        caseOPItems,
        contract,
        externalMaterialPrices,
        caseObj,
      )

      computePCMaterialsInvoice(translator, pcMaterialBill, surgeon, patient, caseOPItems)

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break

    case BillingCategory.F:
      // this category is not handled by SMAMBU directly,
      // and can only be marked as "billed externally".
      externalInvoiceBill.external = true
      break

    case BillingCategory.G:
      // In this category we only generate a "Plastic surgery + VAT" invoice.
      // Optionally, we can generate an "Overnight Stay" invoice (see section "Overnight Stay invoice").

      computePlasticSurgeryWithVatInvoiceBill(
        translator,
        plasticSurgeryVatBill,
        surgeon,
        patient,
        contract,
        booking,
        caseOPItems,
        timestamps,
        caseObj.anesthesiaSection,
        externalMaterialPrices,
        caseObj,
        anesthesiaOPItems,
        snapshot.vatAnagraphic,
      )

      if (isOvernight)
        computeOvernightStayInvoice(
          translator,
          overnightBill,
          patient,
          contract,
          booking,
          externalMaterialPrices,
          caseObj,
        )

      break
  }

  addRefundfToMostExpensiveBillobj(bills ?? [], caseObj)

  return { caseBillSnapshot: snapshot, bills }
}

const addRefundfToMostExpensiveBillobj = (billObjs: IBillObj[], caseObj: Case) => {
  const billToPayDirectyToTheClinic = billObjs
    ?.filter(billObj => isToPayDirectlyToClinic(billObj.type))
  // TODO: replace find function with sum/filter (ask to daniele)
  const depositReceipts = caseObj.receipts?.filter(receipt => receipt.type === ReceiptType.DEPOSIT)
  const amountPaidAtCheckin = depositReceipts
    .reduce((acc, curr) => (curr.amount != null ? acc + curr.amount : acc), 0)

  if (billToPayDirectyToTheClinic?.length && amountPaidAtCheckin && billObjs?.length) {
    const billToPayDirectyToTheClinicWithHighestAmount = billToPayDirectyToTheClinic?.reduce(
      (prev: IBillObj, current) => {
        if (!prev) return current
        if (!current) return prev
        return prev.totalSum > current.totalSum ? prev : current
      },
    )

    const index = billObjs?.findIndex(
      bilObj => bilObj.billObjId === billToPayDirectyToTheClinicWithHighestAmount?.billObjId,
    )

    billObjs[index].totalOwed = billObjs[index].totalSum - amountPaidAtCheckin
  }
}

export const caseHasAllInfo = (snapshot: ICaseBillingSnapshot, bills: IBillObj[]) => {
  const neededInvoiceTypes = getNeededInvoices(snapshot.case)

  if (!neededInvoiceTypes.every(i => bills?.some(b => b.type === i))) throw new Error('error_missing_invoice')

  return (
    !snapshot?.missingData?.length &&
    !snapshot?.missingItems?.length &&
    (bills ?? []).every(bill => bill.missingData.length === 0)
  )
}

export const checkPriceMissingInfo = (
  contract: any, // Removed type Contract to prevent type error without having to delete the whole function
  material: ICaseOPItem | null,
  caseItem: any, // Removed type Case to prevent type error without having to delete the whole function
  missingData: string[],
  missingItems: string[],
) => {
  if (!material) return null
  let anagraphicPrice = null
  if (PrivatePriceCategories.includes(caseItem.billingSection.billingCategory))
    anagraphicPrice = material?.basicPricePerUnit_PrivateInsurance

  if (PublicPriceCategories.includes(caseItem.billingSection.billingCategory))
    anagraphicPrice = material?.basicPricePerUnit_PublicInsurance

  switch (caseItem.billingSection.billingCategory) {
    case BillingCategory.C1:
      const c1ContractMaterial = contract?.billingC1?.materialPrices?.find?.(
        (contractMaterial: any) => contractMaterial.id === material?.id,
      )
      if (c1ContractMaterial?.id)
        checkMissingInfo(
          c1ContractMaterial?.price,
          MissingInfo.contract.billingC1.materialPrice(c1ContractMaterial?.id),
          missingData,
          missingItems,
          [NaN],
        )
      else
        checkMissingInfo(
          anagraphicPrice,
          MissingInfo.materialsDatabase.material.price(material?.id),
          missingData,
          missingItems,
          [NaN],
        )
      break
    case BillingCategory.G:
      const gContractMaterial = contract?.billingG?.materialPrices?.find?.(
        (contractMaterial: any) => contractMaterial.id.toString() === material.id.toString(),
      )
      if (gContractMaterial?.id)
        checkMissingInfo(
          gContractMaterial?.price,
          MissingInfo.contract.billingG.materialPrice(gContractMaterial?.id),
          missingData,
          missingItems,
          [NaN],
        )
      else
        checkMissingInfo(
          anagraphicPrice,
          MissingInfo.materialsDatabase.material.price(material?.id),
          missingData,
          missingItems,
          [NaN],
        )
      break
    case BillingCategory.D:
      const opstandardOvveride = contract?.billingD?.opstandardOverrides?.find?.(
        (opstandard: any) =>
          opstandard.opStandardId === caseItem.bookingSection.opStandardId &&
          opstandard.insurances.find(
            (insurance: any) => insurance.nummer === (caseItem.bookingPatient.germanInsuranceId ?? ''),
          ),
      )
      const dContractMaterial = opstandardOvveride?.materialPrices?.find?.(
        (contractMaterial: any) => contractMaterial.id.toString() === material.id.toString(),
      )
      if (dContractMaterial?.id)
        checkMissingInfo(
          dContractMaterial?.price,
          MissingInfo.contract.billingD.materialPrice(dContractMaterial?.id),
          missingData,
          missingItems,
          [NaN],
        )
      else
        checkMissingInfo(
          anagraphicPrice,
          MissingInfo.materialsDatabase.material.price(material?.id),
          missingData,
          missingItems,
          [NaN],
        )

      break
    default:
      checkMissingInfo(
        anagraphicPrice,
        MissingInfo.materialsDatabase.material.price(material?.id),
        missingData,
        missingItems,
        [NaN],
      )
  }
}

export const getBillDueDate = (generationDate: Date, billType: InvoiceType) => {
  switch (billType) {
    case InvoiceType.MATERIAL_PRIVATE:
      return addDays(generationDate, 28)

    case InvoiceType.PLASTIC_SURGERY:
    case InvoiceType.PLASTIC_SURGERY_VAT:
    case InvoiceType.SACHKOSTEN:
    case InvoiceType.CHARGE_ABGABE:
    case InvoiceType.PC_MATERIALS:
      return addDays(generationDate, 14)

    case InvoiceType.ANAESTHESIA:
    case InvoiceType.OVERNIGHT_STAY:
    case InvoiceType.SELF_PAYER:
    case InvoiceType.CREDIT_NOTE:
      return generationDate

    default:
      console.error(`Invoice type ${billType} is not supported`)
      throw new Error('unsupported_invoice_type')
  }
}

export const isVatIncluded = (category: BillingCategory) => {
  if (category === BillingCategory.G) return false
  return true
}

export const isToPayDirectlyToClinic = (invoicetype: InvoiceType) => {
  switch (invoicetype) {
    case InvoiceType.ANAESTHESIA:
      return true

    case InvoiceType.MATERIAL_PRIVATE:
      return false

    case InvoiceType.OVERNIGHT_STAY:
      return true

    case InvoiceType.PLASTIC_SURGERY:
      return false

    case InvoiceType.PLASTIC_SURGERY_VAT:
      return false

    case InvoiceType.SACHKOSTEN:
      return false

    case InvoiceType.SELF_PAYER:
      return true

    case InvoiceType.CHARGE_ABGABE:
      return false

    default:
      return false
  }
}

export const getInvoicesToPayDirectyToClinic = (caseItem: any) => {
  return caseItem?.billingDocument?.bills
    ?.filter?.((bill: any) => isToPayDirectlyToClinic(bill.type)) ?? []
}

export const computeCostEstimateTotal = (costEstimate: CostEstimate) => {
  return (
    (costEstimate?.opvPrice ?? 0) +
    (costEstimate?.standByPrice ?? 0) +
    (costEstimate?.generalAnesthesiaPrice ?? 0) +
    (costEstimate?.useAndCarePrice ?? 0) +
    (costEstimate?.materialsPrices
      ?.reduce?.((acc, curr) => acc + (curr.price * curr.amount), 0) ?? 0)
  )
}

/*
  UR TODO: check how we want to implement the oldGetPrice function
           as we don't know now the type of the contract or of billingCategory of the case
*/
export const getPrice = (material: LightCaseOPItem | null) => {
  return material?.basicPricePerUnit_PrivateInsurance ?? material?.basicPricePerUnit_PublicInsurance
}

export const oldGetPrice = (
  material: LightCaseOPItem | null,
  contract: any, // Removed type Contract to prevent type error without having to delete the whole function
  caseItem: any, // Removed type Case to prevent type error without having to delete the whole function
) => {
  if (!material) return null
  let anagraphicPrice = null
  if (PrivatePriceCategories.includes(caseItem.billingSection.billingCategory))
    anagraphicPrice = material?.basicPricePerUnit_PrivateInsurance

  if (PublicPriceCategories.includes(caseItem.billingSection.billingCategory))
    anagraphicPrice = material?.basicPricePerUnit_PublicInsurance

  switch (caseItem.billingSection.billingCategory) {
    case BillingCategory.C1:
      const c1ContractMaterial = contract?.billingC1?.materialPrices?.find?.(
        (contractMaterial: any) => contractMaterial.id.toString() === material.id.toString(),
      )
      return c1ContractMaterial?.id ? c1ContractMaterial?.price ?? null : anagraphicPrice
    case BillingCategory.G:
      const gContractMaterial = contract?.billingG?.materialPrices?.find?.(
        (contractMaterial: any) => contractMaterial.id.toString() === material.id.toString(),
      )
      return gContractMaterial?.id ? gContractMaterial?.price ?? null : anagraphicPrice
    case BillingCategory.D:
      const dContractMaterial = contract?.billingD?.opstandardOverrides
        ?.find?.(
          (opstandard: any) =>
            opstandard.opStandardId === caseItem.bookingSection.opStandardId &&
            opstandard.insurances.find(
              (insurance: any) => insurance.nummer === (caseItem.bookingPatient.germanInsuranceId ?? ''),
            ),
        )
        ?.materialPrices
        ?.find?.((contractMaterial: any) =>
          contractMaterial.id.toString() === material.id.toString())
      return dContractMaterial?.id ? dContractMaterial?.price ?? null : anagraphicPrice
    default:
      return anagraphicPrice
  }
}

export const parseMaterialRowInCaseOPItem = (materialRow: any): LightCaseOPItem => {
  if (!materialRow)
    return {
      id: '',
      basicPricePerUnit_PublicInsurance: 0,
      basicPricePerUnit_PrivateInsurance: 0,
      name: '',
    }
  return {
    id: materialRow.artikelnummer,
    basicPricePerUnit_PublicInsurance: parseFloat(materialRow.basicPricePerUnit_PublicInsurance),
    basicPricePerUnit_PrivateInsurance: parseFloat(materialRow.basicPricePerUnit_PrivateInsurance),
    name: materialRow.artikelbezeichnung,
  }
}

export const requiresRecipientType = (caseObj?: any) => {
  // this could become way more complicated in the future - hence the function

  return caseObj?.billingSection.billingCategory === BillingCategory.C3
}

export const filterEmittablePcMaterialBillObjs = (billObjs: IBillObj[],
  previousCheckpoint: ISammelCheckpoint) => {
  const sammelArticles = getParsedSammelsFromBillobjs(billObjs)

  const EmittableBillObjs = billObjs.filter(b => {
    const sammelPositions = b.positions as ISammelPosition[]
    const EmittableSammels = sammelPositions.filter(position => {
      if (position.materialId == null) throw new Error('materialId cannot be undefined')
      const sammelTotalWithReminder =
        sammelArticles[position.materialId].total +
        (previousCheckpoint?.consumptions
          ?.find?.(c => c.itemCode === position.materialId)?.remainder ?? 0)
      const factor = sammelArticles[position.materialId].factor
      return sammelTotalWithReminder >= factor
    })
    return EmittableSammels.length > 0
  })

  return EmittableBillObjs
}

export const getParsedSammelsFromBillobjs = (billObjs: IBillObj[]) => {
  const sammelArticles: {
    [key: string]: ParsedSammel
  } = {}

  for (const billObj of billObjs) {
    const sammelPositions = billObj.positions as ISammelPosition[]
    for (const sammel of sammelPositions) {
      if (sammel.materialId == null) throw new Error('materialId cannot be undefined')
      sammelArticles[sammel.materialId] = {
        total: (sammelArticles?.[sammel.materialId]?.total ?? 0) + sammel.amount,
        factor: sammel.sammelFactor,
        materialId: sammel.materialId,
        description: sammel.description,
      }
    }
  }
  return sammelArticles
}

export const getBookkeepingDate = (invoiceCases: Case[]) => {
  const casesDates = invoiceCases.map(c => new Date(c.bookingSection.date))
  const firstCaseDate = min(casesDates)

  return lastDayOfMonth(firstCaseDate)
}
