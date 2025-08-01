import { tField, tFieldDefinition } from '@smambu/lib.constants'

export const findCorrespondingPayloadPathInFIelds = (
  path: string,
  readonly_fields: ReadonlyArray<Readonly<tField>>
) => {
  const splitPath = path.split('.')
  const fieldId = splitPath.shift()
  if (!fieldId) throw new Error(`invalid empty representation path for path ${path}`)

  const fieldIndex = readonly_fields.findIndex(f => f.id === fieldId)

  if (fieldIndex === -1) throw new Error(`Field ${fieldId} not found`)

  let res: string = `${fieldIndex}`
  const field = readonly_fields[fieldIndex]
  let currField: tFieldDefinition = field.definition
  let currSubFieldId = splitPath.shift()

  if (field.definition.type.kind === 'object' && currSubFieldId) {
    res = `${res}.definition.type.object.${currSubFieldId}`
    currField = field.definition.type.object[currSubFieldId]
  } else if (field.definition.type.kind === 'list' && currSubFieldId) {
    currField = field.definition.type.itemType
    res = `${res}.definition.type.itemType`
  }

  if (!currField)
    throw new Error(`Field ${currSubFieldId} not found in object ${JSON.stringify(field, null, 2)}`)
  while (splitPath.length > 0) {
    const subFieldId: string = splitPath.shift() as string // TYPESCRIPT BAD BOY
    if (currField.type.kind === 'object') {
      res = `${res}.type.object.${subFieldId}`
      currField = currField.type.object[subFieldId]
    } else if (currField.type.kind === 'list') {
      currField = currField.type.itemType
      res = `${res}.type.itemType`
    }
  }

  return { path: `${res}`, item: currField }
}
