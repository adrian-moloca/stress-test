export const getErrorMessage = (e: any) => {
  const message =
    e.response?.data?.message?.message ||
    e.response?.data?.stackTrace?.response?.stackTrace ||
    e.response?.data?.stackTrace ||
    e.response?.data?.message ||
    e.response?.stackTrace ||
    e.response?.data ||
    e.message ||
    ''
  return message
}
