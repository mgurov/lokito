import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Source } from '../source';

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

export interface SourceFetchErr {
  sourceId: string;
  err: string;
}

interface PendingRange {
  from: string;
  at: string;
}

export interface SourceFetchingState {
  sourceId: string;
  sourceName: string;
  state: 'idle' | 'fetching' | 'ok' | 'error';
  from: string;
  lastSuccess: string | null;
  err: string | null;
  pendingRange: PendingRange | null;
}

interface OverallFetchingState {
  status: 'idle' | 'active';
  from: string | null; // where null means no fetch has yet been performed
}

export interface FetchingState {
  overallState: OverallFetchingState;
  sourcesState: { [sourceId: string]: SourceFetchingState };
}

const initialState: FetchingState = {
  overallState: {
    status: 'idle',
    from: null,
  },
  sourcesState: {},
};

export const fetchingSlice = createSlice({
  name: 'fetching',
  initialState,
  reducers: {
    startFetching: (state, action: PayloadAction<StartFetching>) => {
      state.overallState = {
        status: 'active',
        from: action.payload.from,
      };
    },
    stopFetching: (state) => {
      state.overallState.status = 'idle';
    },
    initSourceFetching: (state, action: PayloadAction<InitSourceFetching>) => {
      const source = action.payload.source;
      const newFetchingState: SourceFetchingState = {
        sourceId: source.id,
        sourceName: source.name,
        state: 'idle',
        from: action.payload.from,
        lastSuccess: null,
        pendingRange: null,
        err: null,
      };
      state.sourcesState[source.id] = newFetchingState;
    },
    removeSourceFetching: (state, action: PayloadAction<string>) => {
      delete state.sourcesState[action.payload]
    },
    startedSourceFetching: (state, action: PayloadAction<StartingSourceFetching>) => {
      const sourceState = state.sourcesState[action.payload.sourceId];
      if (!sourceState) {
        console.error('source state not found', action.payload);
        return;
      }
      sourceState.state = 'fetching';
      sourceState.pendingRange = action.payload.range;
    },
    sourceFetchedOk: (state, action: PayloadAction<string>) => {
      const sourceState = state.sourcesState[action.payload];
      if (!sourceState) {
        console.error('source state not found', action.payload);
        return;
      }
      sourceState.state = 'ok';
      sourceState.lastSuccess = sourceState.pendingRange?.at ?? null;
      sourceState.pendingRange = null;
      sourceState.err = null;
    },
    sourceFetchErr: (state, action: PayloadAction<SourceFetchErr>) => {
      const sourceState = state.sourcesState[action.payload.sourceId];
      if (!sourceState) {
        console.error('source state not found', action.payload);
        return;
      }
      sourceState.state = 'error';
      sourceState.pendingRange = null;
      sourceState.err = action.payload.err;
    },
  },
});

export const { startFetching, stopFetching } = fetchingSlice.actions;
export const fetchingActions = fetchingSlice.actions;

export default fetchingSlice.reducer;

export const useOverallFetchingState = () =>
  useSelector((state: RootState) => state.fetching.overallState);

export const useSourcesFetchingState = () =>
  useSelector((state: RootState) => state.fetching.sourcesState);
