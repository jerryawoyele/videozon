import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerificationPending from './pages/auth/VerificationPending';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import CreateEventPage from './pages/events/CreateEventPage';
import EventDetailsPage from './pages/events/EventDetailsPage';
import MessagesPage from './pages/messages/MessagesPage';
import MessageDetailPage from './pages/messages/MessageDetailPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import GigsPage from './pages/gigs/GigsPage';
import GigPreviewPage from './pages/gigs/GigPreviewPage';
import ProfessionalsPage from './pages/professionals/ProfessionalsPage';
import ProfessionalProfilePage from './pages/professionals/ProfessionalProfilePage';
import HireProfessionalPage from './pages/hire/HireProfessionalPage';
import PaymentPage from './pages/payments/PaymentPage';

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }} 
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verification-pending" element={<VerificationPending />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        
        {/* Events Routes */}
        <Route path="/events" element={
          <PrivateRoute>
            <EventsPage />
          </PrivateRoute>
        } />
        <Route path="/events/create" element={
          <PrivateRoute>
            <CreateEventPage />
          </PrivateRoute>
        } />
        <Route path="/events/:id" element={
          <PrivateRoute>
            <EventDetailsPage />
          </PrivateRoute>
        } />

        {/* Messages Routes */}
        <Route path="/messages" element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        } />
        <Route path="/messages/:id" element={
          <PrivateRoute>
            <MessageDetailPage />
          </PrivateRoute>
        } />
        <Route path="/hire/:id" element={<HireProfessionalPage />} />

        {/* Professional Routes */}
        <Route path="/professionals" element={
          <PrivateRoute>
            <ProfessionalsPage />
          </PrivateRoute>
        } />
        <Route path="/professionals/:id" element={
          <PrivateRoute>
            <ProfessionalProfilePage />
          </PrivateRoute>
        } />

        {/* My gigs Routes */}
        <Route path="/gigs" element={
          <PrivateRoute>
            <GigsPage />
          </PrivateRoute>
        } />

        <Route path="/gigs/:id/preview" element={
          <PrivateRoute>
            <GigPreviewPage />
          </PrivateRoute>
        } />

        <Route path="/payments/:gigId" element={
          <PrivateRoute>
            <PaymentPage />
          </PrivateRoute>
        } />

        {/* User Routes */}
        <Route path="/profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />
        <Route path="/gigs" element={
          <PrivateRoute>
            <GigsPage />
          </PrivateRoute>
        } />
        <Route path="/notifications" element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />

        {/* Catch all route - redirect to events or login based on auth status */}
        <Route path="*" element={
          <PrivateRoute>
            <Navigate to="/dashboard" replace />
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;

