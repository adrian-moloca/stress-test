import { createTheme } from '@mui/material/styles'
import { ThemeProvider as MUIThemeProvider, CssBaseline, Theme } from '@mui/material'
import { CaseStatus } from '@smambu/lib.constants'
import React, { ReactNode } from 'react'

const fontTitle = '\'Poppins\', sans-serif'
const fontBody = '\'Abel\', sans-serif'
declare module '@mui/material/styles/createPalette' {
  export interface Palette {
    customColors: {
      [key: string]: string
    }
    panel: {
      main: string
    }
  }
  // allow configuration using `createTheme`
  export interface PaletteOptions {
    customColors?: {
      [key: string]: string
    }
    panel?: {
      main: string
    }
  }
}

declare module '@mui/material/styles/createTheme' {
  export interface Theme {
    constants: {
      radius: string
      boxShadow: string
      boxShadow2: string
      cardShadow: string
    }
  }
  // allow configuration using `createTheme`
  export interface ThemeOptions {
    constants?: {
      radius: string
      boxShadow: string
      boxShadow2: string
      cardShadow: string
    }
  }
}

let theme = createTheme({
  constants: {
    radius: '8px',
    boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24p',
    boxShadow2: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
    cardShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#3c5da7',
      light: '#f6f8f9',
      contrastText: '#fff',
    },
    secondary: {
      main: '#e7bb38',
      contrastText: '#fff',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
    panel: {
      main: 'rgb(246, 248, 249)',
    },
    customColors: {
      lightBackground: '#F0F3F5',

      [CaseStatus.PENDING]: '#fef1ce',
      [`${CaseStatus.PENDING}_border`]: '#a39162',

      [CaseStatus.LOCKED]: '#fef1ce',
      [`${CaseStatus.LOCKED}_border`]: '#a39162',

      [CaseStatus.ON_HOLD]: 'lightgrey',
      [`${CaseStatus.ON_HOLD}_border`]: 'grey',

      [CaseStatus.CHANGE_REQUESTED]: '#ffcbc1',
      [`${CaseStatus.CHANGE_REQUESTED}_border`]: '#e57373',

      [CaseStatus.CHANGE_NOTIFIED]: '#d4f0f0',
      [`${CaseStatus.CHANGE_NOTIFIED}_border`]: '#4a8f8f',

      [CaseStatus.CONFIRMED]: '#dbf6d3',
      [`${CaseStatus.CONFIRMED}_border`]: '#4a823c',
      [CaseStatus.PATIENT_ARRIVED]: '#dbf6d3',
      [`${CaseStatus.PATIENT_ARRIVED}_border`]: '#4a823c',

      [CaseStatus.IN_PRE_OP]: '#fab993',
      [`${CaseStatus.IN_PRE_OP}_border`]: '#b86a3d',
      [CaseStatus.READY_FOR_ANESTHESIA]: '#fab993',
      [`${CaseStatus.READY_FOR_ANESTHESIA}_border`]: '#b86a3d',

      [CaseStatus.IN_OR]: '#e0c8f7',
      [`${CaseStatus.IN_OR}_border`]: '#a564e3',
      [CaseStatus.READY_FOR_SURGERY]: '#e0c8f7',
      [`${CaseStatus.READY_FOR_SURGERY}_border`]: '#a564e3',
      [CaseStatus.IN_SURGERY]: '#e0c8f7',
      [`${CaseStatus.IN_SURGERY}_border`]: '#a564e3',
      [CaseStatus.FINISHED_SURGERY]: '#e0c8f7',
      [`${CaseStatus.FINISHED_SURGERY}_border`]: '#a564e3',
      [CaseStatus.IN_RECOVERY]: '#e0c8f7',
      [`${CaseStatus.IN_RECOVERY}_border`]: '#a564e3',
      [CaseStatus.LEFT_OR]: '#e0c8f7',
      [`${CaseStatus.LEFT_OR}_border`]: '#a564e3',

      [CaseStatus.IN_POST_OP]: '#a3e3e3',
      [`${CaseStatus.IN_POST_OP}_border`]: '#567a7a',
      [CaseStatus.READY_FOR_DISCHARGE]: '#a3e3e3',
      [`${CaseStatus.READY_FOR_DISCHARGE}_border`]: '#567a7a',

      caseProgressBar0: '#ff6f00',
      caseProgressBar1: '#7209b7',
      caseProgressBar2: '#1cad9c',

      divider: 'lightgrey',
      calendarHighlightSlot: 'lightyellow',
      calendarSelectedSlot: 'violet',
      defaultCaseColor: 'white',
      defaultCaseBorderColor: 'grey',
      hoveredTimeSlot: 'rgb(230, 230, 230)',
      availableTimeSlot: 'rgb(246, 248, 249)',
      unavailableTimeSlot: 'rgb(230, 230, 230)',
      mainSlots: 'rgb(181, 181, 181)',
      secondarySlots: 'rgb(230, 230, 230)',
    },
  },
  typography: {
    fontFamily: fontBody,
    subtitle: { color: 'gray', fontSize: '14px' },
    h6: { fontWeight: '600', fontFamily: fontTitle },
    h5: { fontFamily: fontTitle },
    h4: { fontFamily: fontTitle },
    h3: { fontFamily: fontTitle },
    h2: { fontFamily: fontTitle },
    h1: { fontFamily: fontTitle },
  },
} as any)

