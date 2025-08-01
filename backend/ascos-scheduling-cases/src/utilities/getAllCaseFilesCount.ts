export const getCaseFilesCount = (caseItem: any) => // Removed caseItem type to avoid type errors without changing the whole file
  (caseItem.uploads?.length ?? 0) +
  (caseItem.checkinUploads?.length ?? 0) +
  (caseItem.intraOpUploads?.length ?? 0) +
  (caseItem.checkoutUploads?.length ?? 0)
