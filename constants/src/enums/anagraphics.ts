/* eslint-disable no-unused-vars */
import { IAnagraphicField, IAnagraphicFields, IAnagraphicRow, IAnagraphicSetup, tDynamicAnagraphicSetup, tFullAnagraphicSetup, tStaticAnagraphicSetup } from '../types'
import { Capabilities } from './permissions'

export enum EAnagraphicsGetStatus {
  NO_CHANGES = 'noChanges',
  NEW = 'new',
}

export enum anagraphicsTypes {
  DYNAMICS_ANAGRAPHICS = 'dynamicAnagraphics',

  MATERIALS_DATABASE = 'materialsDatabase', //

  INSURANCES = 'insurances',
  PRIVATEINSURANCES = 'privateInsurances',
  PUBLICINSURANCES = 'publicInsurances',
  BGINSURANCES = 'BGInsurances',

  STERILEGOODS = 'sterileGoods',
  SIEBE = 'siebe',
  SETS = 'sets',
  EINZELINSTRUMENTE = 'einzelInstrumente',

  OPSCATALOGUE = 'opsCatalogue',

  EBM = 'ebm',

  GOA = 'goa',
  GOACATA = 'goaCatA',
  GOACATB = 'goaCatB',
}

export type tAnagraphicTypesValues = typeof anagraphicsTypes[keyof typeof anagraphicsTypes]

const basicDates: IAnagraphicFields = [
  { type: 'date', name: 'dateAdded', readonly: true, noCSV: true },
  { type: 'date', name: 'dateModified', readonly: true, noCSV: true },
]

// Here we fused the customersPriceList, materialGroup, articleFlags, suppliersArticles and vatType anagraphics fields
const materialsDatabaseFields: IAnagraphicFields = [
  { type: 'string', name: 'artikelnummer', required: true, isKey: true },
  { type: 'string', name: 'artikelbezeichnung', isName: true },
  { type: 'string', name: 'importkennzeichen' },
  { type: 'number', name: 'debitor' },
  { type: 'string', name: 'kundeKurz' },
  { type: 'number', name: 'faktor' },
  { type: 'string', name: 'gtin' },
  { type: 'string', name: 'pzn' },
  { type: 'string', name: 'hibc' },
  { type: 'string', name: 'gebindebemerkung' },
  { type: 'price', name: 'basicPricePerUnit_PublicInsurance' },
  { type: 'price', name: 'basicPricePerUnit_PrivateInsurance', isPrice: true },
  { type: 'string', name: 'einheitKurz' },
  { type: 'string', name: 'währung' },
  { type: 'date', name: 'gültigAb' },
  { type: 'date', name: 'gültigBis' },
  { type: 'string', name: 'nachlasstyp' },
  { type: 'string', name: 'schwellentyp' },
  { type: 'string', name: 'schwelle' },
  { type: 'string', name: 'nachlass' },
  { type: 'boolean', name: 'arztpflicht' },
  { type: 'boolean', name: 'abgangAusDokumentationen' },
  { type: 'boolean', name: 'ambulantAbrechenbar' },
  { type: 'boolean', name: 'artikelFürVfm' },
  { type: 'boolean', name: 'artikelMitFap' },
  { type: 'boolean', name: 'belieferungUnitDoseAutomat' },
  { type: 'boolean', name: 'betäubungsmittel' },
  { type: 'boolean', name: 'blutprodukt' },
  { type: 'boolean', name: 'bonusrelevant' },
  { type: 'boolean', name: 'chargenpflichtig' },
  { type: 'boolean', name: 'chefarztpflichtig' },
  { type: 'boolean', name: 'dummyArtikel' },
  { type: 'boolean', name: 'externerFreigabeworkflowBedarfsmeldung' },
  { type: 'boolean', name: 'fallnummernpflichtig' },
  { type: 'boolean', name: 'gelisteterArtikel' },
  { type: 'boolean', name: 'generikum' },
  { type: 'boolean', name: 'hilfsmittelZumVerbrauch' },
  { type: 'boolean', name: 'implantat' },
  { type: 'boolean', name: 'importarzneimittel' },
  { type: 'boolean', name: 'internationalerFreiname' },
  { type: 'boolean', name: 'kommissionierungMedication' },
  { type: 'boolean', name: 'medizinischNichtRelevant' },
  { type: 'boolean', name: 'negativliste' },
  { type: 'boolean', name: 'notfallpräparatAntidote' },
  { type: 'boolean', name: 'oberarztpflichtig' },
  { type: 'boolean', name: 'projektbezug' },
  { type: 'boolean', name: 'relevantFürOrbisMedication' },
  { type: 'boolean', name: 'rezeptpflichtig' },
  { type: 'boolean', name: 'sammelartikel' },
  { type: 'boolean', name: 'securpharm' },
  { type: 'boolean', name: 'seriennummernpflichtig' },
  { type: 'boolean', name: 'sonderanforderung' },
  { type: 'boolean', name: 'sprechstundenbedarf' },
  { type: 'boolean', name: 'stationslager' },
  { type: 'boolean', name: 'tierarzneimittel' },
  { type: 'boolean', name: 'überKvAbrechenbar' },
  { type: 'boolean', name: 'verfalldatum' },
  { type: 'boolean', name: 'vomBenutzerGesperrt' },
  { type: 'boolean', name: 'zurBestellungGesperrt' },
  { type: 'boolean', name: 'zuzahlungsbefreiung' },
  { type: 'boolean', name: 'zytostatika' },
  { type: 'string', name: 'steuerart' },
  { type: 'string', name: 'warengruppeKurz' },
  { type: 'string', name: 'warengruppeName' },
  { type: 'string', name: 'übergeordneteWarengruppeKurz' },
  { type: 'string', name: 'zentralgepflegt' },
  { type: 'number', name: 'kreditor' },
  { type: 'string', name: 'lieferantKurz' },
  { type: 'string', name: 'artikelnummerLieferant' },
  { type: 'string', name: 'artikelbezeichnungLieferant' },
  { type: 'number', name: 'mindestbestellmenge' },
  { type: 'number', name: 'mindestbestellwert' },
  { type: 'number', name: 'lieferzeit' },
  { type: 'number', name: 'hauptlieferant' },
  { type: 'string', name: 'hersteller' },
  { type: 'number', name: 'aktiv' },
  { type: 'string', name: 'artikelnummerKunde' },
  ...basicDates,
]

