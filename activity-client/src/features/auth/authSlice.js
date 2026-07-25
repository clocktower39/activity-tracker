import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, tokens } from "../../app/api";

const stored = () => {
  try {
    return JSON.parse(localStorage.getItem("activity.user") || "null");
  } catch {
    return null;
  }
};

const persist = (user) => {
  if (user) localStorage.setItem("activity.user", JSON.stringify(user));
  else localStorage.removeItem("activity.user");
};

export const signIn = createAsyncThunk("auth/signIn", async ({ email, password }) => {
  const data = await api.login(email, password);
  tokens.set(data);
  persist(data.user);
  return data.user;
});

export const signUp = createAsyncThunk("auth/signUp", async (payload) => {
  const data = await api.signup(payload);
  tokens.set(data);
  persist(data.user);
  return data.user;
});

/** Confirms a stored session is still valid on app start. */
export const restoreSession = createAsyncThunk("auth/restore", async () => {
  if (!tokens.refresh() && !tokens.access()) throw new Error("No stored session");
  const { user } = await api.me();
  persist(user);
  return user;
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (patch) => {
  const { user } = await api.updateProfile(patch);
  persist(user);
  return user;
});

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }) => {
    const data = await api.changePassword(currentPassword, newPassword);
    tokens.set(data);
    persist(data.user);
    return data.user;
  }
);

const initialState = {
  user: stored(),
  // "idle" until restoreSession settles, so the app can tell "not signed in"
  // from "we haven't checked yet" and avoid flashing the login screen.
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedOut(state) {
      tokens.clear();
      persist(null);
      state.user = null;
      state.status = "unauthenticated";
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = "restoring";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        tokens.clear();
        persist(null);
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    for (const thunk of [signIn, signUp]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = "submitting";
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.user = action.payload;
          state.status = "authenticated";
          state.error = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = "unauthenticated";
          state.error = action.error?.message || "Sign in failed";
        });
    }
  },
});

export const { signedOut, clearError } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
