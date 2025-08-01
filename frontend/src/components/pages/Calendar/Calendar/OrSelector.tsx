import { CheckBox, CheckBoxOutlineBlank, MoreHoriz } from '@mui/icons-material'
import {
  Box,
  Checkbox,
  ClickAwayListener,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material'
import { OrtabItem } from 'hooks'
import React from 'react'
import { trlb } from 'utilities'

const OrPill = ({
  orTab,
  isSelected,
  onClick,
  setWidth,
  index,
  isVisible,
}: {
  orTab: OrtabItem
  isSelected?: boolean
  onClick: (id: string) => void
  setWidth: (index: number, width: number) => void
  index: number
  isVisible: boolean
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      const current = ref.current
      setWidth(index, current.offsetWidth + 5)
    }
  }, [index, isSelected])

  return (
    <Box
      ref={ref}
      sx={{
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isSelected ? 'primary.main' : 'primary.light',
        color: isSelected ? 'primary.contrastText' : 'primary.main',
        borderRadius: 4,
        cursor: 'pointer',
        px: 1,
        visibility: isVisible ? 'visible' : 'hidden',
        maxWidth: 100,
      }}
      onClick={() => onClick(orTab.operatingRoomId)}
    >
      <Typography variant='body2' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {orTab.name}
      </Typography>
    </Box>
  )
}

const OrAutocomplete = ({
  orIds,
  setOrIds,
  orTabList,
  notVisibleOrTabsNumber,
}: {
  orIds: string[]
  setOrIds: (input: string[]) => void
  orTabList: OrtabItem[]
  notVisibleOrTabsNumber: number
}) => {
  const [inputValue, setInputValue] = React.useState('')
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const filteredOrTabs = orTabList
    .filter(or => or.name.toLowerCase().includes(inputValue.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            p: 0,
            position: 'absolute',
            right: 0,
            bgcolor: 'panel.main',
          }}
          onClick={e => setAnchorEl(e.currentTarget)}
        >
          {notVisibleOrTabsNumber > 0
            ? (
              <Typography sx={{ pr: 0.2 }} variant='body2'>{`+${notVisibleOrTabsNumber}`}</Typography>
            )
            : null}
          <MoreHoriz />
        </Box>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: { sx: { maxHeight: '75vh', p: 1, display: 'flex', flexDirection: 'column', width: 200 } },
          }}
        >
          <TextField
            label={trlb('calendar_or_search')}
            value={inputValue}
            onChange={event => setInputValue(event.target.value.toLowerCase())}
            autoFocus
            fullWidth
            variant='standard'
          />
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {filteredOrTabs.map(or => (
              <Box
                key={or.operatingRoomId}
                onClick={() => setOrIds([or.operatingRoomId])}
                sx={{
                  width: 180,
                  display: 'flex',
                  alignItems: 'center',
                  py: 0.5,
                  cursor: 'pointer',
                }}
              >
                <Checkbox checked={orIds.includes(or.operatingRoomId)} />
                <Typography
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  variant='body2'
                >
                  {or.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Popover>
      </>
    </ClickAwayListener>
  )
}

const OrSelector = ({
  orIds,
  setOrIds,
  orTabList,
}: {
  orIds: string[]
  setOrIds: (input: string[]) => void
  orTabList: OrtabItem[]
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [widths, setWidths] = React.useState<Record<number, number>>({})
  const [containerWidth, setContainerWidth] = React.useState(0)

  React.useEffect(() => {
    setTimeout(() => {
      setContainerWidth(containerRef.current?.offsetWidth ?? 0)
    }, 100)
  })

  const allChecked = orIds.length === orTabList.length
  const getAllIcon = () => {
    if (allChecked) return <CheckBox />
    else return <CheckBoxOutlineBlank />
  }

  const onClick = (id: string) => {
    if (orIds.includes(id)) setOrIds(orIds.filter(orId => orId !== id))
    else setOrIds([...orIds, id])
  }

  const setWidth = (index: number, width: number) => {
    setWidths(widths => ({ ...widths, [index]: width }))
  }

  const onAllClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation()
    e.preventDefault()
    if (allChecked) setOrIds([])
    else setOrIds(orTabList.map(tab => tab.operatingRoomId))
  }

  const filteredOrTabs = React.useMemo(() => {
    const calcIsVisible = (index: number) => {
      if (!containerWidth) return true
      const totalWidthBefore = Object.entries(widths)
        .filter(([key]) => Number(key) < index)
        .reduce((acc, [, width]) => acc + width, 0)
      return totalWidthBefore < containerWidth - 180
    }

    return orTabList
      // XXX we should discuss if this is fine or not
      // eslint-disable-next-line etc/no-assign-mutated-array
      .sort((a, b) => {
        if (orIds.includes(a.operatingRoomId) && !orIds.includes(b.operatingRoomId)) return -1
        if (!orIds.includes(a.operatingRoomId) && orIds.includes(b.operatingRoomId)) return 1
        return a.name.localeCompare(b.name)
      })
      .map((tab, index) => ({
        ...tab,
        isSelected: orIds.includes(tab.operatingRoomId),
        isVisible: calcIsVisible(index),
      }))
  }, [orIds, orTabList, containerWidth, widths])
  const notVisibleOrTabsNumber = filteredOrTabs.filter(tab => !tab.isVisible).length

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        bgcolor: 'panel.main',
        my: 1,
        px: 1,
        py: 0.5,
        display: 'flex',
        flexDirection: 'row',
        gap: 0.5,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <IconButton onClick={onAllClick} size='small' sx={{ p: 0 }}>
        {getAllIcon()}
        <Typography variant='body2'>{trlb('calendar_or_all')}</Typography>
      </IconButton>
      {filteredOrTabs.map((orTab, index) => (
        <OrPill
          key={orTab.operatingRoomId}
          orTab={orTab}
          onClick={onClick}
          setWidth={setWidth}
          index={index}
          isSelected={orTab.isSelected}
          isVisible={orTab.isVisible}
        />
      ))}
      <OrAutocomplete
        orIds={orIds}
        setOrIds={setOrIds}
        orTabList={orTabList}
        notVisibleOrTabsNumber={notVisibleOrTabsNumber}
      />
    </Box>
  )
}

export default OrSelector
