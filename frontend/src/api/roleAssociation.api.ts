import { getReadableErrorMessage } from 'utilities/misc'
import { roleClient } from './apiClient'
import { ICreateRoleAssociationRequest, ISelectedRole, RoleAssociation } from '@smambu/lib.constants'

export const convertRoleAssociationsToSelectedRoles = (roleAssociations: RoleAssociation[]) =>
  roleAssociations.map(roleAssociation => ({
    roleId: roleAssociation.role,
    users: [...roleAssociation.users],
    roleAssociationId: roleAssociation.id,
  }))

export const convertSelectedRolesToRoleAssociations = (selectedRoles: ISelectedRole[]) =>
  (selectedRoles || [])
    .filter(selectedRole => selectedRole.roleId !== '')
    .map(selectedRole => ({
      role: selectedRole.roleId,
      users: selectedRole.users,
      id: selectedRole.roleAssociationId,
    }))

export const updateRolesAssociations = async (
  oldRolesAssociations: RoleAssociation[],
  selectedRoles: ISelectedRole[],
) => {
  const newRolesAssociations = convertSelectedRolesToRoleAssociations(selectedRoles)
  // XXX investigate this - seems like something was deleted by mistake
  const _rolesAssociationsToDelete = (oldRolesAssociations || []).filter(
    oldRoleAssociation =>
      !newRolesAssociations
        .find(newRoleAssociation => newRoleAssociation.id === oldRoleAssociation.id),
  )
  const rolesAssociationsToCreate = newRolesAssociations.filter(
    newRoleAssociation =>
      !(oldRolesAssociations || [])
        .find(oldRoleAssociation => newRoleAssociation.id === oldRoleAssociation.id),
  )
  const rolesAssociationsToUpdate = newRolesAssociations.filter(newRoleAssociation =>
    (oldRolesAssociations || []).find(
      oldRoleAssociation =>
        newRoleAssociation.id === oldRoleAssociation.id &&
        (newRoleAssociation.role !== oldRoleAssociation.role ||
          newRoleAssociation.users.length !== oldRoleAssociation.users.length ||
          newRoleAssociation.users.some(user => !oldRoleAssociation.users.includes(user)) ||
          oldRoleAssociation.users.some(user => !newRoleAssociation.users.includes(user))),
    ))

  const notUpdatedRolesAssociations = newRolesAssociations.filter(
    newRoleAssociation =>
      !rolesAssociationsToUpdate
        .some(roleAssociationToUpdate => roleAssociationToUpdate.id === newRoleAssociation.id),
  )

  const createdRoleAssociations = await Promise.all(
    rolesAssociationsToCreate.map(roleAssociation => RoleAssociationApi.create(roleAssociation)),
  )

  // i'm leaving this as a reminder: this should not be like this, it's probably a mistake
  // that didn't break the code before but breaks it now. This should be a delete, not a create,
  // and some error in the roleassociations schema prevented us for noticing.
  // await Promise.all(rolesAssociationsToDelete.map(roleAssociation => RoleAssociationApi.create(roleAssociation)))

  const updatedRoleAssociations = await Promise.all(
    rolesAssociationsToUpdate.map(async roleAssociation => {
      await RoleAssociationApi.update(roleAssociation.id, roleAssociation)
      return roleAssociation
    }),
  )

  return [...createdRoleAssociations, ...updatedRoleAssociations, ...notUpdatedRolesAssociations]
}

export class RoleAssociationApi {
  static async findAll () {
    return roleClient
      .get('/role-associations')
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async create (data: ICreateRoleAssociationRequest) {
    return roleClient
      .post('/role-associations', data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async update (id: string, data: ICreateRoleAssociationRequest) {
    return roleClient
      .put(`/role-associations/${id}`, data)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }

  static async addUser (id: string, userId: string) {
    return roleClient
      .post(`/role-associations/${id}/users/${userId}`)
      .then(res => res.data)
      .catch(err => {
        const message = getReadableErrorMessage(err)
        return Promise.reject(new Error(message))
      })
  }
}
