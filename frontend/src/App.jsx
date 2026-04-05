import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import Navbar from './components/common/Navbar';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
import PublicTripsPage from './pages/PublicTripsPage';
import PublicTripDetailPage from './pages/PublicTripDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import { Box } from '@mui/material';
import { flushTrackingQueue } from './utils/mapsUsageTracker';
import { isAuthenticated } from './store/authStore';

const App = () => {
  // 인증된 사용자 진입 시 미전송 추적 큐 플러시
  useEffect(() => {
    if (isAuthenticated()) flushTrackingQueue();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/trips" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/explore" element={<PublicTripsPage />} />
          <Route path="/explore/:id" element={<PublicTripDetailPage />} />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <TripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <TripDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;