const sterileGoodsFields: IAnagraphicFields = [
  { type: 'string', name: 'code', required: true, isKey: true },
  { type: 'string', name: 'seriennr', isKey: true },
  { type: 'string', name: 'bezeichnung', isName: true },
  { type: 'number', name: 'anz' },
  ...basicDates,
]

const opsCatalogueFiels: IAnagraphicFields = [
  { type: 'string', name: 'ops', required: true, isKey: true },
  { type: 'string', name: 'seite' },
  { type: 'string', name: 'bezeichnungOps' },
  { type: 'string', name: 'kategorie' },
  { type: 'string', name: 'ambulanteOperation' },
  { type: 'number', name: 'belegärztlicheOperation' },
  { type: 'number', name: 'überwachungskomplexAmbulant' },
  { type: 'number', name: 'überwachungskomplexBelegärztlich' },
  { type: 'number', name: 'behandlungskomplexÜberweisungNurAmbulant' },
  { type: 'number', name: 'behandlungskomplexOperateurNurAmbulant' },
  { type: 'number', name: 'ambulanteAnästhesie' },
  { type: 'number', name: 'belegärztlicheAnästhesie' },
  ...basicDates,
]

const ebmFields: IAnagraphicFields = [
  { type: 'string', name: 'ebmZiffer', required: true, isKey: true },
  { type: 'string', name: 'ebmBezeichnung' },
  { type: 'number', name: 'punktzahl' },
  { type: 'string', name: 'ebmBetrag' },
  { type: 'string', name: 'waehrung' },
  { type: 'string', name: 'zusatzkennzeichen' },
  { type: 'string', name: 'gueltigab' },
  { type: 'string', name: 'gueltigbis' },
  { type: 'string', name: 'geaendert' },
  ...basicDates,
]

const goaFields: IAnagraphicFields = [
  { type: 'string', name: 'number', required: true, isKey: true },
  { type: 'string', name: 'description' },
  { type: 'price', name: 'price' },
  ...basicDates,
]

