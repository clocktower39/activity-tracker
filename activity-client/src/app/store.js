import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import goalsReducer from "../features/goals/goalsSlice";
import historyReducer from "../features/history/historySlice";
import uiReducer from "../features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    goals: goalsReducer,
    history: historyReducer,
    ui: uiReducer,
  },
});
