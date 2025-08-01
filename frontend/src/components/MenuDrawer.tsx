import React from 'react'
import { Box, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import MuiDrawer from '@mui/material/Drawer'
import { styled, Theme, CSSObject } from '@mui/material/styles'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRight from '@mui/icons-material/ChevronRight'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import BedroomChildIcon from '@mui/icons-material/BedroomChild'
import TableChartIcon from '@mui/icons-material/TableChart'
import TableRowsIcon from '@mui/icons-material/TableRows'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import PatternIcon from '@mui/icons-material/Pattern'
import MoreTimeIcon from '@mui/icons-material/MoreTime'
import TodayIcon from '@mui/icons-material/Today'
import ExploreIcon from '@mui/icons-material/Explore'
import { routes } from 'routes/routes'
import { drawerWidth, permissionRequests } from '@smambu/lib.constants'
import { getLanguage, trlb } from 'utilities'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import { useGetCheckPermission } from 'hooks/userPermission'
import { useLocation, useNavigate } from 'react-router-dom'
import SettingsIcon from '@mui/icons-material/Settings'
import logo from '../assets/img/LogoSMAMBU.png'
import logoMini from '../assets/img/LogoSMAMBUmini.png'
import { GLOBAL_ACTION } from 'store/actions'
import { useDispatch } from 'react-redux'
import { Summarize } from '@mui/icons-material'
import { useGetAnagraphicsSetups } from 'hooks'

const HIDE_SIDEBAR_RESOLUTION = import.meta.env.VITE_HIDE_SIDEBAR_RESOLUTION
const hideResolution = HIDE_SIDEBAR_RESOLUTION ? Number(HIDE_SIDEBAR_RESOLUTION) : null

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
    overflowY: 'hidden',
  },
})

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}))

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  boxShadow: theme => theme.constants.boxShadow,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}))

interface MenuItem {
  route?: string
  name?: string
  label?: string
  Icon?: React.ElementType
  subMenuItems?: (MenuItem | null)[]
}

