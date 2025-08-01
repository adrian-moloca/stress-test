import { Box, Card, Grid, Tab, Tabs, Typography } from '@mui/material'
import React, { SyntheticEvent } from 'react'
import { EditButton, SaveButton } from 'components/Buttons'
import { GridAutocomplete, PageContainer, PageHeader, Panel, SectionTitle, Space20 } from 'components/Commons'
import { routes } from 'routes/routes'
import { CheckCircle } from '@mui/icons-material'
import { trlb } from 'utilities/translator/translator'
import { useNavigate } from 'react-router'
import { OPStandardDetails } from './OPStandardDetails'
import {
  useCreateAnesthesiologistOpStandard,
  useCreateNewVersionAnesthesiologistOpStandard,
  useGetAnesthesiologistOPStandardNearVersions,
  useGetAnesthesiologistOPStandards,
  useUpdateAnesthesiologistOpStandard,
} from 'hooks'
import { FormikProps } from 'formik'
import {
  AnesthesiologistOpStandard,
  AnesthesiologistOpStandardProcess,
} from '@smambu/lib.constants'
import { InterOperativeMeasures } from './InteroperativeMeasures'
import { Positions } from './Positions'
import { OPStandardAnesthesiologicalServices } from './OPStandardAnesthesiologicalServices'
import { PreExistingConditions } from './PreExistingConditions'
import { OPStandardMaterial } from './OpStandardMaterial'
import DeleteAnesthestiologistOpStandard from './DeleteAnesthestiologistOpStandard'
import VersionBar from './VersionBar'
import CreateNewVersion from './CreateNewVersion'
import { defaultStyles } from 'ThemeProvider'
import { WarningIcon } from 'components/Icons'
import { useAppSelector } from 'store'
import ItemNotFound from 'pages/ItemNotFound'
import { useOpStandardManagementContext } from 'components/materials/OpStandardContext'

enum TabsEnum {
  DETAILS = 'DETAILS',
  PRE_EXISTING_CONDITIONS = 'PRE_EXISTING_CONDITIONS',
  INTEROPERATIVE_MEASURES = 'INTEROPERATIVE_MEASURES',
  MATERIALS = 'MATERIALS',
  MEDICATIONS = 'MEDICATIONS',
  POSITIONS = 'POSITIONS',
  ANESTHESIOLOGICAL_SERVICES = 'ANESTHESIOLOGICAL_SERVICES',
  VENTILATION_MATERIALS = 'VENTILATION_MATERIALS',
}

const TabsFields: {
  [_k in keyof Omit<AnesthesiologistOpStandard, 'anesthesiologistOpStandardId' | 'tenantId'>]: TabsEnum
} = {
  // detail
  name: TabsEnum.DETAILS,
  validFrom: TabsEnum.DETAILS,
  createdBy: TabsEnum.DETAILS,
  positions: TabsEnum.POSITIONS,
  materials: TabsEnum.MATERIALS,
  medications: TabsEnum.MEDICATIONS,
  preExistingConditions: TabsEnum.PRE_EXISTING_CONDITIONS,
  interoperativeMeasure: TabsEnum.INTEROPERATIVE_MEASURES,
  requiredServices: TabsEnum.ANESTHESIOLOGICAL_SERVICES,
  ventilationMaterials: TabsEnum.VENTILATION_MATERIALS,
}

interface PageInfo {
  title: string
  buttons: React.ReactElement
}

