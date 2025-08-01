import {
  Contract,
  ContractStatus,
  IUser,
  Identifier,
  formatContractPayload,
  getQueryParams,
  permissionRequests,
} from '@smambu/lib.constants'
import AddIcon from '@mui/icons-material/Add'
import { DefaultButton, DeleteButton, EditButton, SaveButton } from 'components/Buttons'
import { FormContainer, PageContainer, PageHeader, Space20 } from 'components/Commons'
import { ConfirmCreateContract, ConfirmDeleteContract } from 'components/Popovers'
import { add, differenceInCalendarDays, endOfDay, isAfter, isBefore, isValid, startOfDay } from 'date-fns'
import { useFormik } from 'formik'
import { useDeleteContract, useGetContractById, useGetContracts, useUpdateContract } from 'hooks/contractHooks'
import { useGetDoctors } from 'hooks/userHooks'
import { useGetCheckPermission } from 'hooks/userPermission'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { routes } from 'routes/routes'
import { useAppSelector } from 'store'
import { DRAFT_CONTRACT_ACTION } from 'store/actions'
import { trlb } from 'utilities/translator/translator'
import TabsContainer from './components/TabsContainer'
import { contractValidationSchema } from './data/contractValidation'
import CopyBar from './components/CopyBar'
import StandardDialog from 'components/StandardDialog'
import ItemNotFound from 'pages/ItemNotFound'
import { useGetContractLastCase } from 'hooks/caseshooks'
import ForbiddenPage from 'pages/Forbidden'

