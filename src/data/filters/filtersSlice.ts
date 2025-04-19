import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";
import { Filter, loadFiltersFromStorage, saveFiltersToStorage } from "./filter";
import _ from 'lodash';
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";


export interface FiltersState {
    data: { [id: string]: Filter }
}

const initialFiltersState: FiltersState = {
    data: _.keyBy(loadFiltersFromStorage(), 'id')
}

export const filtersSlice = createSlice({
    name: 'filters',
    initialState: initialFiltersState,
    reducers: {
        createFilter: (state, action: PayloadAction<Filter>) => {
            if (action.payload.transient) {
                return;
            }
            state.data[action.payload.id] = action.payload
            saveFiltersToStorage(Object.values(state.data))
        },
        deleteFilter: (state, action: PayloadAction<string>) => {
            delete state.data[action.payload]
            saveFiltersToStorage(Object.values(state.data))
        },
    },
})

export const {createFilter, deleteFilter} = filtersSlice.actions

export default filtersSlice.reducer

export const useFilters = () => 
    useSelector(createSelector([(state: RootState) => state.filters.data], (filters) => Object.values(filters)))