import {
  EPrescriptionStatus,
  IHydratedPrescription,
  IPcMaterial,
  dateString,
  getFullName,
  permissionRequests,
} from '@smambu/lib.constants'
import { trlb } from 'utilities'
import { format } from 'date-fns'
import { GridRenderCellParams } from '@mui/x-data-grid'
import PrescriptionsPreview from './PrescriptionsPreview'
import React from 'react'
import PrescribedButton from './PrescribedButton'
import { Box, CircularProgress } from '@mui/material'

export interface IPrescriptionRow {
  row: IHydratedPrescription
}

export const getColumns = ({
  refreshCurrentPage
}: {
  refreshCurrentPage: () => void
}) => [
  {
    index: 1,
    field: 'elaborationInProgress',
    headerName: '',
    translated: true,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    width: 50,
    type: 'special',
    sortable: false,
    filterable: false,
    disableExport: true,
    renderCell: ({ row: prescription }: GridRenderCellParams) => {
      if (prescription.status === EPrescriptionStatus.CANCELLED) return null

      const elaborationInProgress =
        prescription.pcMaterials.some((pcMaterial: IPcMaterial) => pcMaterial.elaborationInProgress)
      return elaborationInProgress === true
        ? (
          <Box>
            <CircularProgress size={20} />
          </Box>
        )
        : ''
    },
  },
  {
    index: 2,
    field: 'prescriptionNumber',
    headerName: trlb('prescriptions_prescriptionNumber'),
    width: 250,
    filterable: false,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    valueGetter: ({ row: prescription }: IPrescriptionRow) => prescription.prescriptionNumber,
    type: 'string',
  },
  {
    index: 3,
    field: 'generatedAt',
    headerName: trlb('prescriptions_date'),
    width: 150,
    filterable: false,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    valueGetter: ({ row: prescription }: IPrescriptionRow) =>
      format(new Date(prescription.createdAt), dateString),
    type: 'date',
  },
  {
    index: 9,
    field: 'status',
    headerName: trlb('prescriptions_status'),
    width: 150,
    filterable: false,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    valueGetter: ({ row: prescription }: IPrescriptionRow) => trlb(prescription.status),
    type: 'string',
  },
  {
    index: 10,
    field: 'cases',
    headerName: trlb('prescriptions_cases'),
    width: 150,
    sortable: false,
    filterable: false,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    valueGetter: ({ row: prescription }: IPrescriptionRow) => prescription.cases.map(caseItem => caseItem.caseNumber).join(','),
    type: 'string',
  },
  {
    index: 11,
    field: 'doctor',
    headerName: trlb('prescriptions_doctor'),
    width: 150,
    sortable: false,
    filterable: false,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    valueGetter: ({ row: prescription }: IPrescriptionRow) => {
      const surgeons = new Set()

      prescription.cases.forEach(caseItem => {
        const doctor = caseItem.associatedDoctor

        surgeons.add(getFullName(doctor, true))
      })

      return [...surgeons].join(',')
    },
    type: 'string',
  },
  {
    index: 12,
    field: 'prescribedButton',
    headerName: '',
    width: 150,
    sortable: false,
    filterable: false,
    disableExport: true,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    renderCell: (params: GridRenderCellParams) => {
      return (
        <PrescribedButton
          prescription={params.row}
          refreshCurrentPage={refreshCurrentPage}
        />
      )
    },
    type: 'special',
  },
  {
    index: 13,
    field: 'cancelPrescription',
    headerName: '',
    width: 50,
    sortable: false,
    filterable: false,
    disableExport: true,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    renderCell: (params: GridRenderCellParams) => {
      const prescription = params.row
      if (prescription.status === EPrescriptionStatus.CANCELLED) return null

      return (
        <PrescriptionsPreview
          selectedCases={prescription.cases}
          type='cancel'
          compactIcon
          prescriptionToRefundId={prescription._id}
          refreshCurrentPage={refreshCurrentPage}
        />
      )
    },
    type: 'special',
  },
  {
    index: 14,
    field: 'showPrescription',
    headerName: '',
    width: 50,
    sortable: false,
    filterable: false,
    disableExport: true,
    vPermission: permissionRequests.canViewPcMaterials,
    oPermission: permissionRequests.canViewPcMaterials,
    renderCell: (params: GridRenderCellParams) => {
      const prescription = params.row

      return (
        <PrescriptionsPreview
          selectedCases={prescription.cases}
          type='show'
          compactIcon
          prescriptionToRefundId={prescription._id}
          refreshCurrentPage={refreshCurrentPage}
        />
      )
    },
    type: 'special',
  },
]
