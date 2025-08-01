import { OpStandard, permissionRequests } from '@smambu/lib.constants'
import { Box, Button, Card, Tab, Tabs, TextField } from '@mui/material'
import { EditButton, SaveButton } from 'components/Buttons'
import {
  FormContainer,
  PageContainer,
  PageHeader,
  Panel,
  SectionSubtitle,
  SectionTitle,
  Space20,
} from 'components/Commons'
import { useFormik } from 'formik'
import {
  useCreateOpStandard,
  useGetContractById,
  useGetOpStandardById,
  useUpdateOpStandard,
  useUpdateOpstandardChangeRequest,
} from 'hooks/contractHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React, { SyntheticEvent, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { routes } from 'routes/routes'
import { useAppSelector } from 'store'
import { DRAFT_CONTRACT_ACTION } from 'store/actions'
import { trlb } from 'utilities'
import BookingSection from './components/BookingSection'
import DetailsSection from './components/DetailsSection'
import DuplicatePanel from './components/DuplicatePanel'
import IntraOpSection from './components/IntraOpSection'
import { OpStandardManagementProvider } from 'components/materials/OpStandardContext'
import PostOpSection from './components/PostOpSection'
import PreOpSection from './components/PreOpSection'
import { opStandardInitialValues } from './data/initalValues'
import { opStandardValidationSchema } from './data/opStandardValidation'
import DeleteOpStandard from './components/DeleteOpStandard'
import ForbiddenPage from 'pages/Forbidden'
import { CheckCircle } from '@mui/icons-material'
import { defaultStyles } from 'ThemeProvider'
import { WarningIcon } from 'components/Icons'
import ItemNotFound from 'pages/ItemNotFound'
import { useGetOpstandardUtilization } from 'hooks/caseshooks'

