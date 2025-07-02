import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Filter, FiltersLocalStorage } from "./filter";

export interface FiltersState {
  data: { [id: string]: Filter };
}

const initialFiltersState: FiltersState = {
  data: _.keyBy(FiltersLocalStorage.filters.load(), "id"),
};

export const filtersSlice = createSlice({
  name: "filters",
  initialState: initialFiltersState,
  reducers: {
    createFilter: (state, action: PayloadAction<Filter>) => {
      if (action.payload.transient) {
        return;
      }
      state.data[action.payload.id] = action.payload;
      FiltersLocalStorage.filters.save(Object.values(state.data));
    },
    deleteFilter: (state, action: PayloadAction<string>) => {
      delete state.data[action.payload];
      FiltersLocalStorage.filters.save(Object.values(state.data));
    },
    ackMatchedByFilter(_state, _action: PayloadAction<string>) {
      // a hook for the logData slice
    },
  },
});

export const { createFilter, deleteFilter, ackMatchedByFilter } = filtersSlice.actions;

export default filtersSlice.reducer;

export const useFilters = () =>
  useSelector(createSelector([(state: RootState) => state.filters.data], (filters) => Object.values(filters)));
