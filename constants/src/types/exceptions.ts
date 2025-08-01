export class AxiosCancellationError extends Error {
  constructor () {
    super()
    this.name = 'AxiosCancellationError'
  }
}

export interface IGenericError {
  message?: string
}
