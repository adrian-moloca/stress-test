import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, SortOrder } from 'mongoose'
import { AuditAction, Component, EntityType, IAnagraphicSetup, IAuditTrailRow, Level, QueryAuditTrailDto, defaultAuditTrailBulkThreshold, getAnagraphicVersionsDifferencesArrays, getDifferencesArray, parseErrorMessage, sanitizeRegex } from '@smambu/lib.constantsjs'
import { AuditTrail, AuditTrailDocument } from 'src/schemas/auditTrail.schema'
import { LogsService } from 'src/services/logs.service'

@Injectable()
export class AuditTrailService {
  constructor (
    @InjectModel(AuditTrail.name)
    private readonly auditTrailModel: Model<AuditTrailDocument>,
    private readonly logService: LogsService
  ) { }

  async throwErrorAndLog (e) {
    console.error('throwErrorAndLog', e)
    const message = parseErrorMessage(e)

    await this.logService.createOne({
      component: Component.AUDIT_TRAIL,
      level: Level.ERROR,
      message,
    })

    throw new Error(message)
  }

  async saveAudit ({
    userId,
    entityType,
    entityNameOrId,
    entityDatabaseId,
    action,
    prevObj,
    newObj,
    anagraphicSetup,
  }: {
    userId: string,
    entityType: EntityType,
    entityNameOrId: string,
    entityDatabaseId: string,
    action: AuditAction,
    prevObj: any,
    newObj: any,
    anagraphicSetup?: IAnagraphicSetup
  }) {
    try {
      const auditTrailLimit = !isNaN(Number(process.env.AUDIT_TRAIL_BULK_THRESHOLD))
        ? Number(process.env.AUDIT_TRAIL_BULK_THRESHOLD)
        : defaultAuditTrailBulkThreshold
      let auditTrailFields = []
      const diffList = entityType === EntityType.ANAGRAPHIC
        ? getAnagraphicVersionsDifferencesArrays(anagraphicSetup, prevObj ?? {}, newObj ?? {})
        : getDifferencesArray(prevObj ?? {}, newObj ?? {})

      if (!auditTrailLimit || diffList.length <= auditTrailLimit)
        diffList.forEach(({ key, previousValue, newValue }) => {
          auditTrailFields.push({
            userId,
            entityType,
            entityNameOrId,
            entityDatabaseId,
            action,
            field: key,
            previousValue,
            newValue,
            bulked: false,
            version: 1,
          })
        })
      else
        auditTrailFields = [{
          userId,
          entityType,
          entityNameOrId,
          entityDatabaseId,
          action,
          field: diffList.map(({ key }) => key).join(', '),
          previousValue: diffList.map(({ previousValue }) => previousValue).join(', '),
          newValue: diffList.map(({ newValue }) => newValue).join(', '),
          bulked: true,
          version: 1,
        }
        ]

      await this.auditTrailModel.create(auditTrailFields)
      return true
    } catch (error) {
      await this.throwErrorAndLog(error)
    }
  }

  async findAuditTrails (queries: QueryAuditTrailDto): Promise<{
    results: IAuditTrailRow[],
    total: number,
    currentPage: number,
    limit: number,
  }> {
    try {
      const tenantId = global.als.getStore()?.tenantId
      const atlasSearchDriver = process.env.ATLAS_SEARCH_DRIVER === 'true'

      if (!atlasSearchDriver)
        return this.findLocalAuditTrails(queries)

      return this.searchAuditTrailsAtlasSearch(queries, tenantId)
    } catch (error) {
      await this.throwErrorAndLog(error)
    }
  }

