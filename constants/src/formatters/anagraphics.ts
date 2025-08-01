import { IAnagraphicVersion } from '../types'
import { getRandomUniqueId } from '../utils'

export const formatVersionForFE = (version: any): IAnagraphicVersion | null => {
  if (!version) return null
  const { fromDate, createdAt, updatedAt, rows, anagraphicFields, ...rest } = version

  return {
    ...rest,
    fromDate: fromDate ? new Date(fromDate) : null,
    createdAt: createdAt ? new Date(createdAt) : null,
    updatedAt: updatedAt ? new Date(updatedAt) : null,
    previousVersion: rest.previousVersion ? formatVersionForFE(rest.previousVersion) : null,
    nextVersion: rest.nextVersion ? formatVersionForFE(rest.nextVersion) : null,
    anagraphicFields,
    rows: (rows ?? []).map((row: any, rowIndex: number) =>
      Array.isArray(row) // To manage the old versions of anagraphic
        ? row.reduce(
          (acc, curr, fieldIndex) => {
            if (curr != null) acc[anagraphicFields[fieldIndex]] = curr
            return acc
          },
          { id: rowIndex, key: getRandomUniqueId() },
        )
        : { ...row, key: row.key ?? getRandomUniqueId() }),
  }
}

export const formatNewVersion = (version?: IAnagraphicVersion) => ({
  ...JSON.parse(JSON.stringify(version ?? { rows: [] })),
  _id: undefined,
  fromDate: new Date(),
  new: true,
})
