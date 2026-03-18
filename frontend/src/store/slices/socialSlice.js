import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFeed = createAsyncThunk('social/fetchFeed', async (params = {}) => {
  const { data } = await api.get('/social/feed', { params });
  return data.data.posts;
});

const socialSlice = createSlice({
  name: 'social',
  initialState: { feed:[], explore:[], loading:false, notifications:[], unreadCount:0 },
  reducers: {
    addPost:         (s, a) => { s.feed = [a.payload, ...s.feed]; },
    likePost:        (s, a) => {
      const post = s.feed.find(p => p._id === a.payload.postId);
      if (post) { post.isLiked = a.payload.liked; post.likesCount += a.payload.liked ? 1 : -1; }
    },
    addNotification: (s, a) => { s.notifications = [a.payload, ...s.notifications]; s.unreadCount++; },
    markNotifsRead:  (s) => { s.unreadCount = 0; },
  },
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending,   (s) => { s.loading = true; })
     .addCase(fetchFeed.fulfilled, (s, a) => { s.loading = false; s.feed = a.payload; });
  }
});

export const { addPost, likePost, addNotification, markNotifsRead } = socialSlice.actions;
export default socialSlice.reducer;
