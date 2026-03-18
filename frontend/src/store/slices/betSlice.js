// ── BET SLICE ────────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBets = createAsyncThunk('bets/fetchBets', async (params = {}) => {
  const { data } = await api.get('/bets', { params });
  return data.data;
});

export const fetchMyBets = createAsyncThunk('bets/fetchMyBets', async (params = {}) => {
  const { data } = await api.get('/bets/my/history', { params });
  return data.data;
});

export const createBet = createAsyncThunk('bets/createBet', async (betData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/bets', betData);
    return data.data.bet;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create bet');
  }
});

export const acceptBet = createAsyncThunk('bets/acceptBet', async ({ betId, selection }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/bets/${betId}/accept`, { selection });
    return data.data.bet;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to accept bet');
  }
});

export const fetchLiveOdds = createAsyncThunk('bets/fetchLiveOdds', async (sport = 'soccer_epl') => {
  const { data } = await api.get('/bets/live/odds', { params: { sport } });
  return data.data.odds;
});

const betSlice = createSlice({
  name: 'bets',
  initialState: {
    publicBets:  [],
    myBets:      [],
    liveOdds:    [],
    selectedBet: null,
    loading:     false,
    error:       null,
    pagination:  { total: 0, page: 1 },
    filters:     { sport: '', type: '', status: 'open' }
  },
  reducers: {
    setFilters:  (s, a) => { s.filters = { ...s.filters, ...a.payload }; },
    setSelected: (s, a) => { s.selectedBet = a.payload; },
    updateBet:   (s, a) => {
      s.publicBets = s.publicBets.map(b => b.id === a.payload.id ? a.payload : b);
      s.myBets     = s.myBets.map(b => b.id === a.payload.id ? a.payload : b);
    },
    clearError:  (s) => { s.error = null; }
  },
  extraReducers: (b) => {
    b.addCase(fetchBets.pending,   (s) => { s.loading = true; })
     .addCase(fetchBets.fulfilled, (s, a) => {
       s.loading = false; s.publicBets = a.payload.bets; s.pagination = a.payload.pagination;
     })
     .addCase(fetchMyBets.fulfilled, (s, a) => { s.myBets = a.payload.bets; })
     .addCase(createBet.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(createBet.fulfilled, (s, a) => {
       s.loading = false; s.myBets = [a.payload, ...s.myBets];
     })
     .addCase(createBet.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchLiveOdds.fulfilled, (s, a) => { s.liveOdds = a.payload; });
  }
});

export const { setFilters, setSelected, updateBet, clearError: clearBetError } = betSlice.actions;
export default betSlice.reducer;