const MenuDrawer = () => {
  const anagraphicsSetups = useGetAnagraphicsSetups()
  const viewableAnagraphics = Object.values(anagraphicsSetups)
    .filter(({ permissionsRequests }) => permissionsRequests.view)
    .sort((a, b) => a.index - b.index)
  const language = getLanguage()

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [subMenuOpen, setSubMenuOpen] = React.useState<string | null>(null)
  const navigate = useNavigate()
  const checkPermission = useGetCheckPermission()
  const canViewUsers = checkPermission(permissionRequests.canViewUsers)
  const canViewRoles = checkPermission(permissionRequests.canViewRoles)
  const canViewOr = checkPermission(permissionRequests.canViewOr)
  const canEditSystemConfiguration = checkPermission(permissionRequests.canEditSystemConfiguration)
  const canViewMaterialsDatabase = checkPermission(permissionRequests.canViewMaterialsDatabase)
  const canViewPatients = checkPermission(permissionRequests.canViewPatients)
  const canCreateBooking = checkPermission(permissionRequests.canCreateBooking)
  const canViewAnesthesiologistOPStandards = checkPermission(permissionRequests
    .canViewAnesthesiologistOpStandards)
  const canViewDashBoard = checkPermission(permissionRequests.canViewDashBoard)
  const { pathname } = useLocation()
  const canViewCasesList = checkPermission(permissionRequests.canViewCasesList)
  const canViewCases = checkPermission(permissionRequests.canViewCases)
  const canAccessScheduling = checkPermission(permissionRequests.canAccessScheduling)
  const canViewAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canViewAnesthesiologistsScheduling)
  const canViewAuditTrails = checkPermission(permissionRequests.canViewAuditTrails)
  const canViewContracts = checkPermission(permissionRequests.canViewContracts)
  const canViewLogs = checkPermission(permissionRequests.canViewLogs)
  const canEditAnesthesiologistsScheduling = checkPermission(permissionRequests
    .canEditAnesthesiologistsScheduling)
  const canViewBookings = checkPermission(permissionRequests.canViewBookings)
  const hideContracts = checkPermission(permissionRequests.hideContracts)
  const canViewExplorer = checkPermission(permissionRequests.canViewExplorer)
  const canViewPrescribableMaterials =
    checkPermission(permissionRequests.canViewPrescribableMaterials)
  const canViewPcMaterials = checkPermission(permissionRequests.canViewPcMaterials)

  const handleResize = () => {
    const width = window.innerWidth

    if (hideResolution != null) if (width < hideResolution) setMenuOpen(false)
  }

  React.useEffect(() => {
    window.addEventListener('resize', handleResize, false)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const dispatch = useDispatch()

  const anagraphicsMenuItems: (MenuItem | null)[] = [
    ...viewableAnagraphics.map(anagraphicSetup => {
      const hasLabels = Object.keys(anagraphicSetup).includes('typeLabels')

      return ({
        route: routes.mapAnagraphics(anagraphicSetup.anagraphicType),
        Icon: TableChartIcon,
        label: hasLabels ? anagraphicSetup.typeLabels[language] : undefined,
      })
    }),
  ].filter(Boolean)

  const menuItems: (MenuItem | null)[] = [
    canViewDashBoard
      ? {
        route: routes.dashboard,
        Icon: DashboardOutlinedIcon,
      }
      : null,
    canViewExplorer
      ? {
        route: routes.explorer,
        Icon: ExploreIcon,
      }
      : null,
    canCreateBooking
      ? {
        route: routes.newBookingRequest,
        Icon: InsertInvitationIcon,
      }
      : null,
    canViewCasesList && canViewCases
      ? {
        route: routes.cases,
        Icon: FolderOpenIcon,
      }
      : null,
    canViewPatients
      ? {
        route: routes.patientsList,
        Icon: PeopleAltOutlinedIcon,
      }
      : null,
    canAccessScheduling && canViewBookings
      ? {
        route: routes.defaultSchedule,
        Icon: TodayIcon,
      }
      : null,
    canViewAnesthesiologistsScheduling && canEditAnesthesiologistsScheduling
      ? {
        route: routes.defaultAnesthesiologistsSchedule,
        Icon: EventAvailableIcon,
      }
      : null,
    canViewOr
      ? {
        route: routes.orList,
        Icon: BedroomChildIcon,
      }
      : null,
    canViewUsers
      ? {
        route: routes.usersList,
        Icon: AccountCircleIcon,
      }
      : null,
    canViewRoles
      ? {
        route: routes.rolesList,
        Icon: SupervisorAccountIcon,
      }
      : null,
    canViewAuditTrails
      ? {
        route: routes.auditTrails,
        Icon: PatternIcon,
      }
      : null,
    canViewContracts && !hideContracts
      ? {
        route: routes.contractsList,
        Icon: TableRowsIcon,
      }
      : null,
    canEditSystemConfiguration
      ? {
        route: routes.systemConfiguration,
        Icon: SettingsIcon,
      }
      : null,
    canViewAnesthesiologistOPStandards
      ? {
        route: routes.anesthesiologistOPStandardList,
        Icon: HowToRegIcon,
      }
      : null,
    canViewLogs
      ? {
        route: routes.logManagement,
        Icon: MoreTimeIcon,
      }
      : null,
    canViewPcMaterials || canViewPrescribableMaterials
      ? {
        name: 'menuItem_/pcMaterials',
        route: routes.pcMaterialsBase,
        Icon: Summarize,
      }
      : null,
    anagraphicsMenuItems.length > 1
      ? {
        name: 'menuItem_/anagraphics',
        subMenuItems: anagraphicsMenuItems,
      }
      : null,
    anagraphicsMenuItems.length === 1 ? anagraphicsMenuItems[0] : null,
  ].filter(Boolean)

  const onClick = (menuItem: MenuItem | null) => {
    if (menuItem?.route) navigate(menuItem.route)
    if (menuItem?.name && menuItem?.subMenuItems && subMenuOpen !== menuItem?.name)
      setSubMenuOpen(menuItem.name)
    else if (menuItem?.name && subMenuOpen === menuItem?.name)
      setSubMenuOpen(null)
  }

  const toggleDrawer = () => {
    setMenuOpen(!menuOpen)
    dispatch({
      type: GLOBAL_ACTION.TOOGLE_DRAWER_STATUS,
    })
  }

  return (
    <>
      <IconButton
        aria-label='open drawer'
        onClick={toggleDrawer}
        edge='start'
        size='small'
        sx={{
          position: 'fixed',
          left: 55,
          transform: menuOpen ? 'translateX(184px)' : 'translateX(0px)',
          transition: 'transform 0.25s ease-in-out',
          top: 60,
          zIndex: 1300,
          borderRadius: '50%',
          border: theme => '1px solid' + theme.palette.primary.main,
          backgroundColor: 'white',
          '&:hover': {
            bgcolor: 'primary.light',
            opacity: 1,
          },
          height: 24,
          width: 24,
          opacity: 0.8,
        }}
      >
        {menuOpen ? <ChevronLeft /> : <ChevronRight />}
      </IconButton>
      <Drawer variant='permanent'
        open={menuOpen}
        sx={{ overflow: 'hidden', zIndex: 1201 }}>
        <Box
          sx={{ bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}
        >
          <img src={menuOpen ? logo : logoMini}
            style={{ height: '75%' }} />
        </Box>
        <List
          sx={{
            bgcolor: 'primary.main',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            pr: 0,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {menuItems.filter(Boolean).map((menuItem: MenuItem | null) => (
            <React.Fragment key={menuItem?.name || menuItem?.route}>
              <MenuButton
                menuItem={menuItem}
                onClick={onClick}
                pathname={pathname}
                menuOpen={menuOpen}
                subMenuOpen={subMenuOpen}
              />
              {subMenuOpen === menuItem?.name && (
                <List sx={{}}>
                  {menuItem?.subMenuItems?.map((subMenuItem: MenuItem | null) => (
                    <MenuButton
                      menuItem={subMenuItem}
                      onClick={onClick}
                      pathname={pathname}
                      menuOpen={menuOpen}
                      subMenuOpen={subMenuOpen}
                      key={subMenuItem?.route}
                    />
                  ))}
                </List>
              )}
            </React.Fragment>
          ))}
        </List>
      </Drawer>
    </>
  )
}

const MenuButton = ({
  menuItem,
  onClick,
  menuOpen,
  pathname,
  subMenuOpen,
}: {
  menuItem: MenuItem | null
  onClick: (menuItem: MenuItem | null) => void
  menuOpen: boolean
  pathname: string
  subMenuOpen?: string | null
}) => {
  const checkRoute = (route: string, pathname: string) => {
    return route.split('/').every((routePart, index) => {
      return routePart === pathname.split('/')[index]
    })
  }

  const selected = (menuItem?.route != null && checkRoute(menuItem?.route ?? '', pathname)) ||
    menuItem?.subMenuItems?.some(subMenuItem => checkRoute(subMenuItem?.route ?? '', pathname))

  const onClickButton = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    onClick(menuItem)
  }

  const isPrimary = menuOpen && (menuItem?.label ?? trlb(menuItem?.name ?? ('menuItem_' + menuItem?.route)))

  return (
    <ListItem disablePadding
      sx={{ display: 'block' }}>
      <ListItemButton
        onClick={onClickButton}
        sx={{
          minHeight: 48,
          justifyContent: menuOpen ? 'initial' : 'center',
          backgroundColor: theme => (selected ? theme.palette.primary.contrastText : 'inherit'),
          '&:hover': {
            backgroundColor: theme => (selected ? theme.palette.primary.contrastText : undefined),
          },
          px: 2.5,
          borderRadius: theme => theme.constants.radius,
          mx: menuOpen ? '8px' : '4px',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: menuOpen ? 3 : 0,
            justifyContent: 'center',
          }}
        >
          {menuItem?.Icon
            ? (
              <menuItem.Icon
                sx={{
                  fill: (theme: Theme) => (selected
                    ? theme.palette.primary.main
                    : theme.palette.primary.contrastText),
                }}
              />
            )
            : null}
          {menuItem?.subMenuItems && subMenuOpen === menuItem.name
            ? (
              <ExpandMoreIcon
                sx={{
                  fill: (theme: Theme) => (selected
                    ? theme.palette.primary.main
                    : theme.palette.primary.contrastText),
                }}
              />
            )
            : null}
          {menuItem?.subMenuItems && subMenuOpen !== menuItem.name
            ? (
              <ChevronRight
                sx={{
                  fill: (theme: Theme) => (selected
                    ? theme.palette.primary.main
                    : theme.palette.primary.contrastText),
                }}
              />
            )
            : null}
        </ListItemIcon>
        {menuOpen
          ? (
            <ListItemText
              primary={isPrimary}
              sx={{
                color: theme => (selected
                  ? theme.palette.primary.main
                  : theme.palette.primary.contrastText),
              }}
              primaryTypographyProps={{
                sx: {
                  fontSize: '0.875rem',
                },
                variant: 'h6',
              }}
            />
          )
          : null}
      </ListItemButton>
    </ListItem>
  )
}

export default MenuDrawer
