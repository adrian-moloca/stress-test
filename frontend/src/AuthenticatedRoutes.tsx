import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from 'layouts/MainLayout'
import Dashboard from 'pages/Dashboard'
import { routes } from 'routes/routes'
import CalendarPage from 'pages/Calendar'
import CasesListPage from 'pages/CasesList/CasesList'
import PatientsListPage from 'pages/Patients'
import PatientDetailsPage from 'pages/PatientDetail'
import CaseDetailsPage from 'pages/CaseDetails/CaseDetail'
import AnesthesiologistManagement from 'pages/Anesthesiologist/Anesthesiologist'
import OrManagementPage from 'pages/OrManagementPage'
import UsersListPage from 'pages/Users'
import UserDetailsPage from 'pages/UserDetail/UserDetail'
import RolesListPage from 'pages/Roles'
import RoleDetailsPage from 'pages/RoleDetails/RoleDetail'
import AuditTrailPage from 'pages/AuditTrail'
import SystemConfigurationPage from 'pages/SystemConfiguration/SystemConfiguration'
import ContractsListPage from 'pages/Contracts'
import ContractDetailPage from 'pages/ContractDetail/ContractDetail'
import OPStandardManagementPage from 'pages/OpStandardManagement/OpStandardManagement'
import AnestesiologistOPStandardList from 'pages/AnestesiologistOPStandardList'
import LogsPage from 'pages/Logs'
import BookingRequest from 'pages/BookingDetail/BookingDetail'
import SchedulingPage from 'pages/Scheduling/Scheduling'
import ForbiddenPage from 'pages/Forbidden'
import AnesthesiologistOPStandardManagement from 'pages/AnesthesiologistOpStandard/AnesthesiologistOPStandardManagement'
import { useGetCheckPermission } from 'hooks/userPermission'
import { AnesthesiologistOpStandardProcess, permissionRequests } from '@smambu/lib.constants'
import Anagraphics from 'pages/Anagraphics/Anagraphics'
import WelcomePage from 'pages/welcomePage'
import Explorer from 'pages/Explorer/Explorer'
import { UBPlayground } from 'universal-reporting/UBPlayground'
import PcMaterials, { PC_MATERIALS_TABS_IDS } from 'pages/PcMaterials/PcMaterials'
import { useGetAnagraphicsSetups } from 'hooks'

