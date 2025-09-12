import { randomId } from "@/lib/utils";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSelector } from "react-redux";
import { Source, SourceLocalStorage, SourceMutation } from "../source";
import { RootState } from "./store";

export interface CreateNewSource {
  source: SourceMutation;
}

export type ChangeSourceProperty = {
  sourceId: string;
} & SourcePropertyChange;

type SourcePropertyChange =
  | { property: "color"; newValue: string }
  | { property: "datasource"; newValue: string }
  | { property: "query"; newValue: string }
  | { property: "active"; newValue: boolean };

export interface SourcesState {
  data: { [id: string]: Source };
}

const initialState: SourcesState = {
  data: _.keyBy(SourceLocalStorage.sources.load(), "id"),
};

export const sourcesSlice = createSlice({
  name: "sources",
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
      SourceLocalStorage.sources.save(Object.values(state.data));
    },
    deleteSource: (state, action: PayloadAction<string>) => {
      delete state.data[action.payload];
      SourceLocalStorage.sources.save(Object.values(state.data));
    },
    changeSourceProperty: (state, { payload }: PayloadAction<ChangeSourceProperty>) => {
      const source = state.data[payload.sourceId];
      switch (payload.property) {
        case "active":
          source.active = payload.newValue;
          break;
        default:
          source[payload.property] = payload.newValue;
          break;
      }
      SourceLocalStorage.sources.save(Object.values(state.data));
    },
    setAllSources: (state, action: PayloadAction<Source[]>) => {
      state.data = _.keyBy(action.payload, "id");
      SourceLocalStorage.sources.save(Object.values(state.data));
    },
  },
});

export const {
  createNewSource,
  deleteSource,
  changeSourceProperty,
  setAllSources,
} = sourcesSlice.actions;

export default sourcesSlice.reducer;

export const useSources = () =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) => Object.values(sources)),
  );

export const useActiveSources = () =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) =>
      Object.values(sources).filter((source) => source.active)),
  );

export const useActiveSourceIds = () =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) =>
      Object.values(sources).filter((source) => source.active).map((source) => source.id)),
  );

export const useSource = (sourceId: string) =>
  useSelector(
    createSelector([(state: RootState) => state.sources.data], (sources) => sources[sourceId]),
  );
