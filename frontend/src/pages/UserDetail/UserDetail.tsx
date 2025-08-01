import React, { useEffect, useState } from 'react'
import { Typography, Grid, Button, Toolbar, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { FormContainer, GridTextField, PageHeader, Panel, SectionTitle, Space20, Space40 } from 'components/Commons'
import { EditButton, SaveButton } from 'components/Buttons'
import { AddressFormFields } from 'components/Forms'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { trlb } from 'utilities'
import {
  ISelectedRole,
  ICapabilityName,
  Role,
  IUser,
  permissionRequests,
  Capabilities,
  phoneRegex,
  getFullName,
  validateEmail,
} from '@smambu/lib.constants'
import { useParams } from 'react-router-dom'
import { useAppSelector } from 'store'
import UserRoles from './components/UserRoles'
import { convertRoleAssociationsToSelectedRoles } from 'api/roleAssociation.api'
import { ExpandMore } from '@mui/icons-material'
import { useGetCheckPermission } from 'hooks/userPermission'
import {
  useUpdateUser,
  useGetUserDetails,
  useRequestResetUserPassword,
  useGetCredentialData,
  useCheckEmailAlreadyUsed,
  useGetUsers,
} from 'hooks/userHooks'
import ActivationButton from './components/ActivationButton'
import { useGetCapabilitiesList, useGetRoles } from 'hooks/rolesHooks'
import { format, isValid } from 'date-fns'
import ItemNotFound from 'pages/ItemNotFound'
import UserAnagraphicsFields from './components/UserAnagraphicsFields'
import ForbiddenPage from 'pages/Forbidden'

interface IUserDetailsPageProps {
  isEdit?: boolean
  isNew?: boolean
}

const UserDetailsPage = ({ isEdit, isNew }: IUserDetailsPageProps) => {
  const { capabilitiesList } = useGetCapabilitiesList()
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const [edit, setEdit] = React.useState(isNew || isEdit)
  const [selectedUser, setSelectedUser] = React.useState<IUser | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<ISelectedRole[]>([])
  const users = useAppSelector(state => state.users)
  const roles = useAppSelector(state => Object.values(state.roles))
  const checkPermission = useGetCheckPermission()
  const canActivateUser = checkPermission(permissionRequests.canActivateUser)
  const canEditUser = checkPermission(permissionRequests.canEditUser, {
    user: selectedUser ??
    undefined
  })
  const canCreateUser = checkPermission(permissionRequests.canCreateUser)
  const canViewRoles = checkPermission(permissionRequests.canViewRoles)
  const getUserDetails = useGetUserDetails()
  const { userId } = useParams()
  const requestResetUserPassword = useRequestResetUserPassword()
  const updateUser = useUpdateUser()
  const getUsers = useGetUsers()
  const usersLength = Object.keys(users).length
  useGetRoles()

  useEffect(() => {
    const fetchUser = async () => {
      if (userId && userId !== 'new') {
        const user = await getUserDetails(userId)
        if (user.error != null) return
        setSelectedUser(user)
      }
    }
    fetchUser()
  }, [userId])

  useEffect(() => {
    if (usersLength === 0 && !isLoading)
      getUsers()
  }, [usersLength, isLoading])

  const onSubmit = async (values: Omit<IUser, 'roleAssociations'>) => {
    updateUser({
      values,
      userId: userId || '',
      oldRolesAssociations: selectedUser?.roleAssociations!,
      selectedRoles,
    })
  }

  const form = useFormik({
    validateOnMount: true,
    initialValues: {
      title: '',
      firstName: '',
      lastName: '',
      birthDate: null,
      phoneNumber: '',
      email: '',
      address: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: '',
      },
      practiceName: '',
      active: false,
    },
    validationSchema: yup.object({
      title: yup.string(),
      firstName: yup.string().required(trlb('commons_required')),
      lastName: yup.string().required(trlb('commons_required')),
      birthDate: yup
        .date()
        .nullable()
        .typeError(trlb('date_invalid_error'))
        .max(new Date(), trlb('dateTime_future_date_not_enabled')),
      phoneNumber: yup.string().matches(phoneRegex, trlb('commons_phoneNotValid')),
      email: yup
        .string()
        .required(trlb('commons_required'))
        .test(async (value, ctx) => {
          if (!validateEmail(value)) return ctx.createError({ message: trlb('commons_emailNotValid') })

          const emailAlreadyUsed = await checkEmailAlreadyUsed(value)
          if (emailAlreadyUsed) return ctx.createError({ message: trlb('commons_emailAlreadyUsed') })
          return true
        }),
      address: yup.object({
        street: yup.string(),
        houseNumber: yup.string(),
        postalCode: yup.string(),
        city: yup.string(),
        country: yup.string(),
      }),
      practiceName: yup.string(),
      active: yup.boolean(),
    }),
    onSubmit,
  })

  const { checkEmailAlreadyUsed } = useCheckEmailAlreadyUsed(selectedUser?.email ?? '')

  useEffect(() => {
    if (userId !== 'new' && userId && selectedUser) {
      form.setValues({
        title: selectedUser.title,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        birthDate: selectedUser.birthDate,
        phoneNumber: selectedUser.phoneNumber,
        email: selectedUser.email,
        address: {
          street: selectedUser.address?.street,
          houseNumber: selectedUser.address?.houseNumber,
          postalCode: selectedUser.address?.postalCode,
          city: selectedUser.address?.city,
          country: selectedUser.address?.country,
        },
        active: selectedUser.active,
        practiceName: selectedUser.practiceName ?? '',
      } as any)
      setSelectedRoles(convertRoleAssociationsToSelectedRoles(selectedUser.roleAssociations ?? []))
    }
  }, [userId, selectedUser])

  const { credentialData } = useGetCredentialData(selectedUser?.email)

  const isVerified =
    credentialData == null ||
    credentialData.email !== form.values.email
      ? null
      : credentialData.verified

  const onResetUserPassword = () => {
    if (userId !== 'new' && userId) requestResetUserPassword(userId)
  }

  const userCapabilities = selectedRoles.reduce((acc, selectedRole) => {
    const role: Role | undefined = roles.find(role => role.id === selectedRole.roleId)
    if (!role?.capabilities?.length) return acc
    return [...acc, { role, capabilities: role.capabilities }]
  }, [] as { role: Role; capabilities: ICapabilityName[] }[])

  const formError =
    isNew && (!form.values.firstName || !form.values.lastName || !form.values.email)
      ? 'users_fieldsRequired_error'
      : undefined

  let pageTitle

  if (isNew) pageTitle = trlb('add_user')
  else pageTitle = edit ? trlb('edit_user') : getFullName(selectedUser, true)

  const getHeaderContent = () => {
    let saveButtonText = 'commons_save'

    if (isNew)
      saveButtonText = canActivateUser
        ? 'userDetails_createAndActivate_button'
        : 'userDetails_createAndAskActivation_button'

    if (edit)
      return (
        <SaveButton
          type='submit'
          disabled={!form.isValid || form.isSubmitting || isLoading}
          text={trlb(saveButtonText)}
          saveAsIcon
        />
      )

    return canEditUser ? <EditButton setEdit={setEdit} /> : <Box />
  }

  const activationDate =
    form.values.active &&
    selectedUser?.active &&
    selectedUser?.activatedAt &&
    isValid(new Date(selectedUser?.activatedAt ?? ''))
      ? new Date(selectedUser?.activatedAt ?? '')
      : null

  const creationDate =
    selectedUser?.createdAt && isValid(new Date(selectedUser?.createdAt ?? ''))
      ? new Date(selectedUser?.createdAt ?? '')
      : null

  const isDoctor = selectedRoles.some(selectedRole =>
    roles.some(
      role => role.id === selectedRole.roleId &&
      role.capabilities.some(cap => cap === Capabilities.U_IS_DOCTOR),
    ))
  const showPracticeName = isDoctor || (form.values.practiceName !== '' && roles.length === 0)

  if (usersLength === 0) return null
  if (selectedUser == null && !isNew && isLoading) return null
  if (selectedUser == null && !isNew) return <ItemNotFound message={trlb('user_not_found')} />
  if (isNew && !canCreateUser) return <ForbiddenPage />
  if (!isNew && isEdit && !canEditUser) return <ForbiddenPage />

  return (
    <FormContainer onSubmit={form.handleSubmit}>
      <PageHeader pageTitle={pageTitle} showBackButton>
        {getHeaderContent()}
      </PageHeader>
      {!isNew
        ? (
          <Toolbar sx={{ gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid lightGrey',
                borderRadius: theme => theme.constants.radius,
                padding: '10px',
              }}
            >
              <Typography variant='body1'>{trlb('user_status')}</Typography>
              {isVerified != null
                ? (
                  <>
                    <Box
                      sx={{
                        width: '15px',
                        height: '15px',
                        borderRadius: theme => theme.constants.radius,
                        background: isVerified ? 'green' : 'red',
                        marginRight: '10px',
                        marginLeft: '20px',
                      }}
                    />
                    <Typography variant='body1'>{trlb(isVerified ? 'user_verified' : 'user_notVerified')}</Typography>
                  </>
                )
                : null}
              <Box
                sx={{
                  width: '15px',
                  height: '15px',
                  borderRadius: theme => theme.constants.radius,
                  background: form.values.active ? 'green' : 'red',
                  marginRight: '10px',
                  marginLeft: '20px',
                }}
              />
              <Typography variant='body1'>{trlb(form.values.active ? 'user_active' : 'user_inactive')}</Typography>
            </Box>
            {activationDate || creationDate
              ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid lightGrey',
                    borderRadius: theme => theme.constants.radius,
                    padding: '10px',
                  }}
                >
                  <Typography variant='body1'>
                    {activationDate
                      ? trlb('userDetails_activationDateTime', {
                        date: format(activationDate, trlb('dateTime_date_time_string')),
                      })
                      : null}
                    {!activationDate && creationDate
                      ? trlb('userDetails_creationDateTime', {
                        date: format(creationDate, trlb('dateTime_date_time_string')),
                      })
                      : null}
                  </Typography>
                </Box>
              )
              : null}
            <ActivationButton
              active={form.values.active}
              edit={edit}
              disabled={form.isSubmitting}
              changeActiveStatus={() => form.setFieldValue('active', !form.values.active)}
            />
            {edit && !isNew && canEditUser
              ? (
                <Button variant='contained' color='primary' onClick={onResetUserPassword}>
                  {trlb('reset_user_password')}
                </Button>
              )
              : null}
          </Toolbar>
        )
        : null}
      <Space20 />
      {formError
        ? (
          <Box sx={{ width: '100%', textAlign: 'right' }}>
            <Typography variant='subtitle2' color='error'>
              {trlb(formError)}
            </Typography>
          </Box>
        )
        : (
          <Space20 />
        )}
      <SectionTitle text={trlb('user_info')} />
      <Space20 />
      <Grid container spacing={2}>
        <Grid item md={12} lg={6}>
          <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
            {trlb('patientForm_Anagraphics')}
          </Typography>
          <Panel>
            <UserAnagraphicsFields readOnly={!edit} form={form} selectedUser={selectedUser} />
          </Panel>
        </Grid>
        <Grid item md={12} lg={6}>
          <Typography variant='subtitle1' sx={{ width: '100%', textAlign: 'center' }}>
            {trlb('patientForm_Address')}
          </Typography>
          <Panel>
            <Grid container sx={{ justifyContent: 'center' }} spacing={2}>
              <AddressFormFields readOnly={!edit} form={form} />
              {showPracticeName
                ? (
                  <GridTextField
                    xs={12}
                    name='practiceName'
                    label={trlb('userDetails_practiceName')}
                    value={form.values.practiceName}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    disabled={!edit}
                  />
                )
                : null}
            </Grid>
          </Panel>
        </Grid>
      </Grid>
      <Space20 />
      <SectionTitle text={trlb('user_roles')} />
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <UserRoles
          canViewRoles={canViewRoles}
          selectedRoles={selectedRoles}
          setSelectedRoles={setSelectedRoles}
          roles={roles}
          users={Object.values(users)}
          edit={!!edit}
        />
        {canViewRoles && (
          <Grid item xs={6}>
            <SectionTitle text={trlb(userCapabilities?.length ? 'user_capabilities' : 'no_user_capabilities')} />
            {userCapabilities?.map(({ role, capabilities }) => {
              return (
                <Accordion key={role.id} sx={{ width: '100%', mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: 'bold' }} variant='subtitle1'>
                      {role.name}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {capabilities?.map(capabilityId => {
                      const capability = capabilitiesList.find(cap => cap.value === capabilityId)
                      return (
                        <Box key={capabilityId} sx={{ display: 'flex' }}>
                          <b style={{ marginRight: 10 }}>{capability?.name}</b>
                          <Typography sx={{ textTransform: 'capitalize' }}>
                            {capability?.permission?.toLowerCase()}
                          </Typography>
                        </Box>
                      )
                    })}
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Grid>
        )}
      </Grid>
      <Space40 />
    </FormContainer>
  )
}

export default UserDetailsPage
