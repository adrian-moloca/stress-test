import { permissionRequests } from '../enums'
import { Case, UserPermissions } from '../types'
import { booleanPermission } from './permissions'

export const casePermissionsParser = (
  caseItem: Case,
  userPermissions: UserPermissions,
  calculatedPermissions: Record<string, any>
) => {
  const canViewPatient = booleanPermission(
    permissionRequests.canViewPatient,
    { userPermissions, props: { patient: caseItem.bookingPatient } },
  )

  return {
    ...caseItem,
    bookingPatient: canViewPatient ? caseItem.bookingPatient : undefined,
    notesSection: {
      ...caseItem.notesSection,
      notes: calculatedPermissions.canViewBookingNotes ? caseItem.notesSection.notes : undefined,
    },

    // Uploads
    uploads: calculatedPermissions.canViewDocuments ? caseItem.uploads : undefined,
    checkinUploads: calculatedPermissions.canViewCheckinDocuments
      ? caseItem.checkinUploads
      : undefined,
    intraOpUploads: calculatedPermissions.canViewIntraOpDocuments
      ? caseItem.intraOpUploads
      : undefined,
    checkoutUploads: calculatedPermissions.canViewCheckoutDocuments
      ? caseItem.checkoutUploads
      : undefined,

    preOpSection: {
      ...caseItem.preOpSection,
      notes: calculatedPermissions.canViewSurgeryNotes || calculatedPermissions.canViewPreOpNotes
        ? caseItem.preOpSection.notes
        : undefined,
      additionalNotes: calculatedPermissions.canViewSurgeryNotes ||
        calculatedPermissions.canViewPreOpNotes
        ? caseItem.preOpSection.additionalNotes
        : undefined,
    },

    intraOpSection: {
      ...caseItem.intraOpSection,
      notes: calculatedPermissions.canViewSurgeryNotes || calculatedPermissions.canViewIntraOpNotes
        ? caseItem.intraOpSection.notes
        : undefined,
      additionalNotes: calculatedPermissions.canViewSurgeryNotes ||
        calculatedPermissions.canViewIntraOpNotes
        ? caseItem.intraOpSection.additionalNotes
        : undefined,
    },

    postOpSection: {
      ...caseItem.postOpSection,
      notes: calculatedPermissions.canViewSurgeryNotes ||
        calculatedPermissions.canViewPostOpNotes
        ? caseItem.postOpSection.notes
        : undefined,
      additionalNotes: calculatedPermissions.canViewSurgeryNotes ||
        calculatedPermissions.canViewPostOpNotes
        ? caseItem.postOpSection.additionalNotes
        : undefined,
    },

    surgerySection: calculatedPermissions.canViewSurgeryInfo ? caseItem.surgerySection : undefined,
    timestamps: {
      ...caseItem.timestamps,

      surgeryStartTimestamp: calculatedPermissions.canViewIntraOpDocumentation &&
        calculatedPermissions.canViewSurgeryTimestamps
        ? caseItem.timestamps.surgeryStartTimestamp
        : undefined,
      surgeryEndTimestamp: calculatedPermissions.canViewIntraOpDocumentation &&
        calculatedPermissions.canViewSurgeryTimestamps
        ? caseItem.timestamps.surgeryEndTimestamp
        : undefined,

      cutTimestap: calculatedPermissions.canViewSurgeryTimestamps ||
        calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.cutTimestap
        : undefined,

      anesthesiologistOnSiteTimestamp: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.anesthesiologistOnSiteTimestamp
        : undefined,
      anesthesiaFinishedTimestap: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.anesthesiaFinishedTimestap
        : undefined,
      anesthesiaStartedTimestamp: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.anesthesiaStartedTimestamp
        : undefined,
      endOfSurgicalMeasuresTimestamp: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.endOfSurgicalMeasuresTimestamp
        : undefined,
      extubationTimestap: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.extubationTimestap
        : undefined,
      intubationTimestap: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.intubationTimestap
        : undefined,
      releaseForSurgeryTimestap: calculatedPermissions.canViewAnesthesiaTimestamps
        ? caseItem.timestamps.releaseForSurgeryTimestap
        : undefined,

      patientArrivalTimestamp: calculatedPermissions.canViewCheckinTimestamp
        ? caseItem.timestamps.patientArrivalTimestamp
        : undefined,

      readyForRecoveryTimestamp: calculatedPermissions.canViewPatientTimestamps
        ? caseItem.timestamps.readyForRecoveryTimestamp
        : undefined,
      roomEnterTimestamp: calculatedPermissions.canViewPatientTimestamps
        ? caseItem.timestamps.roomEnterTimestamp
        : undefined,
      roomExitTimestmap: calculatedPermissions.canViewPatientTimestamps
        ? caseItem.timestamps.roomExitTimestmap
        : undefined,

      preopStartedTimestamp: calculatedPermissions.canViewPreopTimestamps
        ? caseItem.timestamps.preopStartedTimestamp
        : undefined,
      preopFinishedTimestamp: calculatedPermissions.canViewPreopTimestamps
        ? caseItem.timestamps.preopFinishedTimestamp
        : undefined,

      postOpStartedTimestap: calculatedPermissions.canViewPostOpTimestamps
        ? caseItem.timestamps.postOpStartedTimestap
        : undefined,
      postOpFinishedTimestap: calculatedPermissions.canViewPostOpTimestamps
        ? caseItem.timestamps.postOpFinishedTimestap
        : undefined,
      arrivedInRecoveryRoomTimestamp: calculatedPermissions.canViewPostOpTimestamps
        ? caseItem.timestamps.arrivedInRecoveryRoomTimestamp
        : undefined,
      readyForReleaseTimestamp: calculatedPermissions.canViewPostOpTimestamps
        ? caseItem.timestamps.readyForReleaseTimestamp
        : undefined,

      dischargedTimestamp: calculatedPermissions.canViewCheckoutTimestamp
        ? caseItem.timestamps.dischargedTimestamp
        : undefined,
    }
  }
}