export const defaultNewRow = (row?: Partial<IAnagraphicRow>) => ({
  ...(row ?? {}),
  dateAdded: new Date(),
  dateModified: new Date(),
})
export const defaultEditRow = (newValues: IAnagraphicRow, oldValues: IAnagraphicRow) => ({
  ...oldValues,
  ...newValues,
  dateAdded: oldValues.dateAdded,
  dateModified: new Date(),
  id: oldValues.id,
})

export const staticAnagraphicsSetups: tStaticAnagraphicSetup[] = [
  {
    anagraphicType: anagraphicsTypes.MATERIALS_DATABASE,
    fields: materialsDatabaseFields,
    versioningEnabled: true,
    uploadCSVEnabled: true,
    collectionNames: { [anagraphicsTypes.MATERIALS_DATABASE]: anagraphicsTypes.MATERIALS_DATABASE },
    permissionsRequests: {
      view: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_VIEW },
      viewNames: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_NAMES_VIEW },
      edit: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_EDIT },
      export: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_EXPORT },
      upload: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_UPLOAD },
      deleteVersion: { expressionKind: 'hasCapability', capability: Capabilities.P_MATERIALS_DATABASE_DELETE },
    },
  },
  {
    anagraphicType: anagraphicsTypes.STERILEGOODS,
    fields: sterileGoodsFields,
    versioningEnabled: true,
    uploadCSVEnabled: true,
    collectionNames: {
      [anagraphicsTypes.SETS]: anagraphicsTypes.SETS,
      [anagraphicsTypes.SIEBE]: anagraphicsTypes.SIEBE,
      [anagraphicsTypes.EINZELINSTRUMENTE]: anagraphicsTypes.EINZELINSTRUMENTE,
    },
    subTypes: [anagraphicsTypes.SETS, anagraphicsTypes.SIEBE, anagraphicsTypes.EINZELINSTRUMENTE],
    permissionsRequests: {
      view: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_VIEW },
      viewNames: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_NAMES_VIEW },
      edit: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_EDIT },
      export: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_EXPORT },
      upload: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_UPLOAD },
      deleteVersion: { expressionKind: 'hasCapability', capability: Capabilities.P_STERILE_GOODS_DELETE },
    },
  },
  {
    anagraphicType: anagraphicsTypes.OPSCATALOGUE,
    fields: opsCatalogueFiels,
    versioningEnabled: true,
    uploadCSVEnabled: true,
    collectionNames: { [anagraphicsTypes.OPSCATALOGUE]: anagraphicsTypes.OPSCATALOGUE },
    permissionsRequests: {
      view: { expressionKind: 'hasCapability', capability: Capabilities.P_OPS_CATALOGUE_VIEW },
      edit: { expressionKind: 'hasCapability', capability: Capabilities.P_OPS_CATALOGUE_EDIT },
      export: { expressionKind: 'hasCapability', capability: Capabilities.P_OPS_CATALOGUE_EXPORT },
      upload: { expressionKind: 'hasCapability', capability: Capabilities.P_OPS_CATALOGUE_UPLOAD },
      deleteVersion: { expressionKind: 'hasCapability', capability: Capabilities.P_OPS_CATALOGUE_DELETE },
    },
  },
  {
    anagraphicType: anagraphicsTypes.EBM,
    fields: ebmFields,
    versioningEnabled: true,
    uploadCSVEnabled: true,
    collectionNames: { [anagraphicsTypes.EBM]: anagraphicsTypes.EBM },
    permissionsRequests: {
      view: { expressionKind: 'hasCapability', capability: Capabilities.P_EBM_VIEW },
      edit: { expressionKind: 'hasCapability', capability: Capabilities.P_EBM_EDIT },
      export: { expressionKind: 'hasCapability', capability: Capabilities.P_EBM_EXPORT },
      upload: { expressionKind: 'hasCapability', capability: Capabilities.P_EBM_UPLOAD },
      deleteVersion: { expressionKind: 'hasCapability', capability: Capabilities.P_EBM_DELETE },
    },
  },
  {
    anagraphicType: anagraphicsTypes.GOA,
    fields: goaFields,
    versioningEnabled: true,
    uploadCSVEnabled: true,
    collectionNames: {
      [anagraphicsTypes.GOACATA]: anagraphicsTypes.GOACATA,
      [anagraphicsTypes.GOACATB]: anagraphicsTypes.GOACATB,
    },
    subTypes: [anagraphicsTypes.GOACATA, anagraphicsTypes.GOACATB],
    permissionsRequests: {
      view: { expressionKind: 'hasCapability', capability: Capabilities.P_GOA_VIEW },
      edit: { expressionKind: 'hasCapability', capability: Capabilities.P_GOA_EDIT },
      export: { expressionKind: 'hasCapability', capability: Capabilities.P_GOA_EXPORT },
      upload: { expressionKind: 'hasCapability', capability: Capabilities.P_GOA_UPLOAD },
      deleteVersion: { expressionKind: 'hasCapability', capability: Capabilities.P_GOA_DELETE },
    },
  },
]

