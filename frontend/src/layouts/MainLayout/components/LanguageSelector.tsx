import React from 'react'
import { Button, Typography, Menu, MenuItem } from '@mui/material'
import { getLanguage, setAppLanguage } from '../../../utilities/translator/translator'
import { LANG_ACTION } from 'store/actions'
import { useDispatch } from 'react-redux'
import { PREFERRED_LOCALE, TranslatorLanguage, TranslatorLanguages } from '@smambu/lib.constants'
import { setLocalStorageItem } from 'utilities'

const LanguageSelector = () => {
  const dispatch = useDispatch()

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const changeLanguage = (language: TranslatorLanguage) => {
    setAppLanguage(language)
    setLocalStorageItem(PREFERRED_LOCALE, language)
    dispatch({ type: LANG_ACTION.SET_LANG, payload: language })
    location.reload()
    handleClose()
  }

  return (
    <>
      <Button onClick={handleClick} sx={{ marginRight: '5%' }} variant='text'>
        <Typography sx={{ marginRight: '15%' }}>{getLanguage()}</Typography>
      </Button>
      <Menu id='language-menu' anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => changeLanguage(TranslatorLanguages.en)}>EN</MenuItem>
        <MenuItem onClick={() => changeLanguage(TranslatorLanguages.de)}>DE</MenuItem>
      </Menu>
    </>
  )
}

export default LanguageSelector
