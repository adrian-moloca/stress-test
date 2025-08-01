import { User, UserSchema } from './user.schema'
import {
  RoleAssociation,
  RoleAssociationSchema,
} from './roleAssociation.schema'
import { DebtorNumber, DebtorNumberSchema } from './debtorNumber.schema'
import { Credential, CredentialSchema } from './credentials.schema'
import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'

export default [
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: RoleAssociation.name,
    schema: RoleAssociationSchema,
  },
  {
    name: DebtorNumber.name,
    schema: DebtorNumberSchema,
  },
  {
    name: Credential.name,
    schema: CredentialSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
]
