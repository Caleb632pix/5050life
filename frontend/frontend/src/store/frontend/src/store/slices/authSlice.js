import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async thunks ─────────────────────────────────────────────────────────
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken',  data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch (e) {}
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
});

// ── Slice ────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:           null,
    accessToken:    localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading:        false,
    error:          null,
    registrationSuccess: false
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser:  (state, action) => { state.user = { ...state.user, ...action.payload }; }
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled,  (s, a) => {
        s.loading = false; s.user = a.payload.user;
        s.accessToken = a.payload.accessToken; s.isAuthenticated = true;
      })
      .addCase(login.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      // register
      .addCase(register.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled,(s) => { s.loading = false; s.registrationSuccess = true; })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      // fetchMe
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.isAuthenticated = true; })
      .addCase(fetchMe.rejected,  (s) => { s.user = null; s.isAuthenticated = false; s.accessToken = null; })
      // logout
      .addCase(logout.fulfilled, (s) => {
        s.user = null; s.accessToken = null; s.isAuthenticated = false;
      });
  }
});

export const { clearError, updateUser } = authSlice.actions;
export const selectUser    = (state) => state.auth.user;
export const selectIsAuth  = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export default authSlice.reducer;
  
