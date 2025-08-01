import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Case, CaseDocument } from '../schemas/cases.schema'
import { LockedWeek, LockedWeekDocument } from 'src/schemas/lockedWeeks.schema'
import { CaseBackup, CaseBackupDetails, CaseBackupDocument } from 'src/schemas/casesBackup.schema'
import { Model } from 'mongoose'
import { ClientProxy } from '@nestjs/microservices'
import { IUser, scheduleCaseDTO, lockWeekDto, Component, checkTwoDatesEqual, CaseStatus, createNotifications, NotificationType, NotificationActionType, callMSWithTimeoutAndRetry, auditTrailUpdate, EntityType, dateString, lockWeekResponseDto, getLockedWeekTimestamp, formatCaseToLimitedCase } from '@smambu/lib.constantsjs'
import { getUnixTime, parse } from 'date-fns'
import { ObjectId } from 'mongodb'
import { LoggingService } from '@smambu/lib.commons-be'

@Injectable()
export class SchedulingService {
  constructor (
    @Inject('BUCKET_CLIENT')
    private readonly bucketClient: ClientProxy,
    @Inject('ROLE_CLIENT')
    private readonly roleClient: ClientProxy,
    @InjectModel(Case.name) private readonly caseModel: Model<CaseDocument>,
    @InjectModel(LockedWeek.name) private readonly lockedWeekModel: Model<LockedWeekDocument>,
    @InjectModel(CaseBackup.name) private readonly caseBackupModel: Model<CaseBackupDocument>,
    @Inject('LOGS_CLIENT')
    private readonly logClient: ClientProxy,
    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,
    @Inject('USERS_CLIENT')
    private readonly userClient: ClientProxy,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setComponent(Component.SCHEDULING_CASES)
  }

