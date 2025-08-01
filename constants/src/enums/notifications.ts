/* eslint-disable no-unused-vars */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READED = 'readed',
}

export enum NotificationActionType {
  INTERNAL_LINK = 'internal_link',
}

export enum NotificationType {
  GENERIC = 'generic',
  USER_UPDATED = 'user_updated',
  D_OP_CHANGE_REQUESTED = 'd_op_change_requested',
  NEW_BOOKING_REQUEST = 'new_booking_request',
  CASE_BOOKING_EDITED = 'case_booking_edited',
  CASE_SURGERY_EDITED = 'case_surgery_edited',
  CASE_SCHEDULING_EDITED = 'case_scheduling_edited',
  CASE_CONFIRMED = 'case_confirmed',
  CASE_CHANGE_REQUESTED = 'case_change_requested',
  CASE_CHANGE_NOTIFIED = 'case_change_notified',
  CASE_ON_HOLD = 'case_on_hold',
  COST_ESTIMATE_GENERATED = 'cost_estimate_generated',
  BILL_STANDARD_GENERATED = 'bill_standard_generated',
  BILL_CANCELLATION_GENERATED = 'bill_cancellation_generated',
  PDF_ARCHIVE_GENERATED = 'pdf_archive_generated',
  PRESCRIPTION_STANDARD_GENERATED = 'prescript_standard_generated',
  PRESCRIPTION_CANCELLATION_GENERATED = 'prescript_cancellation_generated',
}

export const getRedisNotificationKey = (userId: string) => `notifications_${userId}`
