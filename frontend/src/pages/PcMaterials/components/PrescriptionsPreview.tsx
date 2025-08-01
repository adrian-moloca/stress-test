import { ArrowBackIos, ArrowForwardIos, Clear, Visibility, Add } from '@mui/icons-material'
import { Box, Button, IconButton, Modal, Paper, Typography } from '@mui/material'
import { EPcMaterialsStatus, ILimitedCase } from '@smambu/lib.constants'
import { useGeneratePrescriptions, useGetPcMaterialsByCasesIds } from 'hooks/pcMaterialsHooks'
import React from 'react'
import { trlb } from 'utilities'
import PrescriptionsPreviewContainer from './PrescriptionsPreviewContainer'

export const PRESCRIPTIONS_PREVIEW_TYPES = {
  GENERATE: 'generate',
  CANCEL: 'cancel',
  SHOW: 'show',
} as const

export type tReceiptPreviewType =
  typeof PRESCRIPTIONS_PREVIEW_TYPES[keyof typeof PRESCRIPTIONS_PREVIEW_TYPES]

const setups = {
  generate: {
    title: 'prescriptions_generateTitle',
    buttonLabel: 'pcMaterials_generatePrescriptions',
    actionButtonLabel: 'prescriptions_generate_button',
    icon: <Add />,
  },
  cancel: {
    title: 'prescriptions_cancelTitle',
    buttonLabel: 'pcMaterials_cancelPrescriptions',
    actionButtonLabel: 'prescriptions_cancel_button',
    icon: <Clear />,
  },
  show: {
    title: 'prescriptions_showTitle',
    buttonLabel: 'pcMaterials_showPrescriptions',
    actionButtonLabel: null,
    icon: <Visibility />,
  },
}

const getDebtorsList = (cases: ILimitedCase[]) =>
  cases.reduce((acc, caseItem) => {
    if (caseItem.associatedDoctor?.id &&
      !acc.includes(caseItem.associatedDoctor.id)) {
      acc.push(caseItem.associatedDoctor.id)
      acc.sort()
    }
    return acc
  }, [] as string[])

const PrescriptionsPreview = ({
  selectedCases,
  type,
  compactIcon,
  prescriptionToRefundId,
  refreshCurrentPage,
}: {
  selectedCases: ILimitedCase[],
  type: tReceiptPreviewType,
  compactIcon?: boolean
  prescriptionToRefundId?: string
  refreshCurrentPage: () => void
}) => {
  const [open, setOpen] = React.useState(false)
  const [debtorIndex, setDebtorIndex] = React.useState<number>(0)
  const generatePrescriptions = useGeneratePrescriptions()
  const { title, buttonLabel, actionButtonLabel, icon } = setups[type]
  const isCancellation = type === 'cancel'

  const debtorsList = getDebtorsList(selectedCases)
  const selectedDebtorId = debtorsList[debtorIndex]
  const filteredCases = selectedCases.filter((caseItem: ILimitedCase) =>
    caseItem.associatedDoctor?.id === selectedDebtorId)

  const filteredCasesIds = filteredCases.map(c => c.caseId)
  const { pcMaterials } = useGetPcMaterialsByCasesIds(filteredCasesIds)
  const filteredPcMaterials = pcMaterials.filter(pcMaterial =>
    filteredCasesIds.includes(pcMaterial.caseId))

  const disableButton = () => {
    if (type === PRESCRIPTIONS_PREVIEW_TYPES.SHOW) return false
    if (selectedCases?.length === 0) return true

    const buttonIsEnabled = selectedCases.every(selectedCase => {
      if (selectedCase.pcMaterial == null ||
        selectedCase.pcMaterial.elaborationInProgress)
        return false

      if (type === PRESCRIPTIONS_PREVIEW_TYPES.GENERATE) {
        const isReady = selectedCase.pcMaterial.status === EPcMaterialsStatus.READY
        const isProcessedAndCancelled =
          selectedCase.pcMaterial.status === EPcMaterialsStatus.PROCESSED &&
          selectedCase.pcMaterial.cancelled

        return isReady || isProcessedAndCancelled
      }

      const isProcessedAndNotCancelled =
        selectedCase.pcMaterial.status === EPcMaterialsStatus.PROCESSED &&
        !selectedCase.pcMaterial.cancelled

      return isProcessedAndNotCancelled
    })

    return !buttonIsEnabled
  }

  const handleOnClick = async () => {
    const pcMaterialsIds = selectedCases
      .map(selectedCase => selectedCase.pcMaterial?._id)
      .filter(Boolean) as string[]

    await generatePrescriptions(pcMaterialsIds, isCancellation, [prescriptionToRefundId!])
    setOpen(false)
    refreshCurrentPage()
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const OpenButton = () => {
    if (compactIcon)
      return (
        <IconButton onClick={handleOpen} disabled={disableButton()}>
          {icon}
        </IconButton>
      )

    return (
      <Button
        variant='text'
        sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginInline: '10px' }}
        onClick={handleOpen}
        disabled={disableButton()}
      >
        {trlb(buttonLabel)}
      </Button>
    )
  }

  const TopBar = () => debtorsList.length > 1
    ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <IconButton
          onClick={() => setDebtorIndex(debtorIndex - 1)}
          disabled={debtorIndex === 0}
        >
          <ArrowBackIos />
        </IconButton>
        <Typography id='modal-modal-title' variant='h4' component='h2'>
          {trlb(title)}
        </Typography>
        <IconButton
          onClick={() => setDebtorIndex(debtorIndex + 1)}
          disabled={debtorIndex === debtorsList.length - 1}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>
    )
    : (
      <Typography id='modal-modal-title' variant='h4' component='h2'>
        {trlb(title)}
      </Typography>
    )

  return (
    <>
      <OpenButton />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={{
          position: 'absolute' as 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75vw',
          height: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          py: 2,
          overflowY: 'auto',
        }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <TopBar />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                width: '80%',
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                  alignContent: 'start',
                  gap: 4,
                  flexGrow: 1,
                  width: 1,
                  padding: 4,
                }}
              >
                <PrescriptionsPreviewContainer
                  cases={filteredCases}
                  pcMaterials={filteredPcMaterials}
                  type={type}
                />
              </Paper>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBlockStart: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBlockStart: 2,
                gap: 4,
              }}
            >
              {actionButtonLabel
                ? (
                  <Button
                    variant={'contained'}
                    sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginInline: '10px' }}
                    onClick={handleOnClick}
                  >
                    {trlb(actionButtonLabel)}
                  </Button>
                )
                : null}
              <Button
                variant={'text'}
                sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginInline: '10px' }}
                onClick={handleClose}
              >
                {trlb('prescriptions_generateClose')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default PrescriptionsPreview