const AuthenticatedRoutes = () => {
  const anagraphicsSetups = useGetAnagraphicsSetups()
  const viewableAnagraphics = Object.values(anagraphicsSetups)
    .filter(({ permissionsRequests }) => permissionsRequests.view)
    .sort((a, b) => a.index - b.index)

  const checkPermission = useGetCheckPermission()
  const canViewDashBoard = checkPermission(permissionRequests.canViewDashBoard)
  const canViewUsers = checkPermission(permissionRequests.canViewUsers)
  const canCreateUser = checkPermission(permissionRequests.canCreateUser)
  const canEditUsers = checkPermission(permissionRequests.canEditUsers)
  const canCreateRole = checkPermission(permissionRequests.canCreateRole)
  const canViewRoles = checkPermission(permissionRequests.canViewRoles)
  const canEditRoles = checkPermission(permissionRequests.canEditRoles)
  const canCreateContract = checkPermission(permissionRequests.canCreateContract)
  const canViewContracts = checkPermission(permissionRequests.canViewContracts)
  const canEditContracts = checkPermission(permissionRequests.canEditContracts)
  const canViewOpStandards = checkPermission(permissionRequests.canViewOpStandards)
  const canCreateOpStandards = checkPermission(permissionRequests.canCreateOpStandards)
  const canEditOpStandards = checkPermission(permissionRequests.canEditOpStandards)
  const canViewOr = checkPermission(permissionRequests.canViewOr)
  const canCreateOr = checkPermission(permissionRequests.canCreateOr)
  const canCreateBooking = checkPermission(permissionRequests.canCreateBooking)
  const canViewCalendar = checkPermission(permissionRequests.canViewCalendar)
  const canEditSystemConfiguration = checkPermission(permissionRequests.canEditSystemConfiguration)
  // Anagraphics has permissions check already integrated
  const canViewPatients = checkPermission(permissionRequests.canViewPatients)
  const canEditPatients = checkPermission(permissionRequests.canEditPatients)
  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)
  const canViewAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canViewAnesthesiologistsScheduling)
  const canViewCasesList = checkPermission(permissionRequests.canViewCasesList)
  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canEditCases = checkPermission(permissionRequests.canEditCases)
  const canViewAnesthesiologistOpStandards = checkPermission(permissionRequests
    .canViewAnesthesiologistOpStandards)
  const canCreateAnesthesiologistOpStandard = checkPermission(permissionRequests
    .canCreateAnesthesiologistOpStandard)
  const canEditAnesthesiologistOpStandards = checkPermission(permissionRequests
    .canEditAnesthesiologistOpStandards)
  const canViewLogs = checkPermission(permissionRequests.canViewLogs)
  const canViewAuditTrails = checkPermission(permissionRequests.canViewAuditTrails)
  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)
  const hideContracts = checkPermission(permissionRequests.hideContracts)
  const canViewExplorer = checkPermission(permissionRequests.canViewExplorer)
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)

  return (
    <MainLayout>
      <Routes>
        <Route path='*'
          element={canViewDashBoard ? <Dashboard /> : <WelcomePage noRedirect />} />
        <Route path={routes.dashboard}
          element={canViewDashBoard
            ? <Dashboard />
            : <WelcomePage />} />
        <Route path={routes.baseCalendar}
          element={canViewCalendar
            ? <CalendarPage />
            : <ForbiddenPage />} />
        <Route path={routes.calendar}
          element={canViewCalendar
            ? <CalendarPage />
            : <ForbiddenPage />} />
        <Route path={routes.calendarWithoutOrId}
          element={canViewCalendar
            ? <CalendarPage />
            : <ForbiddenPage />} />
        <Route path={routes.bookingDetails}
          element={canCreateBooking
            ? <BookingRequest />
            : <ForbiddenPage />} />
        <Route path={routes.cases}
          element={canViewCasesList && canViewCases
            ? <CasesListPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.patientCases}
          element={canViewCasesList && canViewCases ? <CasesListPage /> : <ForbiddenPage />}
        />
        <Route
          path={routes.schedule}
          element={canAccessScheduling && canViewBookings ? <SchedulingPage /> : <ForbiddenPage />}
        />
        <Route path={routes.caseDetails}
          element={canViewCases
            ? <CaseDetailsPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.caseEdit}
          element={canViewCases && canEditCases
            ? <CaseDetailsPage isEdit={true} />
            : <ForbiddenPage />}
        />
        <Route path={routes.patientsList}
          element={canViewPatients
            ? <PatientsListPage />
            : <ForbiddenPage />} />
        <Route path={routes.patientDetails}
          element={<PatientDetailsPage />} />
        <Route
          path={routes.editPatient}
          element={canEditPatients ? <PatientDetailsPage isEdit={true} /> : <ForbiddenPage />}
        />
        <Route
          path={routes.anesthesiologistsSchedule}
          element={
            canViewAnesthesiologistsScheduling && canEditAnesthesiologistsScheduling
              ? (
                <AnesthesiologistManagement />
              )
              : (
                <ForbiddenPage />
              )
          }
        />
        <Route path={routes.orList}
          element={canViewOr
            ? <OrManagementPage />
            : <ForbiddenPage />} />
        <Route path={routes.orDetails}
          element={canViewOr
            ? <OrManagementPage />
            : <ForbiddenPage />} />
        <Route path={routes.newOr}
          element={canCreateOr
            ? <OrManagementPage />
            : <ForbiddenPage />} />
        <Route path={routes.usersList}
          element={canViewUsers
            ? <UsersListPage />
            : <ForbiddenPage />} />
        <Route path={routes.userDetails}
          element={canViewUsers
            ? <UserDetailsPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.newUser}
          element={canCreateUser
            ? <UserDetailsPage isEdit={true}
              isNew={true} />
            : <ForbiddenPage />}
        />
        <Route path={routes.userEdit}
          element={canEditUsers
            ? <UserDetailsPage isEdit={true} />
            : <ForbiddenPage />} />
        <Route path={routes.rolesList}
          element={canViewRoles
            ? <RolesListPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.newRole}
          element={canCreateRole
            ? <RoleDetailsPage isEdit={true}
              isNew={true} />
            : <ForbiddenPage />}
        />
        <Route path={routes.roleDetails}
          element={canViewRoles
            ? <RoleDetailsPage />
            : <ForbiddenPage />} />
        <Route path={routes.roleEdit}
          element={canEditRoles
            ? <RoleDetailsPage isEdit={true} />
            : <ForbiddenPage />} />
        <Route path={routes.auditTrails}
          element={canViewAuditTrails
            ? <AuditTrailPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.systemConfiguration}
          element={canEditSystemConfiguration ? <SystemConfigurationPage /> : <ForbiddenPage />}
        />
        <Route
          path={routes.contractsList}
          element={canViewContracts && !hideContracts ? <ContractsListPage /> : <ForbiddenPage />}
        />
        <Route
          path={routes.contractDetails}
          element={canViewContracts && !hideContracts ? <ContractDetailPage /> : <ForbiddenPage />}
        />
        <Route
          path={routes.editContract}
          element={canEditContracts ? <ContractDetailPage isEdit /> : <ForbiddenPage />}
        />
        <Route
          path={routes.newContract}
          element={canCreateContract && canViewContracts
            ? <ContractDetailPage isNew />
            : <ForbiddenPage />}
        />
        <Route
          path={routes.addNewOPStandard}
          element={canCreateOpStandards ? <OPStandardManagementPage isNew /> : <ForbiddenPage />}
        />
        <Route
          path={routes.OPStandardDetails}
          element={canViewOpStandards ? <OPStandardManagementPage /> : <ForbiddenPage />}
        />
        <Route
          path={routes.editOPStandard}
          element={canEditOpStandards ? <OPStandardManagementPage isEdit /> : <ForbiddenPage />}
        />
        <Route
          path={routes.addNewContractOPStandard}
          element={canCreateOpStandards ? <OPStandardManagementPage isNew /> : <ForbiddenPage />}
        />

        <Route
          path={routes.anesthesiologistOPStandardList}
          element={canViewAnesthesiologistOpStandards
            ? <AnestesiologistOPStandardList />
            : <ForbiddenPage />}
        />
        <Route
          path={routes.anesthesiologistOPStandardDetails}
          element={
            canViewAnesthesiologistOpStandards
              ? (
                <AnesthesiologistOPStandardManagement
                  process={AnesthesiologistOpStandardProcess.VIEW}
                />
              )
              : (
                <ForbiddenPage />
              )
          }
        />
        <Route
          path={routes.addNewAnesthesiologistOPStandard}
          element={
            canCreateAnesthesiologistOpStandard
              ? (
                <AnesthesiologistOPStandardManagement
                  process={AnesthesiologistOpStandardProcess.CREATE}
                />
              )
              : (
                <ForbiddenPage />
              )
          }
        />
        <Route
          path={routes.editAnesthesiologistOPStandard}
          element={
            canEditAnesthesiologistOpStandards
              ? (
                <AnesthesiologistOPStandardManagement
                  process={AnesthesiologistOpStandardProcess.EDIT}
                />
              )
              : (
                <ForbiddenPage />
              )
          }
        />
        <Route
          path={routes.newVersionAnesthesiologistOPStandard}
          element={
            canCreateAnesthesiologistOpStandard
              ? (
                <AnesthesiologistOPStandardManagement
                  process={AnesthesiologistOpStandardProcess.NEW_VERSION}
                />
              )
              : (
                <ForbiddenPage />
              )
          }
        />

        <Route path={routes.logManagement}
          element={canViewLogs
            ? <LogsPage />
            : <ForbiddenPage />} />
        <Route
          path={routes.explorer}
          element={canViewExplorer ? <Explorer /> : <ForbiddenPage />}
        />

        {/* TODO: REMOVE THIS */}
        <Route path='/UBPlayground'
          element={<UBPlayground />} />
        <Route path={routes.surplusSection}
          element={<Navigate to={routes.pcMaterials} />} />
        <Route
          path={routes.pcMaterials}
          element={canViewPcMaterials ? <PcMaterials /> : <ForbiddenPage />}
        />
        <Route
          path={routes.pcMaterialsBase}
          element={<Navigate to={routes.mapPcMaterials(PC_MATERIALS_TABS_IDS.CASES)} />} />
        {viewableAnagraphics.map(({ anagraphicType }) => (
          <Route
            key={anagraphicType}
            path={routes.mapAnagraphics(anagraphicType)}
            element={<Anagraphics anagraphicType={anagraphicType} />}
          />
        ))}
        <Route path={routes.anagraphics}
          element={<Anagraphics anagraphicType={null} />} />
      </Routes>
    </MainLayout>
  )
}

export default AuthenticatedRoutes
