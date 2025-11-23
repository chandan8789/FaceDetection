import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  capturedImagePath: null,
  result: null,
};

const faceSlice = createSlice({
  name: 'face',
  initialState,
  reducers: {
    setCapturedImagePath(state, action) {
      state.capturedImagePath = action.payload;
      state.result = null;
    },
    setResult(state, action) {
      state.result = action.payload;
    },
    resetFaceState() {
      return initialState;
    },
  },
});

export const { setCapturedImagePath, setResult, resetFaceState } =
  faceSlice.actions;

export default faceSlice.reducer;
