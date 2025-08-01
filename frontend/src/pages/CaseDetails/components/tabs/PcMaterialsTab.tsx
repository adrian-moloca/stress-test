import React from 'react'
import { FormikProps } from 'formik'
import { CaseForm, IPcMaterial, IPcMaterialsPosition, pcMaterialsPageSize } from '@smambu/lib.constants'
import { Panel, Space20 } from 'components/Commons'
import { Accordion, AccordionSummary, Box, TextField, Typography } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { trlb } from 'utilities'
import { FlexDataTable } from 'components/FlexCommons'
import { v4 } from 'uuid'
import { useGetPcMaterialByCaseId } from 'hooks/pcMaterialsHooks'

const PcMaterialData = ({
  pcMaterial
}: {
  pcMaterial: IPcMaterial
}) => {
  const statusString = trlb(pcMaterial.cancelled
    ? 'pcMaterials_status_cancelled'
    : `pcMaterials_status_${pcMaterial.status}`)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Typography variant='h6'>{trlb('pcMaterials_prescription_title')}</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <TextField
          label={trlb('pcMaterials_status')}
          disabled
          value={statusString}
          sx={{ flexGrow: 1 }}
        />
      </Box>
    </>
  )
}

const SurgeonData = ({
  surgeon,
}: {
  surgeon: IPcMaterial['debtor']
}) => {
  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6'>{trlb('pcMaterials_surgeon_title')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box
          sx={{
            width: '50%',
            borderRadius: theme => theme.constants.radius,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            label={trlb('patientForm_Title')}
            disabled
            value={surgeon.title}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            label={trlb('patientForm_Name')}
            disabled
            value={surgeon.firstName}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            label={trlb('patientForm_Surname')}
            disabled
            value={surgeon.lastName}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            label={trlb('patientForm_DebtorNumber')}
            disabled
            value={surgeon.debtorNumber}
            sx={{ flexGrow: 1 }}
          />
        </Box>
        <Box
          sx={{
            width: '50%',
            borderRadius: theme => theme.constants.radius,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            label={trlb('addressForm_Street')}
            disabled
            value={surgeon.street}
            sx={{ flex: '1 1 60%' }}
          />
          <TextField
            label={trlb('addressForm_HouseNumber')}
            disabled
            value={surgeon.houseNumber}
            sx={{ flex: '1 1 30%' }}
          />
          <TextField
            label={trlb('addressForm_PostalCode')}
            disabled
            value={surgeon.postalCode}
            sx={{ flex: '1 1 30%' }}
          />
          <TextField
            label={trlb('addressForm_City')}
            disabled
            value={surgeon.city}
            sx={{ flex: '1 1 30%' }}
          />
          <TextField
            label={trlb('addressForm_Country')}
            disabled
            value={surgeon.country}
            sx={{ flex: '1 1 30%' }}
          />
        </Box>
      </Box>
    </>
  )
}

const PositionsTable = ({ positions }: { positions: IPcMaterialsPosition[] }) => {
  const columns = [
    {
      field: 'articleNumber',
      headerName: trlb('pcMaterials_positions_articleNumber'),
      flex: 1,
      sortable: false,
      filterable: false,
    },
    {
      field: 'itemName',
      headerName: trlb('pcMaterials_positions_itemDescription'),
      flex: 1,
      sortable: false,
      filterable: false,
    },
    {
      field: 'amount',
      headerName: trlb('pcMaterials_positions_amount'),
      flex: 1,
      sortable: false,
      filterable: false,
    },
  ]

  const rows = positions.map(position => ({
    id: v4(),
    articleNumber: position.materialId ?? '-',
    itemName: position.description,
    price: position.price,
    amount: position.amount,
  }))

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingY: '20px',
        }}
      >
        <Typography variant='h6'>{trlb('pcMaterials_positions_title')}</Typography>
      </Box>
      <FlexDataTable rows={rows}
        columns={columns}
        getRowId={(row: any) => row.id}
        pageSize={pcMaterialsPageSize}
        autoHeight
      />
    </>
  )
}

const PcMaterialsTab = ({
  form,
}:{
  form: FormikProps<CaseForm>,
}) => {
  const caseId = form.values.caseId

  // TODO UR: maybe move this to parent and don't show the tab if no data?
  const { pcMaterial } = useGetPcMaterialByCaseId(caseId)

  if (pcMaterial == null) return null

  return (
    <Panel>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls='panel1a-content'
          id='panel1a-header'
        >
          <Typography>{trlb('pcMaterials_title')}</Typography>
        </AccordionSummary>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <PcMaterialData pcMaterial={pcMaterial} />
            <Space20 />
            <SurgeonData surgeon={pcMaterial.debtor} />
            <Space20 />
            <PositionsTable positions={pcMaterial.positions} />
            <Space20 />
          </Box>
        </Box>
      </Accordion>
    </Panel>
  )
}

export default PcMaterialsTab