export const getTabbedAnagraphicSetup = (
  anagraphicSetup: tFullAnagraphicSetup,
  selectedSubType?: string,
): IAnagraphicSetup => {
  if (!anagraphicSetup.subTypes?.[0]) return {
    ...anagraphicSetup,
    collectionName: Object.values(anagraphicSetup.collectionNames)[0],
  } as IAnagraphicSetup

  const subType = selectedSubType != null ? selectedSubType : anagraphicSetup.subTypes[0]

  const fields = anagraphicSetup.fields[subType as keyof typeof anagraphicSetup.fields] ??
    anagraphicSetup.fields

  const collectionName =
    anagraphicSetup.collectionNames[subType as keyof typeof anagraphicSetup.collectionNames]

  const tabbedAnagraphicSetup = ({
    ...anagraphicSetup,
    collectionName,
    fields: fields as IAnagraphicFields,
  }) as IAnagraphicSetup

  return tabbedAnagraphicSetup
}

export const getAnagraphicFields = (
  anagraphicSetup: tFullAnagraphicSetup,
  anagraphicSubType?: anagraphicsTypes
) =>
  getTabbedAnagraphicSetup(anagraphicSetup, anagraphicSubType)?.fields ?? []

export const getAnagraphicKeysIndex = (
  anagraphicSetup: tFullAnagraphicSetup,
  anagraphicSubType: anagraphicsTypes
) =>
  (getTabbedAnagraphicSetup(anagraphicSetup,
    anagraphicSubType)?.fields ?? []).reduce(
    (acc, field, index) => {
      if (field.isKey) acc.push(index)
      return acc
    },
    [] as number[],
  )

export const getAnagraphicKeys = (
  anagraphicSetup: tFullAnagraphicSetup,
  anagraphicSubType: anagraphicsTypes
) => {
  const fields = getTabbedAnagraphicSetup(anagraphicSetup, anagraphicSubType)?.fields

  if (fields == null) return []

  const keys = fields.reduce((acc, field) => {
    if (field.isKey)
      acc.push(field.name)

    return acc
  }, [] as string[])

  return keys
}

export const isAnagraphicFields = (field: IAnagraphicField) => field?.type && field?.name

export const getAnagraphicFieldsBase = (staticAnagraphicSetup: tStaticAnagraphicSetup[],
  dynamicAnagraphics: tDynamicAnagraphicSetup[],
  anagraphicType: tAnagraphicTypesValues,
  anagraphicSubType?: tAnagraphicTypesValues): IAnagraphicFields => {
  let matchingType: tStaticAnagraphicSetup | tDynamicAnagraphicSetup | undefined =
    staticAnagraphicSetup.find(current => current.anagraphicType === anagraphicType)

  if (matchingType == null)
    matchingType = dynamicAnagraphics.find(current => current.anagraphicType === anagraphicType)

  if (matchingType === undefined)
    throw new Error(`Error: anagraphic ${anagraphicType} is not covered`)

  const hasSubtype = matchingType.subTypes != null

  if (anagraphicSubType == null && hasSubtype)
    throw new Error(`Error: anagraphic ${anagraphicType} needs a subtype (which was not provided)`)

  if (hasSubtype) {
    const subtypeFields = matchingType.fields
    // @ts-expect-error types are a mess
    const matchingSubTypeFields = subtypeFields[anagraphicSubType!]

    return matchingSubTypeFields
  }

  return matchingType.fields as IAnagraphicFields
}

export const getAnagraphicKeyIndexes = (fields: IAnagraphicFields) => {
  const indexes:number[] = []

  fields.forEach((current, idx) => {
    if (current.isKey)
      indexes.push(idx)
  })

  return indexes
}

export const getComposedAnagraphicKey = (keyValues: string[]) => {
  return keyValues.map(current => `{${current}}`).join('-')
}