const OPStandardManagementPage = ({ isNew, isEdit }: { isNew?: boolean; isEdit?: boolean }) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { opStandardId, contractId } = useParams()
  const draftContract = useAppSelector(state => state.draftContract)
  const contracts = useAppSelector(state => state.contracts)
  const contract = contracts?.[contractId!]
  const opStandard = contract?.opStandards?.[opStandardId!]
  const pathName = location.pathname
  const [tab, setTab] = useState<string>('details')
  const [edit, setEdit] = useState<boolean>(Boolean(isNew || isEdit))
  const [selectedOpStandard, setSelectedOpStandard] = useState<Omit<OpStandard, 'opStandardId'>>()

  const comesFromEdit = location.state?.fromEdit

  const opstandardUses = useGetOpstandardUtilization(opStandardId)

  const createOpStandard = useCreateOpStandard()
  const updateOpStandard = useUpdateOpStandard()
  const getOpStandardById = useGetOpStandardById()
  const updateOpstandardChangeRequest = useUpdateOpstandardChangeRequest()

  const checkPermission = useGetCheckPermission()
  const canViewContracts = checkPermission(permissionRequests.canViewContracts)
  const canViewOpStandard =
    contractId === 'undefined' || checkPermission(permissionRequests.canViewOpStandard, { contract })
  const canEditOpStandards = checkPermission(permissionRequests.canEditOpStandards)
  const canEditOpStandard =
    canEditOpStandards &&
    (contractId === 'undefined' || checkPermission(permissionRequests.canEditOpStandard, { contract }))
  const canRequestChangeOpStandard =
    !isNew && checkPermission(permissionRequests.canRequestChangeOpStandard, { contract })

  const getContractById = useGetContractById()

  const [canSendRequest, setCanSendRequest] = useState<boolean>(false)
  const doctorId = !contractId ? draftContract?.details?.doctorId : contract?.details?.doctorId

  const changeSelectedOpStandard = (opStandard?: OpStandard) => {
    if (opStandard) {
      setSelectedOpStandard(opStandard)
      form.setValues(opStandard)
    } else {
      setSelectedOpStandard(undefined)
      form.resetForm()
    }
  }

  useEffect(() => {
    if (canViewContracts && !contract && contractId) getContractById(contractId)
  }, [canViewContracts])

  useEffect(() => {
    if (opStandardId)
      getOpStandardById(opStandardId).then(res => {
        if (res) changeSelectedOpStandard(res)
      })
  }, [opStandardId])

  const onSubmit = async (opStandard: Omit<OpStandard, 'opStandardId' | 'tenantId'>) => {
    const backUrl = comesFromEdit ? `/contracts/${contractId}/edit` : `/contracts/${contractId}`
    try {
      if (edit && opStandardId) {
        const updatedResponse = await updateOpStandard(opStandard, opStandardId, contractId ?? '')

        if (!updatedResponse.error) navigate(backUrl)
      } else if (isNew) {
        const createdResponse = await createOpStandard(opStandard, contractId)

        if (!createdResponse.error)
          if (contractId) {
            navigate(backUrl)
          } else {
            dispatch({
              type: DRAFT_CONTRACT_ACTION.ADD_DRAFT_CONTRACT_OPSTANDARD,
              data: createdResponse,
            })
            navigate(routes.newContract)
          }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const form = useFormik<Omit<OpStandard, 'opStandardId' | 'tenantId'>>({
    initialValues: opStandardInitialValues,
    validationSchema: opStandardValidationSchema,
    onSubmit,
  })

  const opStandardSections = [
    {
      title: 'details',
      component: <DetailsSection {...{ isNew, edit, form, doctorId, contractId }} />,
      isValid: !(
        form.errors.name ||
        form.errors.surgeryDurationInMinutes ||
        form.errors.operatingRoomIds ||
        form.errors.previousContractOpStandardId
      ),
    },
    {
      title: 'booking',
      component: <BookingSection {...{ isNew, edit, form }} />,
      isValid: !form.errors.bookingSection,
    },
    {
      title: 'pre-op',
      component: <PreOpSection {...{ isNew, edit, form }} formPath={'preOpSection.'} />,
      isValid: !form.errors.preOpSection,
    },
    {
      title: 'intra-op',
      component: <IntraOpSection {...{ edit, form }} formPath={'intraOpSection.'} />,
      isValid: !form.errors.intraOpSection,
    },
    {
      title: 'post-op',
      component: <PostOpSection {...{ edit, form }} formPath={'postOpSection.'} />,
      isValid: !form.errors.postOpSection,
    },
  ]

  const handleSave = () => {
    form.handleSubmit()
  }
  const sendChangeRequest = async () => {
    await updateOpstandardChangeRequest(contractId!, opStandardId!, form.values.changeRequest)
    setCanSendRequest(false)
  }

  const handleChangeRequest = async (value: string) => {
    form.setFieldValue('changeRequest', value)
  }

  const handleClickIgnore = async () => {
    form.setFieldValue('changeRequest', '')
    form.handleSubmit()
  }

  const handleChangeCompleted = async () => {
    if (form.isValid) form.setFieldValue('changeRequest', '')
    form.handleSubmit()
  }

  const handleChangeTab = (_event: SyntheticEvent, newValue: string) => {
    setTab(newValue)
  }

  const handleChangeOpStandard = (value: OpStandard) => {
    value.previousContractOpStandardId = ''
    form.setFieldTouched('previousContractOpStandardId')
    changeSelectedOpStandard(value)
  }

  const pageTitle = () => {
    if (pathName === routes.OPStandardDetails ||
      pathName === routes.anesthesiologistOPStandardDetails)
      return trlb('op_standard_details')

    if (pathName === routes.editOPStandard || pathName === routes.editAnesthesiologistOPStandard)
      return trlb('edit_op_standard')

    if (isNew) return trlb('create_op_standard')
  }

  if ((contract &&
    !canViewOpStandard) ||
    (edit && !isNew && !canEditOpStandard))
    return <ForbiddenPage noRedirect />

  if (opStandard == null && !isNew && isLoading) return null
  if (opStandard == null && !isNew) return <ItemNotFound message={trlb('opstandard_not_found')} />

  const saveDisabled = isLoading ||
    Object.keys(form.errors).length ||
     (Object.keys(form.touched).length === 0 &&
      isNew)

  return (
    <OpStandardManagementProvider doctorId={contract?.associatedDoctor?._id}>
      <PageContainer>
        <FormContainer onSubmit={form.handleSubmit}>
          <PageHeader pageTitle={pageTitle()} showBackButton>
            {canRequestChangeOpStandard
              ? (
                <Button variant='contained' onClick={() => setCanSendRequest(true)} disabled={isLoading}>
                  {trlb('request_change')}
                </Button>
              )
              : null}
            <DeleteOpStandard
              isLoading={isLoading}
              opStandardId={opStandardId}
              contract={contract}
              edit={edit}
              opstandardUses={opstandardUses}
            />
            {edit
              ? (
                <SaveButton
                  disabled={saveDisabled}
                  onClick={handleSave}
                />
              )
              : null}
            {!edit && canEditOpStandard
              ? (
                <EditButton
                  onClick={() => {
                    navigate(pathName + '/edit')
                    setEdit(true)
                  }}
                />
              )
              : null}
          </PageHeader>
          <Space20 />
          <DuplicatePanel
            isNew={Boolean(isNew)}
            selectedOpStandard={selectedOpStandard}
            handleChangeOpStandard={handleChangeOpStandard}
          />
          {!isNew
            ? (
              <>
                <Panel>
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                    <SectionSubtitle text={trlb('change_requests')} />
                    <TextField
                      sx={{ width: '100%' }}
                      label={trlb('change_requests')}
                      variant='outlined'
                      multiline
                      rows={4}
                      value={form.values.changeRequest}
                      onChange={e => handleChangeRequest(e.target.value)}
                      inputProps={{ readOnly: !canSendRequest }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {canSendRequest
                        ? (
                          <Button variant={'contained'} sx={{ marginRight: 2 }} onClick={sendChangeRequest}>
                            {trlb('op_standard_send_request')}
                          </Button>
                        )
                        : null}
                      {canEditOpStandard && edit && opStandard?.changeRequest && (
                        <>
                          <Button variant={'contained'} sx={{ marginRight: 2 }} onClick={handleClickIgnore}>
                            {trlb('op_standard_ignore')}
                          </Button>
                          <Button variant={'contained'} onClick={handleChangeCompleted}>
                            {trlb('op_standard_change_completed')}
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Panel>
              </>
            )
            : null}
          <Space20 />
          <SectionTitle text={trlb('op_standard_info')} />
          <Card sx={{ display: 'flex', justifyContent: 'center', gap: 2, width: '100%', p: 2 }}>
            <Tabs
              variant='scrollable'
              scrollButtons='auto'
              value={tab}
              onChange={handleChangeTab}
              textColor='primary'
              indicatorColor='primary'
              orientation='vertical'
              sx={{ flexShrink: 0, ...defaultStyles.VerticalTabsSx }}
            >
              {opStandardSections.map(tab => (
                <Tab
                  key={tab.title}
                  value={tab.title}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.isValid
                        ? (
                          <CheckCircle sx={{ fill: theme => theme.palette.primary.main }} />
                        )
                        : (
                          <WarningIcon />
                        )}
                      {trlb(tab.title)}
                    </Box>
                  }
                  sx={{ fontWeight: '600', p: 0, mr: 2, width: 'fit-content' }}
                />
              ))}
            </Tabs>
            <Box sx={{ flexGrow: 1 }}>
              {opStandardSections
                .filter(_tab => _tab.title === tab)
                .map(_tab => (
                  <Box role='tabpanel' hidden={tab !== _tab.title} sx={{ mt: 2 }} key={_tab.title}>
                    {_tab.component}
                  </Box>
                ))}
            </Box>
          </Card>
          <Space20 />
        </FormContainer>
      </PageContainer>
    </OpStandardManagementProvider>
  )
}

export default OPStandardManagementPage
