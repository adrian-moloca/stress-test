import React, { useEffect, useState } from 'react'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { trlb } from 'utilities'
import {
  ILimitedCase,
  IPcMaterial,
  ISammelCheckpoint,
  MEDICALS_SAMMEL_CODE,
  PHARMACY_SAMMEL_CODE,
  formatDebtorName,
  needsSammelInvoice,
} from '@smambu/lib.constants'
import { useGetCheckpointPreview } from 'hooks/pcMaterialsHooks'
import PcMaterialsPreviewElement from './PcMaterialsPreviewElement'
import { tReceiptPreviewType } from './PrescriptionsPreview'

const sammelCategories = [MEDICALS_SAMMEL_CODE, PHARMACY_SAMMEL_CODE]

interface IReceiptsPreviewContainerProps {
  cases: ILimitedCase[]
  type: tReceiptPreviewType
  pcMaterials: IPcMaterial[]
}

const ReceiptsPreviewContainer: React.FC<IReceiptsPreviewContainerProps> = ({
  cases,
  pcMaterials,
  type,
}) => {
  const getCheckpointPreview = useGetCheckpointPreview()
  const [sammelCategory, setSammelCategory] = useState(MEDICALS_SAMMEL_CODE)
  const [newCheckpoint, setNewCheckpoint] = useState<ISammelCheckpoint>({} as ISammelCheckpoint)
  const [sammelWarning, setSammelWarning] = useState<string>('')
  const isCancellation = type === 'cancel'

  const firstCase = cases[0]
  const doctorId = firstCase?.bookingSection.doctorId
  const caseId = firstCase?.caseId

  useEffect(() => {
    const getCheckpointPreviewData = async () => {
      const checkpoint = await getCheckpointPreview({
        isCancellation,
        caseId,
        doctorId,
      })
      // The BE return an empty string even if the checkpoint is null on the BE side
      if (checkpoint === '') return
      setNewCheckpoint(checkpoint)

      const isCreated = needsSammelInvoice(checkpoint)

      const warning = isCreated ? 'sammelArticlesPrescriptions' : 'sammelArticlesNoPrescriptions'

      setSammelWarning(warning)
    }

    if (doctorId != null && caseId != null)
      getCheckpointPreviewData()
    else
      setNewCheckpoint({} as ISammelCheckpoint)
  }, [doctorId, caseId, isCancellation])

  if (!(pcMaterials.length > 0 && cases.length > 0)) return null

  const debtor = pcMaterials[0].debtor

  const filterSammelArticles = (_event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
    newAlignment && setSammelCategory(newAlignment)
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignContent: 'start', width: 1 }}>
        <Typography sx={{ mr: 1, fontWeight: 'bold' }}>
          {trlb('prescriptions_surgeon')}
        </Typography>
        <Typography>{formatDebtorName(debtor)}</Typography>
      </Box>
      <ToggleButtonGroup color='primary' value={sammelCategory} exclusive onChange={filterSammelArticles}>
        {sammelCategories.map(category => (
          <ToggleButton key={category} value={category}>
            {trlb(`billPreview${category}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          alignContent: 'start',
          gap: 4,
          flexGrow: 1,
          width: 1,
        }}
      >
        <PcMaterialsPreviewElement
          pcMaterials={pcMaterials}
          cases={cases}
          selectedCategory={sammelCategory}
          checkpoint={newCheckpoint}
        />
      </Box>
      {type !== 'show'
        ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignContent: 'start', width: 1 }}>
            <Typography>
              <strong>{trlb(sammelWarning)}</strong>
            </Typography>
          </Box>
        )
        : null}
    </>
  )
}

export default ReceiptsPreviewContainer
