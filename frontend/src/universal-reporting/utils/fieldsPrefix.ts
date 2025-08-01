import { TARGETABLE_ENTITIES } from '@smambu/lib.constants'

// TODO: address this. we hardcode the fact that the fields have this prefix. the fields are saved as targetable_entities.fields.
// if we change how fields are created as node everything will break.
export const fieldPrefix = (id: string) => {
  return `${TARGETABLE_ENTITIES.FIELDS}.{${id}}.${TARGETABLE_ENTITIES.FIELDS}`
}