const MainPage = ({
  process,
  form,
  edit,
  isNew,
  isLoading,
  anesthesiologistOpStandard,
  nearVersions,
  canEditAnesthesiologistOpStandard,
  anesthesiologistopstandardId,
}: {
  process: AnesthesiologistOpStandardProcess
  form: FormikProps<AnesthesiologistOpStandard>
  edit: boolean
  isNew: boolean
  isLoading: boolean
  anesthesiologistOpStandard?: AnesthesiologistOpStandard
  nearVersions: ReturnType<typeof useGetAnesthesiologistOPStandardNearVersions>
  canEditAnesthesiologistOpStandard: boolean
  anesthesiologistopstandardId?: string
}) => {
  const navigate = useNavigate()
  const [currTab, setCurrTab] = React.useState('Details')
  const [searchText, setSearchText] = React.useState('')
  const createHook = useCreateAnesthesiologistOpStandard()
  const createNewVersionHook = useCreateNewVersionAnesthesiologistOpStandard()
  const updateHook = useUpdateAnesthesiologistOpStandard()
  const user = useAppSelector(state => state.auth.user)
  const { materials } = useOpStandardManagementContext()
  const materialsIds = React.useMemo(() => materials.map(material => material.id), [materials])

  const formInvalid: boolean = React.useMemo(() => {
    return form.errors && Object.keys(form.errors).length > 0
  }, [form.errors])

  const isTabValid = (input: TabsEnum): boolean => {
    const hasErrors = Object.entries(TabsFields)
      .filter(([, value]) => value === input)
      .some(
        ([key]) =>
          !!form.errors?.[key as keyof Omit<AnesthesiologistOpStandard, 'anesthesiologistOpStandardId'>],
      )
    return !hasErrors
  }

  const opStandardSections = [
    {
      title: trlb('anesthesiologistOPStandard_tab_details'),
      component: (
        <OPStandardDetails
          edit={edit}
          form={form}
          values={form.values}
          errors={form.errors}
          touched={form.touched}
        />
      ),
      isValid: isTabValid(TabsEnum.DETAILS),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_materials'),
      component: (
        <OPStandardMaterial
          edit={edit}
          form={form}
          formPath='materials'
        />
      ),
      isValid: isTabValid(TabsEnum.MATERIALS),
      warning: form.values.materials.some(opMaterial =>
        !materialsIds.includes(opMaterial.materialId)),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_medications'),
      component: (
        <OPStandardMaterial
          edit={edit}
          form={form}
          formPath='medications'
        />
      ),
      isValid: isTabValid(TabsEnum.MEDICATIONS),
      warning: form.values.medications.some(opMaterial =>
        !materialsIds.includes(opMaterial.medicationId)),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_ventilation_materials'),
      component: (
        <OPStandardMaterial
          edit={edit}
          form={form}
          formPath='ventilationMaterials'
          addRowText='add_ventilation_material'
          title='case_tab_anesthesia_VentilationMaterials'
        />
      ),
      isValid: isTabValid(TabsEnum.VENTILATION_MATERIALS),
      warning: form.values.ventilationMaterials.some(opMaterial =>
        !materialsIds.includes(opMaterial.materialId)),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_anesthesiological_services'),
      component: (
        <OPStandardAnesthesiologicalServices
          edit={edit}
          form={form}
          values={form.values?.requiredServices}
          name='requiredServices'
          section=''
        />
      ),
      isValid: isTabValid(TabsEnum.ANESTHESIOLOGICAL_SERVICES),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_positions'),
      component: (
        <Positions
          edit={edit}
          form={form}
          values={form.values?.positions}
          errors={form.errors?.positions}
          touched={form.touched?.positions}
        />
      ),
      isValid: isTabValid(TabsEnum.POSITIONS),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_interoperative_measures'),
      component: (
        <InterOperativeMeasures
          edit={edit}
          form={form}
          values={form.values?.interoperativeMeasure}
          section=''
        />
      ),
      isValid: isTabValid(TabsEnum.INTEROPERATIVE_MEASURES),
    },
    {
      title: trlb('anesthesiologistOPStandard_tab_pre_existing_conditions'),
      component: (
        <PreExistingConditions
          edit={edit}
          form={form}
          values={form.values?.preExistingConditions}
        />
      ),
      isValid: isTabValid(TabsEnum.PRE_EXISTING_CONDITIONS),
    },
  ]

  const handleChangeTab = (_event: any, newValue: React.SetStateAction<string>) => {
    setCurrTab(newValue)
  }

  const OPStandardsList = useGetAnesthesiologistOPStandards('', 1, 1000, 'name', 'desc')
  const getValuesFromExistingAnOpStandard = (input: AnesthesiologistOpStandard['anesthesiologistOpStandardId']) => {
    const item = OPStandardsList?.results.find(item => item.anesthesiologistOpStandardId === input)
    if (item) {
      form.resetForm()
      form.setValues({
        ...item,
        createdBy: user.id,
        anesthesiologistOpStandardId: '',
      })
    }
  }

  const pageInfo: PageInfo = React.useMemo(() => {
    const info: { [_key in AnesthesiologistOpStandardProcess]: PageInfo } = {
      [AnesthesiologistOpStandardProcess.VIEW]: {
        title: trlb('op_standard_details'),
        buttons: (
          <>
            {canEditAnesthesiologistOpStandard && (
              <EditButton
                onClick={() => {
                  anesthesiologistopstandardId &&
                  navigate(routes
                    .mapAnesthesiologistOPStandardEdit(anesthesiologistopstandardId), {
                    replace: true,
                  })
                }}
              />
            )}
            <CreateNewVersion
              anesthesiologistOpStandard={anesthesiologistOpStandard}
              isLastVersion={!nearVersions?.nextVersion}
            />
          </>
        ),
      },
      [AnesthesiologistOpStandardProcess.EDIT]: {
        title: trlb('edit_op_standard'),
        buttons: (
          <>
            <DeleteAnesthestiologistOpStandard anesthesiologistOpStandard={form.values} />
            <SaveButton
              disabled={formInvalid || isLoading}
              setEdit={() => { }}
              onClick={() => {
                updateHook(form.values.anesthesiologistOpStandardId, form.values)
              }}
            />
          </>
        ),
      },
      [AnesthesiologistOpStandardProcess.CREATE]: {
        title: trlb('create_op_standard'),
        buttons: (
          <>
            <SaveButton
              disabled={formInvalid || isLoading}
              onClick={() => {
                createHook(form.values)
              }}
            />
          </>
        ),
      },
      [AnesthesiologistOpStandardProcess.NEW_VERSION]: {
        title: trlb('create_op_standard'),
        buttons: (
          <>
            <SaveButton
              disabled={formInvalid || isLoading}
              onClick={() => {
                anesthesiologistopstandardId &&
                  createNewVersionHook(form.values, anesthesiologistopstandardId)
              }}
            />
          </>
        ),
      },
    }
    return info[process]
  }, [
    process,
    isLoading,
    formInvalid,
    form.values,
    canEditAnesthesiologistOpStandard,
    nearVersions,
    anesthesiologistOpStandard
  ])

  const getTabs = (tab: {
    title: string; component: React.ReactElement; isValid: boolean; warning?: boolean
  }) => {
    return (
      <Tab
        value={tab.title}
        key={tab.title}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
            {trlb(tab.title)}
            {tab.isValid && !tab.warning
              ? <CheckCircle sx={{ fill: theme => theme.palette.primary.main }} />
              : <WarningIcon variant={!tab.isValid ? 'error' : 'warning'} />}
          </Box>
        }
        sx={{ fontWeight: '600', alignItems: 'flex-start' }}
      />
    )
  }

  if (anesthesiologistOpStandard == null && !isNew && isLoading) return null
  if (anesthesiologistOpStandard == null && !isNew)
    return <ItemNotFound message={trlb('anesthesiologistOpStandard_not_found')} />

  return (
    <PageContainer>
      <PageHeader pageTitle={pageInfo.title} showBackButton>
        {pageInfo.buttons}
      </PageHeader>
      <Space20 />
      {process === AnesthesiologistOpStandardProcess.CREATE
        ? (
          <Panel>
            <SectionTitle text={trlb('duplicate_op_standard')} />
            <Grid container spacing={2}>
              <GridAutocomplete
                xs={12}
                label={trlb('op_standard_name')}
                options={(OPStandardsList?.results || []).map(el => ({
                  value: el.anesthesiologistOpStandardId,
                  label: el.name,
                }))}
                value=''
                onSelectValue={(_e: SyntheticEvent<Element, Event>,
                  value: { label: string; value: string }) => {
                  if (value)
                    getValuesFromExistingAnOpStandard(
                      value.value as AnesthesiologistOpStandard['anesthesiologistOpStandardId'],
                    )
                }}
                selected={searchText}
                name={''}
                onChange={e => setSearchText(e.target.value)}
              />
            </Grid>

            <Space20 />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant='subtitle1' sx={{ textAlign: 'center' }}>
                {trlb('orFill_in_the_fields')}
              </Typography>
            </Box>
          </Panel>
        )
        : null}
      <VersionBar
        edit={edit}
        isNew={isNew}
        anesthesiologistOpStandard={anesthesiologistOpStandard}
        nearVersions={nearVersions}
      />
      <Space20 />
      <SectionTitle text={trlb('op_standard_info')} />
      <Card sx={{ display: 'flex' }}>
        <Tabs
          value={currTab}
          onChange={handleChangeTab}
          textColor='primary'
          indicatorColor='primary'
          orientation='vertical'
          sx={{ flexShrink: 0, ...defaultStyles.VerticalTabsSx }}
        >
          {opStandardSections.map(getTabs)}
        </Tabs>
        <Box sx={{ flexGrow: 1, p: 1 }}>
          {opStandardSections
            .filter(tab => tab.title === currTab)
            .map(tab => {
              return (
                <Box
                  role='tabpanel'
                  hidden={currTab !== tab.title}
                  sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexGrow: 1 }}
                  key={tab.title}
                >
                  {tab.component}
                </Box>
              )
            })}
        </Box>
      </Card>
      <Space20 />
    </PageContainer>
  )
}

export default MainPage
