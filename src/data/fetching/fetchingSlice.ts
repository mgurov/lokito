import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError, isAxiosError } from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Source, SourceLocalStorage } from "../source";

export const START_WHERE_STOPPED = "START_WHERE_STOPPED";
export const NORMAL_DELAY_BEFORE_REFRESH_SEC = 60;

export interface StartFetching {
  from: string;
}

export interface InitSourceFetching {
  source: Source;
  from: string;
}

export interface StartingSourceFetching {
  sourceId: string;
  range: PendingRange;
}

export interface SourceFetchOk {
  sourceId: string;
  from: string;
}

export interface SourceFetchErr {
  sourceId: string;
  error: Error;
}

interface PendingRange {
  from: string;
  at: string;
}

export interface SourceFetchingState {
  sourceId: string;
  sourceName: string;
  state: "idle" | "fetching" | "ok" | "error";
  from: string;
  lastSuccess: string | null;
  error: Error | null;
  successiveErrorCount: number;
  pendingRange: PendingRange | null;
}

interface OverallFetchingState {
  status: "idle" | "active";
  fetchCycle: number;
  nextFetchInSecs: number;
  from: string | null; // where null means no fetch has yet been performed
  errorFetchToMuch: string | null;
}

export interface FetchingState {
  overallState: OverallFetchingState;
  sourcesState: { [sourceId: string]: SourceFetchingState };
}

const initialState: FetchingState = {
  overallState: {
    status: "idle",
    fetchCycle: 0,
    nextFetchInSecs: 0,
    from: null,
    errorFetchToMuch: null,
  },
  sourcesState: {},
};

export const fetchingSlice = createSlice({
  name: "fetching",
  initialState,
  reducers: {
    startFetching: (state, action: PayloadAction<StartFetching>) => {
      state.overallState = {
        status: "active",
        from: action.payload.from,
        fetchCycle: state.overallState.fetchCycle + 1,
        nextFetchInSecs: 0,
        errorFetchToMuch: null,
      };
    },
    stopFetching: (state) => {
      state.overallState.status = "idle";
    },
    initSourceFetching: (state, action: PayloadAction<InitSourceFetching>) => {
      const source = action.payload.source;
      const newFetchingState: SourceFetchingState = {
        sourceId: source.id,
        sourceName: source.name,
        state: "idle",
        from: action.payload.from,
        lastSuccess: null,
        pendingRange: null,
        error: null,
        successiveErrorCount: 0,
      };
      state.sourcesState[source.id] = newFetchingState;
    },
    removeSourceFetching: (state, action: PayloadAction<string>) => {
      delete state.sourcesState[action.payload];
    },
    startedSourceFetching: (state, action: PayloadAction<StartingSourceFetching>) => {
      const sourceState = state.sourcesState[action.payload.sourceId];
      if (!sourceState) {
        console.error("source state not found", action.payload);
        return;
      }
      sourceState.state = "fetching";
      sourceState.pendingRange = action.payload.range;
    },
    sourceFetchedOk: (state, action: PayloadAction<SourceFetchOk>) => {
      const { sourceId, from } = action.payload;
      const sourceState = state.sourcesState[sourceId];
      if (!sourceState) {
        console.error("source state not found", sourceId);
        return;
      }
      sourceState.state = "ok";
      const lastSuccess = sourceState.pendingRange?.at ?? null;
      sourceState.lastSuccess = lastSuccess;
      sourceState.pendingRange = null;
      sourceState.successiveErrorCount = 0;
      sourceState.error = null;
      SourceLocalStorage.lastSuccessFrom.save(sourceId, from);
    },
    sourceFetchErr: (state, action: PayloadAction<SourceFetchErr>) => {
      const sourceState = state.sourcesState[action.payload.sourceId];
      if (!sourceState) {
        console.error("source state not found", action.payload);
        return;
      }
      sourceState.state = "error";
      sourceState.pendingRange = null;
      sourceState.successiveErrorCount += 1;
      sourceState.error = action.payload.error;
      if (isAxiosError(action.payload.error)) {
        const errorBody = (action.payload.error as AxiosError).response?.data;
        if (typeof errorBody === "string" && errorBody?.indexOf("the query time range exceeds the limit") != -1) {
          state.overallState.errorFetchToMuch = errorBody;
        }
      }
    },
    incrementFetchCycle: (state) => {
      state.overallState.fetchCycle += 1;
    },
    fetchNow: (state) => {
      state.overallState.nextFetchInSecs = 0;
    },
    scheduleFetch: (state, action: PayloadAction<{ seconds: number }>) => {
      state.overallState.nextFetchInSecs = action.payload.seconds;
    },
  },
});

export const { startFetching, stopFetching, incrementFetchCycle } = fetchingSlice.actions;
export const fetchingActions = fetchingSlice.actions;

export default fetchingSlice.reducer;

export const useOverallFetchingState = () => useSelector((state: RootState) => state.fetching.overallState);

export const useSecondsTillRefresh = () =>
  useSelector((state: RootState) => state.fetching.overallState.nextFetchInSecs);

export const useOverallFetchingStateStatus = () =>
  useSelector((state: RootState) => state.fetching.overallState.status);

export const useSourcesFetchingState = () => useSelector((state: RootState) => state.fetching.sourcesState);

export const useIsLastFetchCycle = (fetchCycle: number) =>
  useSelector((state: RootState) => state.fetching.overallState.fetchCycle === fetchCycle);

export const useShouldWarnFetchingFailures = () =>
  useSelector(
    (state: RootState) => {
      return undefined != Object.values(state.fetching.sourcesState)
        .find(s => (s.lastSuccess === null && s.successiveErrorCount == 1) || s.successiveErrorCount > 1);
    },
  );
