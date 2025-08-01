import React, { useState } from 'react'
import { Box } from '@mui/material'
import { PageContainer, PageHeader, SectionTitle, Space40, FormContainer } from 'components/Commons'
import { useParams } from 'react-router-dom'
import { DeleteButton, EditButton, SaveButton } from 'components/Buttons'
import { useFormik } from 'formik'
import {
  PERMISSIONS_DOMAINS_SCOPES,
  I_PERMISSIONS_DOMAINS_SCOPES,
  Role,
  permissionRequests,
  ICapabilityName,
} from '@smambu/lib.constants'
import * as yup from 'yup'
import { trlb } from 'utilities'
import { useAppSelector } from 'store'
import StandardDialog from 'components/StandardDialog'
import { useCheckPermission } from 'hooks/userPermission'
import { useDeleteRole, useGetCapabilitiesList, useGetRoles, useUpdateRole } from 'hooks/rolesHooks'
import RoleInformation from './components/RoleInformation'
import Capabilities from './components/RoleCapabilities'
import RoleDomains from './components/RoleDomains'
import { FlexSearchField } from 'components/FlexCommons'
import CopyRoleCapabilites from './components/CopyRoleCapabilites'
import ItemNotFound from 'pages/ItemNotFound'

interface IRoleDetailsPageProps {
  isEdit?: boolean
  isNew?: boolean
}

const RoleDetailsPage = ({ isEdit, isNew }: IRoleDetailsPageProps) => {
  const { capabilitiesList, domains } = useGetCapabilitiesList()
  const isLoading = useAppSelector(state => state.global.loading.length > 0)
  const roles = useAppSelector(state => state.roles)
  const { roleId } = useParams()
  const [edit, setEdit] = useState(isNew || isEdit)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [domainFilter, setDomainFilter] = React.useState<string | null>(null)
  const canEditRoles = useCheckPermission(permissionRequests.canEditRoles)
  const canDeleteRole = useCheckPermission(permissionRequests.canDeleteRole)
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  useGetRoles()

  const role = roles[roleId!]

  React.useEffect(() => {
    if (!isNew && role) {
      const domainScopes = Object.fromEntries(
        Object.entries(domains)
          .map(([key]) => [key, role.domain_scopes[key as keyof typeof role.domain_scopes]])
      )

      form.setValues({
        ...role,
        domain_scopes: domainScopes,
      })
    }
  }, [roleId, role])

  const onSubmit = async (values: Partial<Role>) => {
    updateRole({
      roleId,
      values,
    })
  }

  const domainScopes = Object.fromEntries(Object.entries(domains).map(([key]) => [key, '']))

  const form = useFormik<Partial<Role>>({
    validateOnMount: true,
    initialValues: {
      name: '',
      capabilities: [],
      scope: undefined,
      domain_scopes: domainScopes,
    },
    validationSchema: yup.object({
      name: yup
        .string()
        .required(trlb('commons_required'))
        .test('is-unique', trlb('commons_unique'), value => {
          if (isNew)
            return !Object.values(roles)?.find(role => (role.name ?? '').toLowerCase() === (value ?? '').toLowerCase())
          else
            return !Object.values(roles)?.find(
              role => (role.name ?? '').toLowerCase() === (value ?? '').toLowerCase() && role.id !== roleId,
            )
        }),
      capabilities: yup.array().required(trlb('commons_required')),
      scope: yup
        .mixed<I_PERMISSIONS_DOMAINS_SCOPES>()
        .oneOf(Object.values(PERMISSIONS_DOMAINS_SCOPES))
        .required(trlb('commons_required')),
      domain_scopes: yup.object().required(trlb('commons_required')),
    }),
    onSubmit,
  })

  if (role == null && !isNew && isLoading) return null
  if (role == null && !isNew) return <ItemNotFound message={trlb('role_not_found')} />

  const saveDisabled = !form.isValid || form.isSubmitting || isLoading

  return (
    <>
      <StandardDialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        titleKey={'role_delete'}
        textKey={role?.userCount ? 'role_cannotDelete_error' : 'role_delete_confirm'}
        textVars={{
          name: form.values.name ?? '',
          userCount: String(role?.userCount),
        }}
        onConfirm={() => deleteRole(role)}
        confirmDisabled={Boolean(role?.userCount)}
      />
      <FormContainer onSubmit={form.handleSubmit}>
        <PageContainer sx={{ p: 0 }}>
          <PageHeader pageTitle={trlb('role_details')}
            showBackButton>
            {canDeleteRole &&
              edit &&
              !isNew &&
              <DeleteButton onClick={() => setShowDeleteModal(true)} />}
            {edit
              ? <SaveButton type='submit'
                disabled={saveDisabled} />
              : null}
            {!edit && canEditRoles
              ? <EditButton setEdit={setEdit}
                disabled={isLoading} />
              : null}
          </PageHeader>
          <RoleInformation domains={domains}
            edit={edit}
            form={form} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
            <FlexSearchField
              searchText={searchText}
              setSearchText={setSearchText}
              noDebounce
            />
            <SectionTitle text={trlb('capabilities_assigned_to_the_role')}
              sx={{ my: 0 }} />
            <CopyRoleCapabilites
              role={role}
              roles={roles}
              edit={edit}
              form={form}
            />
          </Box>
          <Box sx={{ display: 'flex', height: 600, overflow: 'hidden', gap: 1 }}>
            <RoleDomains
              edit={edit}
              form={form}
              domainFilter={domainFilter}
              setDomainFilter={setDomainFilter}
              searchText={searchText}
              domains={domains}
            />
            <Capabilities
              role={role}
              edit={edit}
              capabilities={form.getFieldProps('capabilities').value as ICapabilityName[]}
              domainFilter={domainFilter}
              form={form}
              searchText={searchText}
              capabilitiesList={capabilitiesList}
            />
          </Box>
          <Space40 />
        </PageContainer>
      </FormContainer>
    </>
  )
}

export default RoleDetailsPage
