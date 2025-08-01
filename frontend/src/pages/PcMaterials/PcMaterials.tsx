import { Box, Button } from '@mui/material'
import { permissionRequests } from '@smambu/lib.constants'
import { PageContainer, PageHeader, Space10 } from 'components/Commons'
import { useGetCheckPermission } from 'hooks/userPermission'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { routes } from 'routes/routes'
import { trlb } from 'utilities'
import PrescribableMaterialsTab from './tabs/PrescribableMaterialsTab'
import CasesTab from './tabs/CasesTab'
import PrescriptiontsTab from './tabs/PrescriptionsTab'

export const PC_MATERIALS_TABS_IDS = {
  CASES: 'cases',
  PRESCRIPTIONTS: 'prescriptions',
  PRESCRIBABLE_MATERIALS: 'prescribableMaterials',
}

const PcMaterials = () => {
  const navigate = useNavigate()
  const { tab } = useParams()
  const checkPermission = useGetCheckPermission()
  const canViewPrescribableMaterials =
    checkPermission(permissionRequests.canViewPrescribableMaterials)
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)

  const tabs = [
    {
      id: PC_MATERIALS_TABS_IDS.CASES,
      permission: canViewPcMaterials,
      component: CasesTab,
    },
    {
      id: PC_MATERIALS_TABS_IDS.PRESCRIPTIONTS,
      permission: canViewPcMaterials,
      component: PrescriptiontsTab,
    },
    {
      id: PC_MATERIALS_TABS_IDS.PRESCRIBABLE_MATERIALS,
      permission: canViewPrescribableMaterials && canViewMaterialsDatabase,
      component: PrescribableMaterialsTab,
    },
  ]

  const activeTab = tabs.find(({ id }) => id === tab)

  return (
    <PageContainer sx={{ flex: 1 }}>
      <PageHeader pageTitle={trlb('pcMaterials_title')} />
      <Space10 />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {tabs
          .filter(({ permission }) => permission)
          .map(({ id }) => {
            const onClick = () => navigate(routes.mapPcMaterials(id))
            return (
              <Button
                key={id}
                variant={tab === id ? 'contained' : 'text'}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                onClick={onClick}
              >
                {trlb(`pcMaterials_tab_${id}`)}
              </Button>
            )
          })}
      </Box>
      <Space10 />
      {activeTab?.permission && activeTab?.component && <activeTab.component />}
    </PageContainer>
  )
}

export default PcMaterials
