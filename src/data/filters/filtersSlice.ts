import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";
import { Filter, loadSourcesFromStorage, saveSourcesToStorage } from "./filter";
import _ from 'lodash';
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";


export interface FiltersState {
    data: { [id: string]: Filter }
}

const initialFiltersState: FiltersState = {
    data: _.keyBy(loadSourcesFromStorage(), 'id')
}

export const filtersSlice = createSlice({
    name: 'filters',
    initialState: initialFiltersState,
    reducers: {
        createFilter: (state, action: PayloadAction<Filter>) => {
            state.data[action.payload.id] = action.payload
            saveSourcesToStorage(Object.values(state.data))
        },
        deleteFilter: (state, action: PayloadAction<string>) => {
            delete state.data[action.payload]
            saveSourcesToStorage(Object.values(state.data))
        },
    },
})

export const {createFilter} = filtersSlice.actions

export default filtersSlice.reducer

export const useFilters = () => 
    useSelector(createSelector([(state: RootState) => state.filters.data], (filters) => Object.values(filters)))