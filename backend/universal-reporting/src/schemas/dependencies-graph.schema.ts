import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'
import {
  tCondition,
  tDependencyGraph,
  tDependencyGraphNode,
  tDependencyMap,
  tDependencyNodeStatus,
  tExpression,
  tHorizontalMergingPolicies,
  tNodeMetadata,
  tVerticalMergingPolicies,
} from '@smambu/lib.constantsjs'
import { generateSchemaWithMiddlewares } from '@smambu/lib.commons-be'

@Schema({ timestamps: true })
export class DependenciesGraph implements tDependencyGraphNode {
  @Prop({ unique: true })
  target: string

  @Prop({
    type: String,
    default: null,
    required: false,
  })
  entity: string | null

  @Prop()
  definitionDeps: string[]

  @Prop({ type: Object, default: null })
  expression: tExpression | null

  @Prop()
  expressionErrors?: string

  @Prop()
  expressionDeps: string[]

  @Prop({ type: Object })
  expressionDepsDetails: tDependencyMap

  @Prop()
  status: tDependencyNodeStatus

  @Prop()
  version: string

  @Prop({ type: Object, default: null })
  condition: tCondition | null

  @Prop()
  conditionExpressionErrors?: string

  @Prop({ type: [String], default: null })
  conditionDeps: string[] | null

  @Prop({ type: Object })
  conditionDepsDetail: tDependencyMap

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  lastConditionValue: boolean | null

  @Prop({ type: Object })
  policy: {
    horizontal: tHorizontalMergingPolicies
    vertical: tVerticalMergingPolicies
  }

  @Prop()
  tenantId: string

  @Prop()
  subNodes: tDependencyGraph

  @Prop()
  subNodesDefinitions: tDependencyGraph

  @Prop()
  childDeps: string[]

  @Prop({ type: Object })
  metadata: tNodeMetadata
}

export type DependenciesGraphDocument = HydratedDocument<DependenciesGraph>

export const DependenciesGraphSchema = generateSchemaWithMiddlewares(DependenciesGraph)

// XXX At the moment, there is no need to track all dependencies graph events - they are A LOT, so
// they make a lot of noise (for nothing much).
// If they are ever needed, the infrastructure is already there
// DependenciesGraphSchema.plugin(localEventsPlugin, { source: SOURCE_SCHEMAS.DEPENDENCIES_GRAPH })

DependenciesGraphSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    return ret
  },
})
