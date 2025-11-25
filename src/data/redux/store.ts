import { configureStore } from "@reduxjs/toolkit";
import fetchingMiddleware from "../fetching/fetchingMiddleware";
import fetchingReducer from "../fetching/fetchingSlice";
import filtersMiddleware from "../filters/filtersSlice";
import ackPersistingMiddleware from "../logData/ackPersistingMiddleware";
import logDataReducer from "../logData/logDataSlice";
import sourcesReducer from "./sourcesSlice";

export const store = configureStore({
  reducer: {
    logData: logDataReducer,
    sources: sourcesReducer,
    fetching: fetchingReducer,
    filters: filtersMiddleware,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).prepend(
      fetchingMiddleware.middleware,
      ackPersistingMiddleware.middleware,
    ),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
