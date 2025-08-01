import { Popover, List, ListItem, ListItemText } from '@mui/material'
import { defaultStyles } from 'ThemeProvider'
import { TextIconButton } from 'components/Buttons'
import React from 'react'
import { trlb } from 'utilities'

interface IMissingOption {
  value: string
  label: string
}
interface IMissingFiltersProp {
  value: string[]
  onConfirm: (value: string[]) => void
  options: IMissingOption[]
  openLabelKey: string
  applyLabelKey: string
}

const MissingFilters: React.FC<IMissingFiltersProp> = ({
  value,
  onConfirm,
  options,
  openLabelKey,
  applyLabelKey
}) => {
  const [tempValue, setTempValue] = React.useState<string[]>(value)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const onChange = (option: string) => {
    let newTempValue = [...tempValue]
    if (newTempValue.includes(option))
      newTempValue = tempValue.filter((selectedOption: string) => selectedOption !== option)
    else newTempValue = [...tempValue, option]

    setTempValue(newTempValue)
    onConfirm(newTempValue)
  }

  const onOpen = (e: any) => {
    setAnchorEl(e.currentTarget)
    setTempValue(value)
  }

  const onClose = () => {
    setAnchorEl(null)
    if (!tempValue.length) onConfirm(tempValue)
    else setTempValue(value)
  }

  return (
    <>
      <TextIconButton onClick={onOpen}
        disabled={!options.length}
        text={trlb(openLabelKey)}
        sx={{ flexShrink: 0 }} />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{ paper: { sx: { borderRadius: theme => theme.constants.radius, width: 250 } } }}
      >
        <TextIconButton onClick={onClose}
          disabled={!tempValue.length}
          fullWidth
          text={trlb(applyLabelKey)} />
        <List>
          {options.map(option => (
            <ListItem
              key={option.value}
              onClick={() => onChange(option.value)}
              sx={{
                ...defaultStyles.MenuItemSx,
                width: '94%',
                ...(tempValue.includes(option.value)
                  ? {
                    backgroundColor: theme => theme.palette.primary.light,
                    color: 'black',
                  }
                  : {}),
              }}
            >
              <ListItemText primary={trlb(option.label)} />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  )
}

export default MissingFilters