theme = createTheme(theme, {
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          padding: '6px 16px',
          backgroundColor: theme.palette.customColors.lightBackground,
          color: 'black',
          boxShadow: 'none',
          border: 'none',
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
            border: 'none',
            boxShadow: 'none',
          },
          borderRadius: '8px',
        },
        text: {
          padding: '10px',
          color: 'black',
        },
        contained: {
          borderRadius: '8px',
        },
      },
      defaultProps: {
        variant: 'outlined',
        disableElevation: true,
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fill: theme.palette.primary.main,
        },
      },
      variants: [
        {
          props: { variant: 'disabled' },
          style: {
            fill: 'gray',
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '16px',
          padding: '8px 4px',
          boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
          transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&:before': {
            display: 'none',
          },
          backgroundColor: 'rgba(255,255,255,0.9)',
          boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
          transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          '&.MuiPaper-root': {
            borderRadius: '16px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {},
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          lineHeight: '1.57143rem',
          fontSize: '0.875rem',
        },
      },
      defaultProps: {
        size: 'small',
      },
    },
    MuiList: {
      styleOverrides: {
        root: {},
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: '8px',
          fieldset: {
            borderColor: 'rgb(244,246,248)',
          },
          label: {
            color: 'red',
          },
          '& .MuiOutlinedInput-notchedOutline': {},
          '& .Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'black',
            },
          },
        },
        notchedOutline: {
          fontSize: '1rem',
        },
      },
      defaultProps: {
        size: 'small',
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: 'rgb(145, 158, 171)',
          fontSize: '1rem',
          lineHeight: '1.5rem',
          top: '-8px !important',
          '&.MuiInputLabel-shrink': {
            top: '0px !important',
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        root: {
          zIndex: 9999,
        },
      },
    },
    MuiPickerStaticWrapper: {
      styleOverrides: {
        content: {
          borderRadius: '18px',
        },
      },
    },
  },
} as any)

export const defaultStyles = {
  MenuProps: {
    PaperProps: {
      sx: {
        borderRadius: (theme: Theme) => theme.constants.radius,
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'transparent',
        boxShadow: (theme: Theme) => theme.constants.boxShadow2,
      },
    },
  },
  MenuItemSx: {
    mx: 1,
    borderRadius: (theme: Theme) => theme.constants.radius,
    '&:hover': {
      backgroundColor: (theme: Theme) => theme.palette.primary.main,
      color: (theme: Theme) => theme.palette.primary.contrastText,
      backdropFilter: 'blur(6px)',
    },
    '&.Mui-selected': {
      backgroundColor: (theme: Theme) => theme.palette.primary.light,
      color: 'black',
      fontWeight: 'bold',
      '&:hover': {
        backgroundColor: (theme: Theme) => theme.palette.primary.main,
        color: (theme: Theme) => theme.palette.primary.contrastText,
      },
    },
  },
  HorizontalTabsSx: { borderBottom: '1px solid rgb(238, 238, 238)', mx: -2 },
  VerticalTabsSx: { borderRight: '1px solid rgb(238, 238, 238)', height: '100%' },
}

// TODO find out why it was necessary to provide `children` as a generic argument, it should be injected by React.FC
export const ThemeProvider = ({ children }: { children: ReactNode | ReactNode[] }) => {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