  async scheduleCase (data: scheduleCaseDTO, user: IUser) {
    try {
      await this.loggingService.logInfo(`Scheduling case ${data.caseId} to ${data.newDate} by ${user.id}`)
      const currentCase = await this.caseModel.findOne({ _id: new ObjectId(data.caseId) })
      const lockedWeekTimestamp = getLockedWeekTimestamp(currentCase.bookingSection.date,
        process.env.VITE_TIME_ZONE)
      await this.loggingService.logDebug(`Locked week timestamp: ${lockedWeekTimestamp}`)
      const currentLockedWeek = await this.lockedWeekModel.findOne({
        timeStamp: lockedWeekTimestamp
      })
      const currentCaseBackup = await this.caseBackupModel.findOne({ lockedWeekTimestamp })
      await this.caseModel.updateOne({ _id: new ObjectId(data.caseId) }, {
        ...(data.newDate && { 'bookingSection.date': data.newDate }),
        ...(data.newStatus && { status: data.newStatus }),
        ...(data.newStatus && { lastStatusEdit: new Date() }),
        operatingRoomId: data.newOrId,
        ...(data.confirmationNote && { confirmationNote: data.confirmationNote }),
        confirmationRequestor: data.newStatus === CaseStatus.CHANGE_NOTIFIED ? user.id : null,
      }, {
        new: true,
      })
      const updatedCase = await this.caseModel.findOne({ _id: new ObjectId(data.caseId) })

      await auditTrailUpdate({
        logClient: this.logClient,
        userId: user.id,
        entityType: EntityType.CASE,
        prevObj: currentCase,
        newObj: updatedCase,
      })

      if (currentLockedWeek != null) {
        const caseBackup = {
          caseId: data.caseId,
          status: currentCase.status,
          orId: currentCase.operatingRoomId,
          date: currentCase.bookingSection.date,
        }
        if (!currentCaseBackup?.cases?.find(c => c.caseId === data.caseId) && !data.withoutBackup) {
          await this.loggingService.logDebug(`Adding case ${data.caseId} to caseBackup "${currentCaseBackup?._id ?? 'new'}"`)
          if (!currentCaseBackup)
            await this.caseBackupModel.create({
              cases: [caseBackup],
              lockedWeekTimestamp,
            })
          else
            await this.caseBackupModel.updateOne({ lockedWeekTimestamp }, {
              $push: {
                cases: caseBackup,
              },
            })
        }
      }

      return formatCaseToLimitedCase({
        associatedPatient: undefined,
        ...updatedCase.toObject() as Case,
        caseId: updatedCase._id.toString(),
      })
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async sendNotification (caseBackup: CaseBackupDetails, user?: IUser) {
    const updatedCase = await this.caseModel.findOne({ _id: new ObjectId(caseBackup.caseId) })

    const pattern = { role: 'user', cmd: 'getDoctorAssistants' }

    const payloadData = { doctorId: updatedCase.bookingSection.doctorId }
    const doctorAssistants = await callMSWithTimeoutAndRetry(this.userClient,
      pattern,
      payloadData,
      Component.SCHEDULING_CASES)

    const usersToNotify = [
      ...doctorAssistants.map(user => user.id),
      updatedCase.bookingSection.doctorId,
    ].filter(userId => userId !== user?.id)

    await this.loggingService.logInfo(`Sending notification for case ${caseBackup.caseId} to "${usersToNotify.join(', ')}" triggered by ${user?.id}`)
    if ((!checkTwoDatesEqual(caseBackup.date, updatedCase.bookingSection.date) &&
    updatedCase.status === CaseStatus.CONFIRMED)) {
      await this.loggingService.logDebug(`Sending notification "caseSchedulingEdited" for case ${caseBackup.caseId}"`)
      await createNotifications(
        this.notificationsClient, {
          usersIds: usersToNotify,
          type: NotificationType.CASE_SCHEDULING_EDITED,
          title: 'notifications_caseSchedulingEdited_title',
          body: 'notifications_caseSchedulingEdited_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${caseBackup.caseId}`,
          },
        }
      )
    } else if ((!checkTwoDatesEqual(caseBackup.date, updatedCase.bookingSection.date) ||
     caseBackup.status !== CaseStatus.CHANGE_NOTIFIED) &&
      updatedCase.status === CaseStatus.CHANGE_NOTIFIED) {
      await this.loggingService.logDebug(`Sending notification "caseChangeNotified" for case ${caseBackup.caseId}"`)
      await createNotifications(
        this.notificationsClient, {
          usersIds: usersToNotify,
          type: NotificationType.CASE_CHANGE_NOTIFIED,
          title: 'notifications_caseChangeNotified_title',
          body: 'notifications_caseChangeNotified_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: '/calendar/day',
            date: new Date(updatedCase.bookingSection.date),
          },
        }
      )
    } else if (caseBackup.status !== CaseStatus.CHANGE_REQUESTED &&
      updatedCase.status === CaseStatus.CHANGE_REQUESTED) {
      await this.loggingService.logDebug(`Sending notification "caseChangeRequested" for case ${caseBackup.caseId}"`)
      await createNotifications(
        this.notificationsClient, {
          usersIds: usersToNotify,
          type: NotificationType.CASE_CHANGE_REQUESTED,
          title: 'notifications_caseChangeRequested_title',
          body: 'notifications_caseChangeRequested_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${caseBackup.caseId}`,
          },
        }
      )
    } else if (caseBackup.status !== CaseStatus.ON_HOLD &&
       updatedCase.status === CaseStatus.ON_HOLD) {
      await this.loggingService.logDebug(`Sending notification "caseOnHold" for case ${caseBackup.caseId}"`)
      await createNotifications(
        this.notificationsClient, {
          usersIds: usersToNotify,
          type: NotificationType.CASE_ON_HOLD,
          title: 'notifications_caseOnHold_title',
          body: 'notifications_caseOnHold_body',
          action: {
            type: NotificationActionType.INTERNAL_LINK,
            url: `/cases/${caseBackup.caseId}`,
          },
        }
      )
    }
  }

  async lockWeek (data: lockWeekDto, user?: IUser): Promise<lockWeekResponseDto> {
    try {
      const parsedDate = parse(data.formattedDate, dateString, new Date())
      const lockedWeekTimestamp = getLockedWeekTimestamp(parsedDate, process.env.VITE_TIME_ZONE)
      await this.loggingService.logInfo(`Locking week with timestamp "${lockedWeekTimestamp}" by ${user?.id}`)
      const currentLockedWeek = await this.lockedWeekModel.findOne({
        timeStamp: lockedWeekTimestamp
      })
      const currentCaseBackup = await this.caseBackupModel.findOne({ lockedWeekTimestamp })
      if (!currentLockedWeek) {
        await this.loggingService.logInfo('currentLockedWeek not found')
        await this.lockedWeekModel.create({
          timeStamp: lockedWeekTimestamp,
          saveDateTimestamp: getUnixTime(new Date()),
        })
      } else {
        await this.loggingService.logDebug(`currentLockedWeek found "${currentLockedWeek._id}"`)
        await this.lockedWeekModel.updateOne({ timeStamp: lockedWeekTimestamp }, {
          saveDateTimestamp: getUnixTime(new Date()),
        })
      }
      if (currentCaseBackup != null) {
        await this.loggingService.logDebug(`currentCaseBackup found "${currentCaseBackup._id}"`)

        await Promise.all(currentCaseBackup.cases
          .map?.(async caseBackup => this.sendNotification(caseBackup, user)))

        await this.caseBackupModel.deleteOne({ lockedWeekTimestamp })
      } else {
        await this.loggingService.logDebug('currentCaseBackup not found')
      }
      return { lockedWeekTimestamp }
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async getScheduledWeek (formattedDate: string) {
    try {
      const parsedDate = parse(formattedDate, dateString, new Date())
      const lockedWeekTimestamp = getLockedWeekTimestamp(parsedDate, process.env.VITE_TIME_ZONE)
      const currentLockedWeek = await this.lockedWeekModel.findOne({
        timeStamp: lockedWeekTimestamp
      })
      const currentCaseBackup = await this.caseBackupModel.findOne({ lockedWeekTimestamp })
      const response = {
        lockedWeek: currentLockedWeek,
        caseBackup: currentCaseBackup,
      }
      return response
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async resetBackup (formattedDate: string) {
    try {
      const parsedDate = parse(formattedDate, dateString, new Date())
      const lockedWeekTimestamp = getLockedWeekTimestamp(parsedDate, process.env.VITE_TIME_ZONE)
      await this.caseBackupModel.deleteOne({ lockedWeekTimestamp })
      return lockedWeekTimestamp
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }

  async deleteCaseFromBackups (caseId: string) {
    try {
      const caseBackups = await this.caseBackupModel.find({ cases: { $elemMatch: { caseId } } })

      await Promise.all(caseBackups.map(async caseBackup => {
        await this.caseBackupModel.updateOne({ _id: caseBackup._id }, {
          $pull: {
            cases: { caseId },
          },
        })
      }))
      return true
    } catch (e) {
      await this.loggingService.throwErrorAndLog(e)
    }
  }
}
