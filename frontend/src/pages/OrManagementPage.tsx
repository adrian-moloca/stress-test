import React, { useCallback, useEffect, useState } from 'react'
import { Box } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DefaultButton, SaveButton } from 'components/Buttons'
import { PageContainer, PageHeader, SectionTitle, Space20 } from 'components/Commons'
import { routes } from 'routes/routes'
import { trlb } from 'utilities/translator/translator'
import RoomDetails from './RoomDetails/RoomDetails'
import RoomSelection from './RoomDetails/components/RoomSelection'
import { useAppSelector } from 'store'
import { OperatingRoom, OperatingRoomStatus, permissionRequests } from '@smambu/lib.constants'
import { useFormik } from 'formik'
import { useGetCheckPermission } from 'hooks/userPermission'
import * as yup from 'yup'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditRoom, useGetOperatingRooms, useSaveRoom } from 'hooks/roomsHooks'
import ItemNotFound from './ItemNotFound'

const initialValues = {
  tenantId: '',
  operatingRoomId: '',
  customRoomId: '',
  name: '',
  status: undefined as OperatingRoomStatus | undefined,
  notes: '',
  exception: {
    startDate: null as Date | null,
    endDate: null as Date | null,
    repeatedEvery: [] as number[],
  },
  id: undefined as string | undefined,
}

export type TOrInitialValues = typeof initialValues

const OrManagementPage = () => {
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const [showDays, setShowDays] = useState(true)
  const addNewRoomPage = location.pathname === routes.newOr
  const operatingRooms = useAppSelector(state => state.operatingRooms)
  const checkPermission = useGetCheckPermission()
  const canCreateOr = checkPermission(permissionRequests.canCreateOr)
  const canEditOr = checkPermission(permissionRequests.canEditOr)
  const canDeleteOr = checkPermission(permissionRequests.canDeleteOr)
  const navigate = useNavigate()
  const editRoom = useEditRoom()
  const saveRoom = useSaveRoom()
  const { orId: selectedOrId } = useParams()

  const getOperatingRooms = useGetOperatingRooms()
  React.useEffect(() => {
    getOperatingRooms()
  }, [])

  const onSubmit = async (values: TOrInitialValues) => {
    if (!addNewRoomPage) {
      editRoom({ roomId: values.operatingRoomId, roomValues: values as OperatingRoom })
      getOperatingRooms()
      navigate(routes.mapOrDetails(form.values.operatingRoomId))
    } else {
      saveRoom({ roomValues: values as OperatingRoom })
      getOperatingRooms()
      navigate(routes.orList)
    }
  }

  const form = useFormik<TOrInitialValues>({
    validateOnMount: true,
    initialValues,
    validationSchema: yup.object({
      customRoomId: yup
        .string()
        .required(trlb('commons_required'))
        .test(
          'unique-room-id',
          trlb('orManagement_roomIdAlreadyExist_error'),
          (value, { parent }) =>
            !Object.values(operatingRooms).some(
              room => room.customRoomId === value &&
              parent.operatingRoomId !== room.operatingRoomId,
            ),
        ),
      name: yup
        .string()
        .required(trlb('commons_required'))
        .test(
          'unique-room-name',
          trlb('orManagement_roomNameAlreadyExist_error'),
          (value, { parent }) =>
            !Object.values(operatingRooms).some(
              room =>
                room.name.toLowerCase() === value.toLowerCase() &&
               parent.operatingRoomId !== room.operatingRoomId,
            ),
        ),
      status: yup
        .mixed<OperatingRoomStatus>()
        .oneOf(Object.values(OperatingRoomStatus))
        .required(trlb('commons_required')),
      notes: yup.string(),
      exception: yup.object({
        startDate: yup.date().nullable(),
        endDate: yup.date().nullable(),
        repeatedEvery: yup.array().of(yup.number().min(0)
          .max(7)),
      }),
    }),
    onSubmit,
  })

  useEffect(() => {
    const room = operatingRooms[form.values.operatingRoomId]?.exception?.repeatedEvery
    setShowDays(room != null && room?.length > 0)
  }, [form.values.operatingRoomId, operatingRooms])

  useEffect(() => {
    if (!showDays) form.setFieldValue('exception.repeatedEvery', [])
  }, [showDays])

  const selectRoom = useCallback(
    (roomId: string) => {
      if (roomId && operatingRooms[roomId])
        form.setValues({
          operatingRoomId: roomId,
          customRoomId: operatingRooms[roomId].customRoomId ?? '',
          name: operatingRooms[roomId].name,
          status: operatingRooms[roomId].status,
          notes: operatingRooms[roomId].notes,
          exception: {
            startDate: operatingRooms[roomId].exception?.startDate ?? '',
            endDate: operatingRooms[roomId].exception?.endDate ?? '',
            repeatedEvery: operatingRooms[roomId].exception?.repeatedEvery ?? undefined,
          },
        } as any)
    },
    [operatingRooms],
  )

  useEffect(() => {
    if (selectedOrId !== undefined) selectRoom(selectedOrId)
    else form.setValues(initialValues)
  }, [selectedOrId, selectRoom])

  const getContent = () => {
    if (selectedOrId || addNewRoomPage)
      return (
        <RoomDetails
          form={form}
          showDays={showDays}
          setShowDays={setShowDays}
          canEditOr={canEditOr}
          addNewRoomPage={addNewRoomPage}
          canDeleteOr={canDeleteOr}
        />
      )

    return !addNewRoomPage ? <SectionTitle text={trlb('orManagement_noRoomSelected_label')} /> : null
  }

  const handleNewORClick = () => {
    form.resetForm()
    navigate(routes.newOr)
  }

  if (form.values.operatingRoomId === '' && selectedOrId != null && !addNewRoomPage && isLoading) return null
  if (form.values.operatingRoomId === '' && selectedOrId != null && !addNewRoomPage)
    return <ItemNotFound message={trlb('orManagement_room_not_found')} />

  return (
    <PageContainer>
      <PageHeader
        pageTitle={!addNewRoomPage ? trlb('add_or_management') : trlb('create_or')}
        button={
          canCreateOr && !addNewRoomPage
            ? (
              <DefaultButton
                onClick={handleNewORClick}
                icon={<AddIcon sx={{ marginRight: '10px' }} />}
                text={trlb('create_or')}
                disabled={isLoading}
              />
            )
            : null
        }
      >
        {(canEditOr && selectedOrId) || addNewRoomPage
          ? (
            <SaveButton type='submit' onClick={() => onSubmit(form.values)} disabled={isLoading || Object.keys(form.errors).length} />
          )
          : null}
      </PageHeader>
      <Space20 />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        {!addNewRoomPage ? <RoomSelection {...{ form, selectRoom, canEditOr }} /> : null}
        {getContent()}
      </Box>
    </PageContainer>
  )
}

export default OrManagementPage
