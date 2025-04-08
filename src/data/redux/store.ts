import { configureStore } from '@reduxjs/toolkit'
import logDataReducer from '../logData/logDataSlice'
import sourcesReducer from './sourcesSlice'
import fetchingReducer from '../fetching/fetchingSlice'
import fetchingMiddleware from '../fetching/fetchingMiddleware'
import filtersMiddleware from '../filters/filtersSlice'

export const store = configureStore({
  reducer: {
    logData: logDataReducer,
    sources: sourcesReducer,
    fetching: fetchingReducer,
    filters: filtersMiddleware,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(fetchingMiddleware.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch