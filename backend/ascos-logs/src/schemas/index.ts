import { AuditTrail, AuditTrailSchema } from './auditTrail.schema'
import { Logs, LogsSchema } from './logs.schema'

export default [
  {
    name: AuditTrail.name,
    schema: AuditTrailSchema,
  },
  {
    name: Logs.name,
    schema: LogsSchema,
  },
]
