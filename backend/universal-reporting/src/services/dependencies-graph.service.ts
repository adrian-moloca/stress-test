import { Injectable } from '@nestjs/common'
import { Component, DEPENDENCY_NODE_STATUS, tDependencyGraphNode, tMarkAsDirtyPayload, tNodesToProcessPayload } from '@smambu/lib.constantsjs'
import { LoggingService } from '@smambu/lib.commons-be'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DependenciesGraph } from 'src/schemas/dependencies-graph.schema'

@Injectable()
export class DependenciesGraphService {
  constructor (
    @InjectModel(DependenciesGraph.name)
    private readonly dependenciesGraphModel: Model<DependenciesGraph>,
    private loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.DEPENCECIES_GRAPH_SERVICE)
  }

  async getDepencedyGraphsNodeToProcess ():
  Promise<tNodesToProcessPayload> {
    try {
      const processableStates = [
        DEPENDENCY_NODE_STATUS.DIRTY,
        // XXX: The error states are not to be re-evaluated automatically,
        // but they might be very useful as a debug process - that's way
        // i'm leaving them here in an array (although commented out)
        // DEPENDENCY_NODE_STATUS.ERROR_CONDITION,
        // DEPENDENCY_NODE_STATUS.ERROR_EXPRESSION,
      ]

      const pipeline = [
        { $match: { status: { $in: processableStates } } },

        {
          $group: {
            _id: '$entity',
            docs: { $push: '$$ROOT' }
          }
        },

        {
          $project: {
            _id: 0,
            k: '$_id',
            v: '$docs'
          }
        },

        {
          $group: {
            _id: null,
            kvPairs: { $push: { k: '$k', v: '$v' } }
          }
        },
        {
          $project: {
            _id: 0,
            result: { $arrayToObject: '$kvPairs' }
          }
        },

        {
          $replaceRoot: { newRoot: '$result' }
        }
      ]

      const [groupedResult] = await this.dependenciesGraphModel.aggregate(pipeline).exec()

      return groupedResult ?? {}
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getAffectedNodes (depencencyPaths:string[], skipTenant?: boolean) {
    try {
      if (skipTenant) {
        const als = global.als
        const store = { bypassTenant: true }
        als.enterWith(store)
      }

      const nodesToProcess = await this.dependenciesGraphModel.find({
        $or: [
          { expressionDeps: { $in: depencencyPaths } },
          { conditionDeps: { $in: depencencyPaths } },
        ]
      })

      return nodesToProcess
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  async markNodesAsDirty (nodesPayload:tMarkAsDirtyPayload[]) {
    try {
      await this.dependenciesGraphModel.updateMany(
        { $or: nodesPayload },
        { $set: { status: DEPENDENCY_NODE_STATUS.DIRTY } }
      )
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  emitNode = async (node: tDependencyGraphNode) => {
    try {
      const nodeWithPolicy = {
        ...node,
        policy: node.policy || {
          horizontal: 'OVERWRITE',
          vertical: 'PARENT'
        }
      }

      const newNode = await this.dependenciesGraphModel.findOneAndUpdate(
        { target: node.target, tenantId: node.tenantId },
        { $set: nodeWithPolicy },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      )

      this.loggingService.logInfo(`Created/Updated node with target ${node.target} and id ${newNode.id} in the dependencies graph`, false)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  updateNode = async (node: Partial<tDependencyGraphNode>) => {
    try {
      const newNode = await this.dependenciesGraphModel.updateOne({ target: node.target }, node)

      this.loggingService.logInfo(`Updated node with target ${node.target} and id ${newNode.upsertedId?._id} in the dependecies graph`, false)

      this.loggingService.logInfo(`Update requested for node with target ${node.target} in the dependencies queue`, false)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }

  deleteNode = async (target: string, tenantId: string) => {
    try {
      await this.dependenciesGraphModel.deleteOne({ target, tenantId })

      this.loggingService.logInfo(`Deleted node with target ${target} in the dependecies graph`, false)

      this.loggingService.logInfo(`Deleted node with target ${target} from the dependencies queue`, false)
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }
}
