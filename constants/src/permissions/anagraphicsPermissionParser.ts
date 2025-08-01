import { anagraphicsTypes, getAnagraphicFields } from '../enums'
import { IAnagraphicRow, tFullAnagraphicSetup, UserPermissions } from '../types'
import { getRandomUniqueId } from '../utils'

export const anagraphicsPermissionParser = async ({
  subType,
  anagraphicSetup,
  rows,
  canViewAll,
  canViewNames,
}: {
  subType: anagraphicsTypes,
  anagraphicSetup: tFullAnagraphicSetup,
  rows: IAnagraphicRow[],
  userPermissions: UserPermissions
  canViewAll: boolean,
  canViewNames: boolean,
}) => {
  if (canViewAll) return rows

  if (!canViewNames) return []

  const fields = getAnagraphicFields(anagraphicSetup, subType)
  return rows.map((row, rowIndex) => {
    const filteredRow: IAnagraphicRow = {
      id: rowIndex,
      key: getRandomUniqueId()
    }
    fields.forEach((field, fieldId) => {
      if (field.isKey || field.isName || field.isPrice)
        filteredRow[field.name] = row[fieldId]
    })
    return filteredRow
  })
}
