import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { Source, SourceMutation, loadSourcesFromStorage, saveSourcesToStorage } from '../source';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { randomId } from '@/lib/utils';

export interface CreateNewSource {
  source: SourceMutation;
}

export interface ChangeSourceActive {
  sourceId: string;
  newValue: boolean;
}
export interface ChangeSourceColor {
  sourceId: string;
  newValue: string;
}

export interface SourcesState {
  data: { [id: string]: Source };
}

const initialState: SourcesState = {
  data: _.keyBy(loadSourcesFromStorage(), 'id'),
};

export const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {
    createNewSource: (state, action: PayloadAction<CreateNewSource>) => {
      const id = randomId();
      if (state.data[id]) {
        throw new Error(
          `A newly generated id ${id} already present in the store - what are the chances?! Try again or figure out what's going on.`,
        );
      }
      const createdAt = new Date().toISOString();
      const newSource: Source = {
        id,
        createdAt,
        lastUpdate: createdAt,
        active: true,
        ...action.payload.source,
      };
      state.data[id] = newSource;
      saveSourcesToStorage(Object.values(state.data)); //TODO: try to unify e.g. with redux-persist or something
    },
    deleteSource: (state, action: PayloadAction<string>) => {
      delete state.data[action.payload];
      saveSourcesToStorage(Object.values(state.data));
    },
    changeSourceActive: (state, action: PayloadAction<ChangeSourceActive>) => {
      state.data[action.payload.sourceId].active = action.payload.newValue;
      saveSourcesToStorage(Object.values(state.data));
    },
    changeSourceColor: (state, action: PayloadAction<ChangeSourceColor>) => {
      state.data[action.payload.sourceId].color = action.payload.newValue;
      saveSourcesToStorage(Object.values(state.data));
    },
    setAllSources: (state, action: PayloadAction<Source[]>) => {
      state.data = _.keyBy(action.payload, 'id');
      saveSourcesToStorage(Object.values(state.data));
    },
  },
});

export const { createNewSource, deleteSource, changeSourceActive, changeSourceColor, setAllSources } =
  sourcesSlice.actions;

export default sourcesSlice.reducer;

export const useSources = () =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) => Object.values(sources)),
  );

export const useActiveSources = () =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) =>
      Object.values(sources).filter((source) => source.active),
    ),
  );

export const useSource = (sourceId: string) =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) => sources[sourceId]),
  );
