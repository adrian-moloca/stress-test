import React, { useEffect, useMemo, useState } from 'react'
import { Box, Grid, IconButton, Toolbar, Typography } from '@mui/material'
import { Space20 } from 'components/Commons'
import { useNavigate, useParams } from 'react-router-dom'
import { trlb } from 'utilities'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EditIcon from '@mui/icons-material/Edit'
import { routes } from 'routes/routes'
import { TextIconButton } from 'components/Buttons'
import AddIcon from '@mui/icons-material/Add'
import { CopyAll } from '@mui/icons-material'
import { Contract, OpStandard, getFullName, permissionRequests } from '@smambu/lib.constants'
import { useGetCheckPermission } from 'hooks/userPermission'
import { FlexDataTable, FlexSearchField } from 'components/FlexCommons'
import { useCopyOpStandards } from 'hooks/contractHooks'
import { useDispatch } from 'react-redux'
import { GLOBAL_ACTION } from 'store/actions'
import { useAppSelector } from 'store'

interface OPStandardTabProps {
  isNew: boolean
  edit: boolean
  form: any
  lastContract?: Contract | null
  contractOpStandards: OpStandard[]
}

export const OPStandardTab: React.FC<OPStandardTabProps> = ({
  isNew,
  edit,
  form,
  lastContract,
  contractOpStandards,
}) => {
  const isLoading = useAppSelector(state => state.global.loading.length)
  const checkPermission = useGetCheckPermission()
  const canCreateOpStandards = checkPermission(permissionRequests.canCreateOpStandards)
  const canViewOpStandards = checkPermission(permissionRequests.canViewOpStandards)
  const canEditOpStandards = checkPermission(permissionRequests.canEditOpStandards)
  const copyOpStandards = useCopyOpStandards()

  const { contractId } = useParams()
  const [selectedContract, setSelectedContract] = useState<Contract>()
  const [searchText, setSearchText] = useState<string>('')

  const navigate = useNavigate()

  const dispatch = useDispatch()

  useEffect(() => {
    setSelectedContract(form.values)
  }, [form])

  const tableData = useMemo(() => {
    return contractOpStandards.map((opStandard: OpStandard) => {
      return {
        id: opStandard.opStandardId,
        opStandardId: opStandard.opStandardId,
        name: opStandard.name,
        doctor: getFullName(selectedContract?.associatedDoctor, true),
        changeRequested: opStandard.changeRequest ? trlb('changes_requested') : '',
        action: '',
        canEdit: checkPermission(permissionRequests.canEditOpStandards,
          { contract: selectedContract }),
      }
    })
  }, [contractOpStandards, selectedContract])

  const rows = tableData.filter((row: any) =>
    Object.values(row).some((value: any) => String(value).toString()
      .toLowerCase()
      .includes(searchText)))

  const columns = useMemo(
    () => [
      {
        field: 'opStandardId',
        headerName: trlb('op_standard_id'),
        flex: 1,
      },
      {
        field: 'name',
        headerName: trlb('opStandardsList_name'),
        flex: 1,
      },
      {
        field: 'doctor',
        headerName: trlb('opStandardsList_doctor'),
        flex: 1,
      },
      ...(canEditOpStandards
        ? [
          {
            field: 'changeRequested',
            headerName: trlb('opStandardsList_changeRequested'),
            flex: 1,
            renderCell: (params: any) => {
              if (!params.value || !params.row.canEdit) return null
              return (
                <Typography
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                  }}
                >
                  <WarningAmberIcon sx={{ marginRight: '10px', fill: 'red' }} key={params.row.id} />
                  {trlb('changes_requested')}
                </Typography>
              )
            },
          },
          {
            field: 'edit',
            headerName: '',
            width: 50,
            renderCell: (params: any) => {
              if (!params.row.canEdit) return null
              return (
                <IconButton
                  onClick={event => {
                    event.stopPropagation()
                    if (contractId)
                      navigate(`/contracts/${contractId}/opstandards/${params.row.id}/edit`, {
                        state: { fromEdit: edit },
                      })
                    else
                      dispatch({
                        type: GLOBAL_ACTION.ADD_TOAST,
                        data: {
                          type: 'warning',
                          text: trlb('cannot_copy_op_standard'),
                        },
                      })
                  }}
                >
                  <EditIcon />
                </IconButton>
              )
            },
          },
        ]
        : []),
    ],
    [contractId],
  )

  const onCopy = async () => {
    if (lastContract) {
      const newOpStandards = await copyOpStandards(lastContract, contractId)
      form.setFieldValue('opStandards', newOpStandards || {})
    }
  }

  if (!canViewOpStandards)
    return (
      <Typography variant='h6' sx={{ textAlign: 'center', marginTop: '20px' }}>
        {trlb('opStandardsList_noPermission_warning')}
      </Typography>
    )

  const getContent = () => {
    if (edit || !!form.values.details?.doctorId)
      return (
        <>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography variant='h6' sx={{ flexGrow: 1, textAlign: 'left' }}>
              {trlb('contract_op_standard')}
            </Typography>
          </Toolbar>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FlexSearchField searchText={searchText} setSearchText={setSearchText} />
            </Grid>
            {canCreateOpStandards && isNew
              ? (
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                  <TextIconButton
                    icon={<AddIcon sx={{ marginRight: '10px' }} />}
                    variant='outlined'
                    text={trlb('create_new_op_standard')}
                    sx={{ mx: 2 }}
                    onClick={() => navigate(routes.addNewContractOPStandard)}
                  />
                  {!Object.values(form.values.opStandards ?? {}).length && (
                    <TextIconButton
                      icon={<CopyAll sx={{ marginRight: '10px' }} />}
                      variant='outlined'
                      text={trlb('copy_op_standard')}
                      onClick={onCopy}
                      disabled={!lastContract}
                    />
                  )}
                </Toolbar>
              )
              : (
                <Space20 />
              )}
            <Box sx={{ width: '100%', paddingLeft: '16px', display: 'flex' }}>
              <FlexDataTable
                columns={columns}
                rows={rows}
                onRowClick={(row: any) => {
                  if (contractId) navigate(`/contracts/${contractId}/opstandards/${row.id}`)
                  else
                    dispatch({
                      type: GLOBAL_ACTION.ADD_TOAST,
                      data: {
                        type: 'warning',
                        text: trlb('cannot_copy_op_standard'),
                      },
                    })
                }}
                autoHeight
              />
            </Box>
          </Grid>
        </>
      )

    if (!edit && !form.values.details?.doctorId && !isLoading)
      return (
        <Typography variant='h5' sx={{ flexGrow: 1, textAlign: 'left', mt: 4, color: 'error.main' }}>
          {trlb('op_standard_selectDoctor_warning')}
        </Typography>
      )

    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {getContent()}
    </Box>
  )
}
