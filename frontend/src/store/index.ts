import { createStore, compose } from 'redux'
import { rootReducer, useAppSelector } from './reducers/rootReducer'

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const initialState = {}

const composedEnhancers = compose(composeEnhancers())

// enable only for development was a request.
const setupStore = (initialState: any) => {
  if (process.env.NODE_ENV === 'development') return createStore(rootReducer, initialState, composedEnhancers)
  // TODO: change to not deprecated
  else return createStore(rootReducer, initialState)
}

export default setupStore(initialState)
export { useAppSelector }