  async searchAuditTrailsAtlasSearch (
    queries: QueryAuditTrailDto,
    tenantId: string | undefined
  ): Promise<{
      results: any[],
      total: number,
      currentPage: number,
      limit: number,
    }> {
    const { search, userId, from, to, action, sortBy, sortOrder, page, limit } = queries

    /*
     We need to block the automatic insertion of the tenant filter in the schema,
     because $search need to be the first stage of the pipeline.
     */
    global.als.enterWith({ bypassTenant: true })

    const filterConditions = [
      { version: 1 },
      from && !search && { createdAt: { $gte: new Date(Number(from)) } },
      to && !search && { createdAt: { $lte: new Date(Number(to)) } },
      userId && { userId },
      action && { action },
      tenantId && { tenantId }, // To be sure that the search is done only on the current tenant
    ].filter(Boolean)

    const searchQuery = search
      ? {
        $search: {
          index: 'audit-trail-search',
          compound: {
            filter: [
              // Add tenant filter at search level for better performance
              tenantId && {
                text: {
                  query: tenantId,
                  path: 'tenantId',
                }
              },
              // Add date filters at search level instead of must clause
              from && {
                range: {
                  path: 'createdAt',
                  gte: new Date(Number(from))
                }
              },
              to && {
                range: {
                  path: 'createdAt',
                  lte: new Date(Number(to))
                }
              }
            ].filter(Boolean),
            must: [{
              text: {
                query: search,
                path: ['entityType', 'entityNameOrId', 'entityDatabaseId', 'previousValue', 'newValue', 'field'],
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 1
                }
              }
            }]
          }
        }
      }
      : null

    const matchStage = filterConditions.length ? { $match: { $and: filterConditions } } : null
    const sortStage = sortBy && sortOrder
      ? {
        $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>
      }
      : null

    const parsedPage = Number(page) || 0
    const parsedLimit = Number(limit) || 100

    const pipeline = [
      searchQuery,
      matchStage,
      sortStage,
      {
        $facet: {
          results: [
            { $skip: parsedPage * parsedLimit },
            { $limit: parsedLimit },
            { $project: { __v: 0 } }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ].filter(Boolean)

    const [result] = await this.auditTrailModel.aggregate(pipeline)

    return {
      results: result.results,
      total: result.total[0]?.count || 0,
      currentPage: parsedPage,
      limit: parsedLimit
    }
  }

  async findLocalAuditTrails (queries: QueryAuditTrailDto): Promise<{
    results: any[],
    total: number,
    currentPage: number,
    limit: number,
  }> {
    const { search, userId, from, to, action, sortBy, sortOrder, page, limit } = queries

    const filterConditions = [
      { version: 1 },
      search && {
        $or: [
          'entityType', 'entityNameOrId', 'entityDatabaseId',
          'previousValue', 'newValue', 'field',
        ].map(field => ({ [field]: new RegExp(sanitizeRegex(search), 'i') }))
      },
      from && { createdAt: { $gte: new Date(Number(from)) } },
      to && { createdAt: { $lte: new Date(Number(to)) } },
      userId && { userId },
      action && { action },
    ].filter(Boolean)

    const query = filterConditions.length ? { $and: filterConditions } : {}
    const parsedPage = Number(page) || 0
    const parsedLimit = Number(limit) || 100
    const sortOptions = sortBy && sortOrder
      ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as { string: SortOrder }
      : {}

    // Execute queries in parallel
    const [total, auditTrails] = await Promise.all([
      this.auditTrailModel.countDocuments(query).exec(),
      this.auditTrailModel.find(query, { __v: 0 })
        .skip(parsedPage * parsedLimit)
        .limit(parsedLimit)
        .sort(sortOptions)
        .lean()
        .exec()
    ])

    return {
      results: auditTrails,
      total,
      currentPage: parsedPage,
      limit: parsedLimit
    }
  }

  async findAuditTrail (id: string) {
    const data = await this.auditTrailModel.findById(id)

    return data
  }

  async createAtlasSearchIndex () {
    try {
      const index = {
        name: 'audit-trail-search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              entityType: { type: 'string' },
              entityNameOrId: { type: 'string' },
              entityDatabaseId: { type: 'string' },
              previousValue: { type: 'string' },
              newValue: { type: 'string' },
              field: { type: 'string' },
              tenantId: { type: 'string' },
              createdAt: { type: 'date' },
            }
          }
        },
      }

      return await this.auditTrailModel.createSearchIndex(index)
    } catch (error) {
      await this.throwErrorAndLog(error)
    }
  }
}
