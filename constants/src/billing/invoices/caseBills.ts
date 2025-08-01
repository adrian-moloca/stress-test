import { BillingCategory, MissingInfo, intraOpMaterialsSubSections } from '../../enums'
import { getObjectKey } from '../../utils'
import { checkMissingInfo } from '../generic-utilities'

const missingInfoKeys = ['amount']

// bubba TODO: refactor this
const materialsMissingInfoCheck = [
  { label: 'preOpSection.materials', objKey: 'materialId', keys: missingInfoKeys },
  { label: 'preOpSection.medications', objKey: 'medicationId', keys: missingInfoKeys },
  ...intraOpMaterialsSubSections
    .map(subSection => [
      { label: `intraOpSection.${subSection}.materials`, objKey: 'materialId', keys: missingInfoKeys },
      { label: `intraOpSection.${subSection}.medications`, objKey: 'medicationId', keys: missingInfoKeys },
      { label: `intraOpSection.${subSection}.equipments`, objKey: 'name', keys: missingInfoKeys },
      { label: `intraOpSection.${subSection}.sterileGoods`, objKey: 'sterileGood', keys: missingInfoKeys },
    ])
    .reduce((acc, val) => acc.concat(val), []),
  { label: 'postOpSection.materials', objKey: 'materialId', keys: missingInfoKeys },
  { label: 'postOpSection.medications', objKey: 'medicationId', keys: missingInfoKeys },
]

export const computeCaseMissingInformations = (
  category: BillingCategory,
  caseObj: any, // Removed Case type to avoid type error without changing the whole function
  missingItems: string[],
  missingData: string[],
) => {
  materialsMissingInfoCheck.forEach(({ label, objKey, keys }) => {
    getObjectKey(caseObj, label).forEach?.((obj: any) => {
      keys.forEach(key => {
        checkMissingInfo(
          obj[key],
          getObjectKey(MissingInfo, `${label}.${key}`)(obj[objKey]),
          missingData,
          missingItems,
          [0, NaN],
        )
      })
    })
  })

  switch (category) {
    case BillingCategory.A:
    case BillingCategory.B:
      checkMissingInfo(
        caseObj?.billingSection?.goaNumber,
        MissingInfo.billingSection.goaNumber,
        missingData,
        missingItems,
        [''],
      )
      break
    case BillingCategory.C1:
    case BillingCategory.C2:
    case BillingCategory.C3:
      break
    case BillingCategory.D:
    case BillingCategory.E:
    case BillingCategory.F:
      checkMissingInfo(
        caseObj?.billingSection?.opsCode,
        MissingInfo.billingSection.opsCode,
        missingData,
        missingItems,
        [''],
      )
      break
    case BillingCategory.G:
      break
  }

  return true
}
