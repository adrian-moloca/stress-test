import { LocalEvents, LocalEventsSchema } from '@smambu/lib.commons-be'
import { URDomain, URDomainSchema } from './domain.schema'
import { NamedExpression, NamedExpressionSchema } from './namedExpression.schema'
import { Proxy, ProxySchema } from './proxy.schema'
import { ImportedEvents, ImportedEventsSchema } from './imported-events.schema'
import { BillingConfig, BillingConfigSchema } from './billing-config.schema'
import { DynamicDataConfig, DynamicDataConfigSchema } from './dynamic-config.schema'
import { JsonConfig, JSonConfigSchema } from './json-config.schema'
import { DependenciesGraph, DependenciesGraphSchema } from './dependencies-graph.schema'
import { FieldOperations, FieldOperationsSchema } from './field-operations.schema'

export default [
  {
    name: NamedExpression.name,
    schema: NamedExpressionSchema,
  },
  {
    name: Proxy.name,
    schema: ProxySchema,
  },
  {
    name: URDomain.name,
    schema: URDomainSchema,
  },
  {
    name: LocalEvents.name,
    schema: LocalEventsSchema,
  },
  {
    name: ImportedEvents.name,
    schema: ImportedEventsSchema,
  },
  {
    name: JsonConfig.name,
    schema: JSonConfigSchema,
  },
  {
    name: BillingConfig.name,
    schema: BillingConfigSchema,
  },
  {
    name: DynamicDataConfig.name,
    schema: DynamicDataConfigSchema,
  },
  {
    name: DependenciesGraph.name,
    schema: DependenciesGraphSchema,
  },
  {
    name: FieldOperations.name,
    schema: FieldOperationsSchema,
  },
]
