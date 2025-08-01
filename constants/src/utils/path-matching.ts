export const pathMatchesPattern = (path: string, pattern: string): boolean => {
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
  const regex = new RegExp(`^${regexPattern}$`, 'i')
  return regex.test(path)
}
