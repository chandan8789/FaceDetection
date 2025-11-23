import { configureStore } from '@reduxjs/toolkit';
import faceReducer from './faceSlice';

export const store = configureStore({
  reducer: {
    face: faceReducer,
  },
});
