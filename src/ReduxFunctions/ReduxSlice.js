import { createSlice } from '@reduxjs/toolkit';

const initialConfigState = '';
const initialHospitalImageState = '';

const ConfigValuesSlice = createSlice({
  name: 'ConfigValuesSlice',
  initialState: initialConfigState,
  reducers: {
    setValue: (state, action) => action.payload,
    clearValue: () => initialConfigState,
  },
});

const HospitalImageSlice = createSlice({
  name: 'HospitalImageSlice',
  initialState: initialHospitalImageState,
  reducers: {
    setValue: (state, action) => action.payload,
    clearValue: () => initialHospitalImageState,
  },
});

// Export actions with clear names to avoid conflicts
export const { setValue: setConfigValue, clearValue: clearConfigValue } = ConfigValuesSlice.actions;
export const { setValue: setHospitalImage, clearValue: clearHospitalImage } = HospitalImageSlice.actions;

// Export reducers with clear names to avoid multiple default exports
export const ConfigValuesReducer = ConfigValuesSlice.reducer;
export const HospitalImageReducer = HospitalImageSlice.reducer;

