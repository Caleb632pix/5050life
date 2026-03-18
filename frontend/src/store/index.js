import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import betReducer from './slices/betSlice';
import walletReducer from './slices/walletSlice';
import socialReducer from './slices/socialSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bets: betReducer,
    wallet: walletReducer,
    social: socialReducer,
    ui: uiReducer
  }
});

export default store;
