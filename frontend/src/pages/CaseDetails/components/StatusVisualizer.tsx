import { Case, CaseStatus, EPcMaterialsStatus, permissionRequests } from '@smambu/lib.constants'
import { Box, Typography } from '@mui/material'
import { TextIconButton } from 'components/Buttons'
import { WarningIcon } from 'components/Icons'
import StandardDialog from 'components/StandardDialog'
import { FormikProps } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { trlb } from 'utilities'

const StatusVisualizer = ({
  caseItem,
  form,
  canViewBillingWarnings,
}: {
  caseItem: Case
  form: FormikProps<any>
  canViewBillingWarnings: boolean
}) => {
  const [open, setOpen] = React.useState(false)
  const checkPermission = useGetCheckPermission()
  const canViewCaseStatus = checkPermission(permissionRequests.canViewCaseStatus, { caseItem })

  const incompleteCase = form?.values?.status === CaseStatus.INFORMATION_INCOMPLETE ||
    (caseItem.pcMaterial != null &&
      caseItem.pcMaterial.status === EPcMaterialsStatus.INFORMATION_INCOMPLETE)

  // UR TODO: This is a placeholder for the actual missing information from UR
  // Also add pcMaterial missing information
  const missingInformations = [] as string[]

  missingInformations.sort((a, b) => a.localeCompare(b))

  if (!canViewCaseStatus) return null

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center' }}>
        <Typography variant='body1' sx={{ fontWeight: '600', margin: '0px 20px' }}>
          {trlb('case_header_status')}
        </Typography>
        {incompleteCase && canViewBillingWarnings
          ? (
            <TextIconButton
              text={trlb(CaseStatus.INFORMATION_INCOMPLETE)}
              icon={<WarningIcon variant='warning' />}
              sx={{ marginRight: '20px', cursor: 'pointer' }}
              onClick={() => setOpen(true)}
            />
          )
          : (
            <Typography variant='body1' sx={{ marginRight: '20px' }}>
              {trlb(form.values.status)}
            </Typography>
          )}
      </Box>
      <StandardDialog
        open={open}
        onClose={() => setOpen(false)}
        titleKey={'caseDetails_incompleteDialog_title'}
        textKey={'caseDetails_incompleteDialog_text'}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', maxHeight: 300, overflowY: 'auto' }}>
          <ul>
            {missingInformations
              .map((item, index) => (
                <li key={index}>
                  <Typography variant='body1'>{trlb(item)}</Typography>
                </li>
              ))}
          </ul>
        </Box>
      </StandardDialog>
    </>
  )
}

export default StatusVisualizer
