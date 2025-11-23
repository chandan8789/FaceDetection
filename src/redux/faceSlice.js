// src/redux/faceSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  capturedImagePath: null,     // camera se aayi image path
  result: null,                // { success: boolean, score: number }
};

const faceSlice = createSlice({
  name: 'face',
  initialState,
  reducers: {
    setCapturedImagePath(state, action) {
      state.capturedImagePath = action.payload;
      state.result = null; // naya capture = purana result clear
    },
    setResult(state, action) {
      state.result = action.payload; // { success, score }
    },
    resetFaceState() {
      return initialState;
    },
  },
});

export const { setCapturedImagePath, setResult, resetFaceState } =
  faceSlice.actions;

export default faceSlice.reducer;
