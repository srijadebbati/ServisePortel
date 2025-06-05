import { configureStore } from '@reduxjs/toolkit';

import { ConfigValuesReducer, HospitalImageReducer }  from './ReduxFunctions/ReduxSlice';

const store = configureStore({
  reducer: {
    configValues: ConfigValuesReducer,
    hospitalImage: HospitalImageReducer
  },
});

export default store;
