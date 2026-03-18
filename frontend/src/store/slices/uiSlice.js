import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen:true, betModalOpen:false, depositModalOpen:false, activeModal:null },
  reducers: {
    toggleSidebar:     (s) => { s.sidebarOpen = !s.sidebarOpen; },
    openBetModal:      (s) => { s.betModalOpen = true; },
    closeBetModal:     (s) => { s.betModalOpen = false; },
    openDepositModal:  (s) => { s.depositModalOpen = true; },
    closeDepositModal: (s) => { s.depositModalOpen = false; },
    setActiveModal:    (s, a) => { s.activeModal = a.payload; },
    closeModal:        (s) => { s.activeModal = null; },
  }
});

export const { toggleSidebar, openBetModal, closeBetModal, openDepositModal, closeDepositModal, setActiveModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