const ContractDetailPage = ({ isEdit, isNew }: { isEdit?: boolean; isNew?: boolean }) => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const location = useLocation()
  const params = useParams<{ contractId: string }>()
  const queries = getQueryParams(location.search)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const draftContract = useAppSelector(state => state.draftContract)
  const [doctors, setDoctors] = useState<Record<Identifier, IUser>>({})
  const [contractList, setContractList] = useState<Contract[]>([])
  const [contract, setContract] = useState<Contract>()
  const [value, setValue] = useState<string>(
    routes.caseDetailsTabs.includes(queries.tab) ? queries.tab : routes.caseDetailsTabs[0],
  )
  const [showCreateConfirm, setShowCreateConfirm] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false)
  const [showDenyDelete, setShowDenyDelete] = useState<boolean>(false)

  const getContractById = useGetContractById()
  const updateContract = useUpdateContract()
  const getContracts = useGetContracts()
  const deleteContract = useDeleteContract()
  const getDoctors = useGetDoctors()

  const checkPermission = useGetCheckPermission()
  const canCreateOpStandards = checkPermission(permissionRequests.canCreateOpStandards)
  const canCreateContract = checkPermission(permissionRequests.canCreateContract)
  const canEditContract = checkPermission(permissionRequests.canEditContract, { contract })
  const canDeleteContract = checkPermission(permissionRequests.canDeleteContract, { contract })
  const canViewOpStandards = checkPermission(permissionRequests.canViewOpStandards)

  const lastCase = useGetContractLastCase(params.contractId)

  const [edit, setEdit] = React.useState<boolean>(!!isEdit)

  const saveContract = async (contract: Omit<Contract, 'contractId' | 'tenantId'>) => {
    let formattedData = formatContractPayload(contract)

    updateContract(formattedData as any, edit ? params.contractId : undefined)
  }

  const onSubmit = (contract: Omit<Contract, 'contractId' | 'tenantId'>) => {
    if (
      isNew &&
      lastContract &&
      differenceInCalendarDays(
        add(new Date(lastContract.details.validUntil), { days: 1 }),
        new Date(contract.details.validFrom),
      ) !== 0
    ) {
      setShowCreateConfirm(true)

      return
    }

    const lastCaseExists = lastCase !== null && lastCase !== undefined

    if (!lastCaseExists) {
      saveContract(contract)
      return
    }

    const newContractData = form.values

    const newStartDate = new Date(newContractData.details.validFrom)
    const newEndDate = new Date(newContractData.details.validUntil)
    const lastCaseDate = new Date(lastCase.bookingSection.date)

    const startsAfter = isBefore(lastCaseDate, newStartDate)
    const endsBefore = isAfter(lastCaseDate, newEndDate)
    const caseWillBeOrphan = startsAfter || endsBefore

    if (caseWillBeOrphan) {
      setShowBlockModal(true)
      setRejectReason(startsAfter ? 'contractsStartsLate' : 'contractsEndEarly')

      return
    }

    saveContract(contract)
  }

  const form = useFormik<Omit<Contract, 'contractId' | 'tenantId'>>({
    initialValues:
      isNew && draftContract?.details
        ? { ...draftContract }
        : {
          details: {
            contractName: '',
            doctorId: '',
            kassenzulassung: false,
            validFrom: startOfDay(new Date()),
            validUntil: endOfDay(new Date()),
          },
        },
    validationSchema: contractValidationSchema,
    onSubmit,
  })

  const contractsErrors = useMemo(() => {
    if (!form.values.details?.doctorId || contractList.length === 0) return []
    const validFrom = new Date(form.values.details?.validFrom)
    const validUntil = new Date(form.values.details?.validUntil)

    if (!isValid(validFrom) || !isValid(validUntil) || validFrom.getTime() > validUntil.getTime())
      return []

    const overlappingContracts = contractList.filter(
      contract =>
        contract.contractId !== params.contractId &&
        validFrom.getTime() <= new Date(contract.details.validUntil).getTime() &&
        validUntil.getTime() >= new Date(contract.details.validFrom).getTime(),
    )

    return overlappingContracts.length > 0 ? ['contract_contractsOverlap_error'] : []
  }, [
    contractList,
    form.values.details?.doctorId,
    form.values.details?.validFrom,
    form.values.details?.validUntil,
    params.contractId,
  ])

  const lastContract = useMemo(() => {
    if (contractsErrors.length) return null
    if (contractList.length > 0) {
      contractList
        .sort((a, b) => differenceInCalendarDays(new Date(b.details.validUntil),
          new Date(a.details.validUntil)))

      return contractList
        .find(c => isBefore(new Date(c.details.validUntil),
          new Date(form.values.details.validUntil)))
    }
    return null
  }, [contractList, form?.values?.details?.validUntil, contractsErrors])

  const contractOpStandards = Object.values(form.values.opStandards ?? {})

  useEffect(() => {
    if (isNew) {
      const timeout = setTimeout(() => {
        dispatch({
          type: DRAFT_CONTRACT_ACTION.SET_DRAFT_CONTRACT,
          data: form.values,
        })
      }, 500)
      return () => clearTimeout(timeout)
    } else if (!isNew && draftContract?.details) {
      dispatch({
        type: DRAFT_CONTRACT_ACTION.RESET_DRAFT_CONTRACT,
      })
    }
  }, [dispatch, draftContract?.details, form.values, isNew])

  const pageTitle = () => {
    if (edit) return trlb('edit_contract')
    if (isNew) return trlb('create_new_contract')
    return trlb('contract_details')
  }

  const handleSelectDoctor = (doctor?: IUser) => {
    if (!doctor) return
    form.setFieldValue('details.doctorId', doctor._id)
    form.setFieldValue('associatedDoctor', doctor)
    getContracts({
      status: ContractStatus.All,
      doctorId: doctor._id,
    }).then(res => {
      if (res) setContractList(res.results)
    })
  }

  const handleClickDelete = () => {
    if (params.contractId) {
      setShowConfirmDelete(false)
      deleteContract(params.contractId).then(() => {
        navigate(routes.contractsList)
      })
    }
  }

  useEffect(() => {
    getDoctors().then(res =>
      setDoctors(
        res.reduce(
          (acc: Record<Identifier, IUser>, doctor: IUser) => ({
            ...acc,
            [doctor._id]: doctor,
          }),
          {},
        ),
      ))
  }, [])

  useEffect(() => {
    if (!location.pathname.includes('new') && params?.contractId)
      getContractById(params.contractId)
        .then((res: any) => {
          if (res.error != null) return
          form.setValues(res)
          setContract(res)
          if (res.details?.doctorId)
            getContracts({
              status: ContractStatus.All,
              doctorId: res.details.doctorId,
            }).then(res => {
              if (res) setContractList(res.results)
            })
        })
        .catch(console.error)
    else if (location.pathname.includes('new')) form.validateForm()
  }, [location.pathname, params])

  const handleCreateOpStandard = () => {
    if (isNew) navigate(routes.addNewOPStandard)
    else if (edit) navigate(routes.mapCreateOpStandard(params.contractId!))
  }

  const disableSaveButton = !form.isValid || contractsErrors.length > 0 || isLoading

  const getContent = () => {
    if (isNew && canCreateContract) return <SaveButton type='submit' disabled={disableSaveButton} />
    else if (!isNew && !edit && canEditContract) return <EditButton onClick={() => setEdit(true)} />
    else if (!isNew && edit && canEditContract) return <SaveButton type='submit' disabled={disableSaveButton} />
    else return null
  }

  if (contract == null && !isNew && isLoading) return null
  if (contract == null && !isNew) return <ItemNotFound message={trlb('contract_not_found')} />
  if (isEdit && !canEditContract) return <ForbiddenPage />

  const toggleInfoModal = () => setShowBlockModal(false)

  return (
    <PageContainer>
      <FormContainer onSubmit={form.handleSubmit}>
        <PageHeader pageTitle={pageTitle()}
          onClick={() => navigate(routes.editContract)}
          showBackButton>
          {canDeleteContract && edit && !isNew
            ? (
              <DeleteButton
                onClick={() => {
                  !lastCase ? setShowConfirmDelete(true) : setShowDenyDelete(true)
                }}
              />
            )
            : null}
          {getContent()}
          {canCreateOpStandards && value === routes.caseDetailsTabs[1] && edit
            ? (
              <DefaultButton
                text={trlb('create_new_op_standard')}
                icon={<AddIcon sx={{ marginRight: '10px' }} />}
                onClick={handleCreateOpStandard}
              />
            )
            : null}
        </PageHeader>
        <Space20 />
        <CopyBar {...{ isNew, form, doctors, handleSelectDoctor }} />
        <TabsContainer
          {...{
            value,
            setValue,
            edit,
            isNew: isNew!,
            doctors,
            form,
            lastContract,
            contractOpStandards,
            handleSelectDoctor,
            canViewOpStandards,
            contractsErrors,
          }}
        />
        {showCreateConfirm && (
          <ConfirmCreateContract
            {...{
              showConfirm: showCreateConfirm,
              setShowConfirm: setShowCreateConfirm,
              doctorInfo: form.values.associatedDoctor!,
              onConfirm: () => {
                saveContract(form.values)
              },
              distance: Math.abs(
                differenceInCalendarDays(
                  add(new Date(lastContract?.details?.validUntil!), { days: 1 }),
                  new Date(form.values?.details.validFrom),
                ),
              ),
            }}
          />
        )}
        <StandardDialog
          open={showBlockModal}
          onClose={toggleInfoModal}
          closeKey='closeLabel'
          titleKey={'Warning'}
          textKey={rejectReason}
        />
        {showConfirmDelete && (
          <ConfirmDeleteContract
            {...{
              showConfirm: showConfirmDelete,
              setShowConfirm: setShowConfirmDelete,
              doctorInfo: form.values.associatedDoctor,
              onConfirm: handleClickDelete,
            }}
          />
        )}
        {showDenyDelete && (
          <StandardDialog
            open={showDenyDelete}
            titleKey={'contract_denyDelete_title'}
            textKey={'contract_denyDelete_text'}
            onClose={() => setShowDenyDelete(false)}
          />
        )}
      </FormContainer>
    </PageContainer>
  )
}

export default ContractDetailPage
