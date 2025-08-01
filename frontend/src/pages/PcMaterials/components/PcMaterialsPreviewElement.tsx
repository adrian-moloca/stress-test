import {
  ILimitedCase,
  IPcMaterial,
  ISammelCheckpoint,
  ISammelPosition,
  MEDICALS_SAMMEL_CODE,
  PHARMACY_SAMMEL_CODE,
  dateString,
  permissionRequests,
} from '@smambu/lib.constants'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'
import { trlb } from 'utilities'
import { format } from 'date-fns'
import { useGetCheckPermission } from 'hooks/userPermission'
import ExportButton from 'components/ExportButton'

interface IPcMaterialsPreviewElementProps {
  cases: ILimitedCase[]
  pcMaterials: IPcMaterial[]
  selectedCategory: string
  checkpoint?: ISammelCheckpoint
}

const PcMaterialsPreviewElement: React.FC<IPcMaterialsPreviewElementProps> = ({
  cases,
  pcMaterials,
  selectedCategory,
  checkpoint,
}) => {
  const doctorId = cases[0].bookingSection.doctorId
  const checkPermission = useGetCheckPermission()
  const canExportPcMaterials = checkPermission(permissionRequests.canExportPcMaterials, {
    caseItem: { bookingSection: { doctorId } },
  })

  const getTable = () => {
    const sammelPositions = pcMaterials.reduce((acc: ISammelPosition[], pcMaterial) => {
      for (const position of pcMaterial.positions)
        if (acc.find(p => p.itemCode === (position as ISammelPosition).itemCode)) continue
        else acc.push(position as ISammelPosition)

      return acc
    }, [])

    const hasAnyOfCategory =
        (selectedCategory === MEDICALS_SAMMEL_CODE &&
          sammelPositions.find(position => position.sammelCategory === selectedCategory)) ||
        (selectedCategory !== MEDICALS_SAMMEL_CODE &&
          sammelPositions.find(position => position.sammelCategory !== MEDICALS_SAMMEL_CODE))

    if (hasAnyOfCategory == null) return <Typography>{trlb('noSammelArticlesForSelectedCategory')}</Typography>

    if (checkpoint?.createdAt == null) return null

    const consumptionsMap: Record<string, number | undefined> = {}

    sammelPositions.forEach(current => {
      const checkpointRow = checkpoint.consumptions.find(c => c.itemCode === current.itemCode)

      return (consumptionsMap[current.itemCode] = checkpointRow?.billingAmount ?? 0)
    })

    const selectedPositions = sammelPositions.filter(item => {
      const isNeeded =
          selectedCategory === MEDICALS_SAMMEL_CODE
            ? item.sammelCategory === MEDICALS_SAMMEL_CODE
            : item.sammelCategory !== MEDICALS_SAMMEL_CODE

      const billingAmount = consumptionsMap[item.itemCode] ?? 0

      return isNeeded && billingAmount > 0
    })

    const getTable = () => {
      if (selectedCategory === MEDICALS_SAMMEL_CODE) return getMedicalsTable()
      if (selectedCategory === PHARMACY_SAMMEL_CODE) return getPharmacyTable()
    }

    const getMedicalsTable = () => {
      if (selectedPositions.length === 0) return <Typography>{trlb('noSammelArticlesForSelectedCategory')}</Typography>

      const rowsDefinitions:
      { label: string, getValue: (current: ISammelPosition) => string | undefined | number }[] =
        [
          { label: 'billPreviewPositionsDate', getValue: current => format(new Date(current.date), dateString) },
          { label: 'billPreviewPositionsArticlenumber', getValue: current => current.supplierNumber },
          { label: 'billPreviewPositionsDescription', getValue: current => current.description },
          { label: 'billPreviewPositionsAmount', getValue: current => consumptionsMap[current.itemCode] },
          { label: 'billPreviewPositionsUnit', getValue: current => current.unitOfMeasure },
          { label: 'billPreviewPositionsFaktor', getValue: current => current.sammelFactor },
          { label: 'billPreviewPositionsPZN', getValue: current => current.pzn },
        ]

      const getData = () => {
        return [
          rowsDefinitions.map(({ label }) => trlb(label)),
          ...selectedPositions
            .map(current => rowsDefinitions.map(({ getValue }) => getValue(current))),
        ]
      }

      return (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size='small' aria-label='a dense table'>
            {canExportPcMaterials && (
              <TableHead>
                <TableCell sx={{ display: 'flex', gap: 1 }}>
                  <ExportButton getData={getData} title='sammel_positions' noXLSX noClipboard />
                  <ExportButton getData={getData} title='sammel_positions' noXLSX noCSV />
                </TableCell>
              </TableHead>
            )}
            <TableHead>
              <TableRow>
                {rowsDefinitions.map(({ label }) => (
                  <TableCell key={label} align='left'>{trlb(label)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedPositions.map((current, idx) => (
                <TableRow key={`position_${idx}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {rowsDefinitions.map(({ label, getValue }) => (
                    <TableCell key={label} align='left'>{getValue(current)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    const getPharmacyTable = () => {
      if (selectedPositions.length === 0) return <Typography>{trlb('noSammelArticlesForSelectedCategory')}</Typography>

      const rowsDefinitions:
      { label: string, getValue: (current: ISammelPosition) => string | undefined | number }[] =
        [
          { label: 'billPreviewPositionsDate', getValue: current => format(new Date(current.date), dateString) },
          { label: 'billPreviewPositionsSupplier', getValue: current => current.supplier },
          { label: 'billPreviewPositionsDescription', getValue: current => current.description },
          { label: 'billPreviewPositionsAmount', getValue: current => consumptionsMap[current.itemCode] },
          { label: 'billPreviewPositionsUnit', getValue: current => current.unitOfMeasure },
          { label: 'billPreviewPositionsFaktor', getValue: current => current.sammelFactor },
          { label: 'billPreviewPositionsPZN', getValue: current => current.pzn },
        ]

      const getData = () => {
        return [
          rowsDefinitions.map(({ label }) => trlb(label)),
          ...selectedPositions
            .map(current => rowsDefinitions.map(({ getValue }) => getValue(current))),
        ]
      }

      return (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size='small' aria-label='a dense table'>
            {canExportPcMaterials && (
              <TableHead>
                <TableCell sx={{ display: 'flex', gap: 1 }}>
                  <ExportButton getData={getData} title='sammel_positions' noXLSX noClipboard />
                  <ExportButton getData={getData} title='sammel_positions' noXLSX noCSV />
                </TableCell>
              </TableHead>
            )}
            <TableHead>
              <TableRow>
                {rowsDefinitions.map(({ label }) => (
                  <TableCell key={label} align='left'>{trlb(label)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedPositions.map((current, idx) => (
                <TableRow key={`position_${idx}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {rowsDefinitions.map(({ label, getValue }) => (
                    <TableCell key={label} align='left'>{getValue(current)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    return getTable()
  }

  return (
    <>
      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
        <strong>{trlb('billCaseIds')}</strong>
      </Typography>
      {pcMaterials.map((pcMaterial, idx) => {
        const caseItem = cases.find(c => c.caseId === pcMaterial.caseId)
        return (
          <Box
            key={`bill_${idx}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignContent: 'start',
              width: 1,
            }}
          >
            <Typography>{trlb(caseItem!.caseNumber)}</Typography>
          </Box>
        )
      })}
      <Typography>
        <strong>{trlb('sammelPositions')}</strong>
      </Typography>
      {getTable()}
    </>
  )
}

export default PcMaterialsPreviewElement
