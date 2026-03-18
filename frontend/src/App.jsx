import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { fetchMe, selectIsAuth } from './store/slices/authSlice';
import { initSocket, disconnectSocket } from './services/socket';
import AppLayout from './components/Layout/AppLayout';
import LoadingScreen from './components/Common/LoadingScreen';
import './styles/global.css';

const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const Home       = lazy(() => import('./pages/Home'));
const Explore    = lazy(() => import('./pages/Explore'));
const Betting    = lazy(() => import('./pages/Betting'));
const BetDetail  = lazy(() => import('./pages/BetDetail'));
const Rooms      = lazy(() => import('./pages/Rooms'));
const RoomDetail = lazy(() => import('./pages/RoomDetail'));
const Profile    = lazy(() => import('./pages/Profile'));
const Wallet     = lazy(() => import('./pages/Wallet'));
const Messages   = lazy(() => import('./pages/Messages'));
const Settings   = lazy(() => import('./pages/Settings'));
const Leaderboard= lazy(() => import('./pages/Leaderboard'));
const GamingHub  = lazy(() => import('./pages/GamingHub'));
const GameDetail = lazy(() => import('./pages/GameDetail'));

function PrivateRoute({ children }) {
  const isAuth = useSelector(selectIsAuth);
  return isAuth ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const isAuth = useSelector(selectIsAuth);
  return !isAuth ? children : <Navigate to="/" replace />;
}

function AppInner() {
  const dispatch = useDispatch();
  const isAuth   = useSelector(selectIsAuth);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    dispatch(fetchMe()).finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (isAuth) { initSocket(); }
    else { disconnectSocket(); }
  }, [isAuth]);

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/"                  element={<Home />} />
          <Route path="/explore"           element={<Explore />} />
          <Route path="/betting"           element={<Betting />} />
          <Route path="/betting/:id"       element={<BetDetail />} />
          <Route path="/rooms"             element={<Rooms />} />
          <Route path="/rooms/:id"         element={<RoomDetail />} />
          <Route path="/wallet"            element={<Wallet />} />
          <Route path="/messages"          element={<Messages />} />
          <Route path="/messages/:id"      element={<Messages />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/leaderboard"       element={<Leaderboard />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/gaming"            element={<GamingHub />} />
          <Route path="/gaming/:gameId"    element={<GameDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppInner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#161616', color: '#F0F0F0', border: '1px solid #2A2A2A', borderRadius: '10px' },
            success: { iconTheme: { primary: '#00C853', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#CC0000', secondary: '#fff' } }
          }}
        />
      </Router>
    </Provider>
  );
                        }
        
