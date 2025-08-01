import {
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import {
  Component,
  EntityType,
  IBillObj,
  ICaseBillingSnapshot,
  IExtraCustomCosts,
  IExtraMaterial,
  InvoiceStatus,
  InvoiceType,
  auditTrailCreate,
  auditTrailUpdate,
  createCaseInvoiceBill,
  isValidNumber,
} from '@smambu/lib.constantsjs'
import { BillsObj } from 'src/schemas/billsObj.schema'
import { CaseBillingDocument } from 'src/schemas/casebilling.schema'
import { ObjectId } from 'mongodb'
import { v4 } from 'uuid'
import { EnvConfigsService, LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class BillobjService {
  constructor (
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,

    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,

    @InjectModel(BillsObj.name) private readonly billObjModel: Model<BillsObj>,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async updateManyFromSnapshot (snapshot: ICaseBillingSnapshot,
    userId: string | undefined,
    billObjs: IBillObj[],
    noAuditTrail: boolean = false) {
    const translator = await this.envConfigClient.getTranslator()

    const { bills } = createCaseInvoiceBill(translator, snapshot, billObjs)
    // TODO: I have a problem here, the totalSum is sometimes a NaN
    const promises = bills
      .filter(billobj => (billobj.status === InvoiceStatus.CANCELLED ||
        billobj.status === InvoiceStatus.CREATED) &&
        !billobj.elaborationInProgress)
      .map(current => this.updateOne({
        ...current,
        totalSum: isNaN(current.totalSum) ? 0 : current.totalSum,
        totalOwed: isValidNumber(current.totalOwed) ? current.totalOwed : 0,
      }, userId, true, noAuditTrail))

    return await Promise.all(promises)
  }

  async deleteMany (billObjsIds: string[]) {
    const objectifiedIds = billObjsIds.map(id => new ObjectId(id))

    await this.billObjModel.deleteMany({ _id: { $in: objectifiedIds } })
    return true
  }

  async createNeededWithTypes (snapShot: ICaseBillingSnapshot,
    userId: string | undefined,
    invoiceTypes: InvoiceType[],
    noAuditTrail: boolean = false) {
    try {
      const neededBillObjs = invoiceTypes.map(
        currentType =>
          <IBillObj>{
            billObjId: v4(),
            type: currentType,
            status: InvoiceStatus.CREATED,
            extraCustomCosts: <IExtraCustomCosts[]>[],
            extraMaterials: <IExtraMaterial[]>[],
            missingData: <string[]>[],
            missingItems: <string[]>[],
            caseId: snapShot.case.caseId,
          },
      )

      return await this.updateManyFromSnapshot(snapShot, userId, neededBillObjs, noAuditTrail)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getOne (objectId: string) {
    try {
      return await this.billObjModel.findById(objectId)
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateOne (billObj: IBillObj,
    userId: string | undefined,
    create: boolean = false,
    noAuditTrail: boolean = false) {
    try {
      const oldData = await this.billObjModel.findOne({
        billObjId: billObj.billObjId,
      })

      const newValue = await this.billObjModel.findOneAndUpdate({ billObjId: billObj.billObjId },
        billObj
        , create ? { upsert: true, setDefaultsOnInsert: true, new: true } : {})

      if (!noAuditTrail && !oldData)
        await auditTrailCreate({
          logClient: this.logClient,
          userId,
          entityType: EntityType.BILL,
          newObj: newValue.toJSON(),
        })
      else if (!noAuditTrail)
        await auditTrailUpdate({
          logClient: this.logClient,
          userId,
          entityType: EntityType.BILL,
          prevObj: oldData.toJSON(),
          newObj: newValue.toJSON(),
        })

      return newValue
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateExtraMaterials (billObjId: string, userId, extraMaterials: IExtraMaterial[]) {
    try {
      const oldData = await this.billObjModel.findOne({ billObjId })
      const newValue = await this.billObjModel.findOneAndUpdate({ billObjId },
        { extraMaterials })
      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.BILL,
        prevObj: oldData.toJSON(),
        newObj: newValue.toJSON(),
      })
      return newValue
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateExtraCustomCosts (billObjId: string,
    userId: string,
    extraCustomCosts: IExtraCustomCosts[]) {
    try {
      const oldData = await this.billObjModel.findOne({ billObjId })
      const newValue = await this.billObjModel.findOneAndUpdate({ billObjId },
        { extraCustomCosts })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId,
        entityType: EntityType.BILL,
        prevObj: oldData.toJSON(),
        newObj: newValue.toJSON(),
      })

      return newValue
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async populateBillingDocumentWithBillingObjects (billingDocument: CaseBillingDocument) {
    let promises = billingDocument.bills.map(billObjId => this.getOne(billObjId))

    const billObjsRaw = await Promise.all(promises)
    const billObjs = billObjsRaw.map(current => current.toObject() as IBillObj)

    const parsedBillingDocument = { ...billingDocument.toObject(), bills: billObjs }
    return parsedBillingDocument
  }

  async findManyByBillObjIds (billObjIds: string[]) {
    try {
      return await this.billObjModel.find({ billObjId: { $in: billObjIds } })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateManyByBillObjStatuses (billObjIds: string[], status: InvoiceStatus) {
    try {
      // TODO: we can very probably delete both oldValues and newValues since they
      // are just find that don't get used (consuming db effort)
      const _oldValues = (await this.findManyByBillObjIds(billObjIds))
        .reduce((prev, curr) => ({ ...prev, [curr.billObjId]: curr }), {})
      await this.billObjModel.updateMany({ billObjId: { $in: billObjIds } }, { status })
      const _newValues = await this.findManyByBillObjIds(billObjIds)

      return 'done'
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async updateManyByBillObj (billObjs: Partial<IBillObj>[]) {
    try {
      await Promise.all(
        billObjs.map(async billObj => {
          await this.billObjModel.updateOne({
            billObjId: billObj.billObjId,
          }, billObj)
        })
      )
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findManyByIds (ids: string[]) {
    try {
      const objectifiedIds = ids.map(id => new ObjectId(id))
      return await this.billObjModel.find({ _id: { $in: objectifiedIds } })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async findManyByMissingData (missingData: string[]) {
    try {
      return await this.billObjModel.find({ missingData })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteByCaseId (caseId: string) {
    try {
      await this.billObjModel.deleteMany({ caseId })
      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
