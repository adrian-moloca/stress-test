import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { anagraphicsTypes, getAnagraphicFieldsBase, getAnagraphicKeyIndexes, getComposedAnagraphicKey, SOURCE_SCHEMAS, staticAnagraphicsSetups, tContextTest } from '@smambu/lib.constantsjs'
import Random from 'meteor-random-universal'
import { generateSchemaWithMiddlewares, getConnection, localEventsPlugin, tAnagraphicMetadataRawValue, tAnagraphicRawData } from '@smambu/lib.commons-be'
import { DynamicAnagraphicsSetups } from './dynamic-anagraphics-setups.schema'

export type AnagraphicDataDocument = AnagraphicData & Document

@Schema({ timestamps: true })
export class AnagraphicData {
  @Prop({
    type: String,
    default: () => `anag_${Random.id()}`,
    required: true,
  })
  _id: string

  @Prop()
  anagraphicType: anagraphicsTypes

  @Prop()
  subType: anagraphicsTypes

  @Prop()
  fromDate: Date

  @Prop()
  rows: (Date | number | string | boolean)[]

  @Prop({ type: [String] })
  anagraphicFields: string[]

  @Prop()
  tenantId: string
}

export const AnagraphicDataSchema = generateSchemaWithMiddlewares(AnagraphicData)

const rendererFun = async (source: tAnagraphicRawData, context: tContextTest) => {
  if (source == null)
    return null

  const {
    rows,
    anagraphicType,
    subType,
    tenantId
  } = source

  const conn = getConnection(context)
  if (!conn.models[DynamicAnagraphicsSetups.name])
    // @ts-expect-error model-error
    conn.model(DynamicAnagraphicsSetups.name, DynamicAnagraphicsSetups)

  const dynamicAnagraphicsSetupsModel = conn.model(DynamicAnagraphicsSetups.name)

  // Get dynamic setups from database
  const dynamicAnagraphicSetups = await dynamicAnagraphicsSetupsModel.findOne({ tenantId })

  const fields = getAnagraphicFieldsBase(
    staticAnagraphicsSetups,
    dynamicAnagraphicSetups?.setups ?? [],
    anagraphicType,
    subType
  )
  const keyFields = getAnagraphicKeyIndexes(fields)

  const parsedAnagraphic = {}

  for (const row of rows) {
    const keyString:string[] = []

    keyFields.forEach(current => {
      keyString.push(row[current])
    })

    const assembledKey = getComposedAnagraphicKey(keyString)

    parsedAnagraphic[assembledKey] = {}

    for (let i = 0; i < (row as Array<unknown>).length; i++) {
      const currentKey = fields[i].name
      parsedAnagraphic[assembledKey][currentKey] = row[i]
    }
  }

  return parsedAnagraphic
}

const metadataFun = (original:tAnagraphicMetadataRawValue,
  updated:tAnagraphicMetadataRawValue) => {
  const metadata = {
    anagraphicType: '',
    subType: '',
  }

  if (original != null) {
    metadata.anagraphicType = original.anagraphicType
    metadata.subType = original.subType

    return metadata
  }

  if (updated != null) {
    metadata.anagraphicType = updated.anagraphicType
    metadata.subType = updated.subType

    return metadata
  }

  return null
}

AnagraphicDataSchema.plugin(localEventsPlugin, {
  source: SOURCE_SCHEMAS.ANAGRAPHICS,
  metadataFun,
  rendererFun
})
