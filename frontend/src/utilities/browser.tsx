// Some browser (ad es. Safari) does not support localStorage and throws an error.

export const getLocalStorageItem = (key: string) => {
  try {
    const item = localStorage.getItem(key)
    return item
  } catch (e) {
    console.error(e)
    return null
  }
}

export const setLocalStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.error(e)
  }
}
