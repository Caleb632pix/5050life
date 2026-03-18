// ── WALLET SLICE ──────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWallet = createAsyncThunk('wallet/fetch', async () => {
  const { data } = await api.get('/wallet');
  return data.data;
});

export const initiateDeposit = createAsyncThunk('wallet/deposit', async (depositData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wallet/deposit', depositData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Deposit failed');
  }
});

export const initiateWithdrawal = createAsyncThunk('wallet/withdraw', async (withdrawData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wallet/withdraw', withdrawData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Withdrawal failed');
  }
});

export const transferFunds = createAsyncThunk('wallet/transfer', async (transferData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wallet/transfer', transferData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Transfer failed');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance:       0,
    escrowBalance: 0,
    currency:      'USD',
    stats:         {},
    transactions:  [],
    loading:       false,
    error:         null
  },
  reducers: {
    updateBalance: (s, a) => { s.balance = a.payload; },
    clearError:    (s) => { s.error = null; }
  },
  extraReducers: (b) => {
    b.addCase(fetchWallet.pending,   (s) => { s.loading = true; })
     .addCase(fetchWallet.fulfilled, (s, a) => {
       s.loading = false;
       s.balance       = a.payload.balance;
       s.escrowBalance = a.payload.escrowBalance;
       s.currency      = a.payload.currency;
       s.stats         = a.payload.stats;
       s.transactions  = a.payload.transactions;
     })
     .addCase(fetchWallet.rejected, (s) => { s.loading = false; })
     .addCase(initiateDeposit.rejected,   (s, a) => { s.error = a.payload; })
     .addCase(initiateWithdrawal.rejected,(s, a) => { s.error = a.payload; })
     .addCase(transferFunds.rejected,     (s, a) => { s.error = a.payload; });
  }
});

export const { updateBalance, clearError: clearWalletError } = walletSlice.actions;
export const selectWallet  = (state) => state.wallet;
export const selectBalance = (state) => state.wallet.balance;
export default walletSlice.reducer;

// ── SOCIAL SLICE ──────────────────────────────────────────────────────────────
export const socialSlice = (() => {
  const { createSlice: cs, createAsyncThunk: cat } = require('@reduxjs/toolkit');

  const fetchFeed = cat('social/fetchFeed', async (params = {}) => {
    const { data } = await api.get('/social/feed', { params });
    return data.data.posts;
  });

  const fetchExplore = cat('social/fetchExplore', async (params = {}) => {
    const { data } = await api.get('/social/explore', { params });
    return data.data.posts;
  });

  const createPost = cat('social/createPost', async (postData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/social/posts', postData);
      return data.data.post;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  });

  const slice = cs({
    name: 'social',
    initialState: {
      feed:        [],
      explore:     [],
      loading:     false,
      notifications: [],
      unreadCount:  0
    },
    reducers: {
      addPost:     (s, a) => { s.feed = [a.payload, ...s.feed]; },
      likePost:    (s, a) => {
        const post = s.feed.find(p => p._id === a.payload.postId);
        if (post) { post.isLiked = a.payload.liked; post.likesCount += a.payload.liked ? 1 : -1; }
      },
      addNotification:   (s, a) => { s.notifications = [a.payload, ...s.notifications]; s.unreadCount++; },
      markNotifsRead:    (s) => { s.unreadCount = 0; },
    },
    extraReducers: (b) => {
      b.addCase(fetchFeed.pending,    (s) => { s.loading = true; })
       .addCase(fetchFeed.fulfilled,  (s, a) => { s.loading = false; s.feed = a.payload; })
       .addCase(fetchExplore.fulfilled, (s, a) => { s.explore = a.payload; })
       .addCase(createPost.fulfilled, (s, a) => { s.feed = [a.payload, ...s.feed]; });
    }
  });

  return { ...slice, fetchFeed, fetchExplore, createPost };
})();

export const { addPost, likePost, addNotification, markNotifsRead } = socialSlice.actions;
export const { fetchFeed, fetchExplore, createPost } = socialSlice;
export const socialReducer = socialSlice.reducer;

// ── UI SLICE ──────────────────────────────────────────────────────────────────
export const uiSlice = (() => {
  const { createSlice: cs } = require('@reduxjs/toolkit');
  const slice = cs({
    name: 'ui',
    initialState: {
      theme:         'dark',
      sidebarOpen:   true,
      betModalOpen:  false,
      depositModalOpen: false,
      activeModal:   null,
      toasts:        []
    },
    reducers: {
      toggleSidebar:     (s) => { s.sidebarOpen = !s.sidebarOpen; },
      openBetModal:      (s) => { s.betModalOpen = true; },
      closeBetModal:     (s) => { s.betModalOpen = false; },
      openDepositModal:  (s) => { s.depositModalOpen = true; },
      closeDepositModal: (s) => { s.depositModalOpen = false; },
      setActiveModal:    (s, a) => { s.activeModal = a.payload; },
      closeModal:        (s) => { s.activeModal = null; },
      addToast:          (s, a) => { s.toasts = [...s.toasts, { id: Date.now(), ...a.payload }]; },
      removeToast:       (s, a) => { s.toasts = s.toasts.filter(t => t.id !== a.payload); }
    }
  });
  return slice;
})();

export const {
  toggleSidebar, openBetModal, closeBetModal,
  openDepositModal, closeDepositModal,
  setActiveModal, closeModal, addToast, removeToast
} = uiSlice.actions;

export const uiReducer   = uiSlice.reducer;
export const socialSliceReducer = socialReducer;
