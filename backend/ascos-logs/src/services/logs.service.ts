import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { CreateLogDto, QueryLogDto, sanitizeRegex } from '@smambu/lib.constantsjs'
import { Logs, LogsDocument } from 'src/schemas/logs.schema'
import { AuditTrail, AuditTrailDocument } from 'src/schemas/auditTrail.schema'
import { generateDataIds, resetTenantsData } from '@smambu/lib.commons-be'

@Injectable()
export class LogsService {
  private models: Array<{ model: Model<any>; label: string }>
  constructor (
    @InjectModel(Logs.name)
    private readonly logsModel: Model<LogsDocument>,
    @InjectModel(AuditTrail.name)
    private readonly auditTrailModel: Model<AuditTrailDocument>,
  ) {
    this.models = [
      { model: this.auditTrailModel, label: 'audittrails' },
      { model: this.logsModel, label: 'logs' },
    ]
  }

  async createOne (data: CreateLogDto) {
    // eslint-disable-next-line new-cap
    const log = new this.logsModel(data)

    await log.save()

    return log
  }

  async findLogs (queries: QueryLogDto) {
    const { search, component, from, to, level, sortBy, sortOrder, page, limit } = queries

    const regExp = new RegExp(sanitizeRegex(search), 'i')

    const searchQuery = search
      ? [
        {
          $or: [
            { component: regExp },
            { level: regExp },
            { message: regExp },
          ],
        },
      ]
      : []

    const dateFromQuery = from
      ? [
        {
          createdAt: {
            $gte: new Date(Number(from)),
          },
        },
      ]
      : []

    const dateToQuery = to
      ? [
        {
          createdAt: {
            $lte: new Date(Number(to)),
          },
        },
      ]
      : []

    const componentQuery = component
      ? [
        {
          component,
        },
      ]
      : []

    const levelQuery = level
      ? [
        {
          level,
        },
      ]
      : []

    const andQueries = [
      ...searchQuery,
      ...componentQuery,
      ...levelQuery,
      ...dateFromQuery,
      ...dateToQuery
    ] as Array<
      FilterQuery<Logs>
    >

    const total = await this.logsModel
      .countDocuments(
        andQueries.length
          ? {
            $and: andQueries,
          }
          : {},
      )
      .exec()

    const query = this.logsModel
      .find(
        andQueries.length
          ? {
            $and: andQueries,
          }
          : {},
        { __v: 0 },
      )
      .skip(
        (!isNaN(Number(page)) ? Number(page) : 0) *
          (!isNaN(Number(limit)) ? Number(limit) : 100),
      )
      .limit(!isNaN(Number(limit)) ? Number(limit) : 100)
      .sort({
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      })
      .lean()

    const logs = await query.exec()

    const results = logs.map(current => ({
      id: current._id,
      message: current.message,
      level: current.level,
      tenantId: current.tenantId,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      component: current.component,
    }))

    return {
      results,
      total,
      currentPage: page ?? 1,
      limit: limit ?? 100,
    }
  }

  async findLog (id: string) {
    const data = await this.logsModel.findById(id)

    return data
  }

  async generateIds (data: Record<string, any[]>) {
    try {
      return generateDataIds(this.models, data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async resetData (data: Record<string, any[]>) {
    try {
      return resetTenantsData(this.models, data)
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}
