import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
import { Capabilities, CapabilitiesSchema } from './capabilities.schema'
import { Role, RoleSchema } from './role.schema'
import {
  RoleAssociation,
  RoleAssociationSchema,
} from './roleAssociation.schema'

export default [
  {
    name: Role.name,
    schema: RoleSchema,
  },
  {
    name: RoleAssociation.name,
    schema: RoleAssociationSchema,
  },
  {
    name: Capabilities.name,
    schema: CapabilitiesSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
