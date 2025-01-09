import { createBrowserRouter } from 'react-router-dom';
import SignUp from '../pages/auth/SignUp';
import Login from '../pages/auth/Login';
import VerificationPending from '../pages/auth/VerificationPending';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import EventsPage from '../pages/events/EventsPage';
import EventDetailsPage from '../pages/events/EventDetailsPage';
import CreateEventPage from '../pages/events/CreateEventPage';
import ProfessionalsPage from '../pages/professionals/ProfessionalsPage';
import ProfessionalProfilePage from '../pages/professionals/ProfessionalProfilePage';
import MessagesPage from '../pages/messages/MessagesPage';  
import MessageDetailPage from '../pages/messages/MessageDetailPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import GigsPage from '../pages/gigs/GigsPage';
import GigPreviewPage from '../pages/gigs/GigPreviewPage';
import PaymentPage from '../pages/payments/PaymentPage';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/dashboard',
        element: <PrivateRoute><DashboardPage /></PrivateRoute>
      },
      {
        path: '/profile',
        element: <PrivateRoute><ProfilePage /></PrivateRoute>
      },
      {
        path: '/settings',
        element: <PrivateRoute><SettingsPage /></PrivateRoute>
      },
      {
        path: '/events',
        element: <PrivateRoute><EventsPage /></PrivateRoute>
      },
      {
        path: '/events/create',
        element: <PrivateRoute><CreateEventPage /></PrivateRoute>
      },
      {
        path: '/events/:id',
        element: <PrivateRoute><EventDetailsPage /></PrivateRoute>
      },
      {
        path: '/gigs',
        element: <PrivateRoute><GigsPage /></PrivateRoute>
      },
      {
        path: '/gigs/:id/preview',
        element: <PrivateRoute><GigPreviewPage /></PrivateRoute>
      },
      {
        path: '/payments/:gigId',
        element: <PrivateRoute><PaymentPage /></PrivateRoute>
      },
      {
        path: '/professionals',
        element: <PrivateRoute><ProfessionalsPage /></PrivateRoute>
      },
      {
        path: '/professionals/:id',
        element: <PrivateRoute><ProfessionalProfilePage /></PrivateRoute>
      },
      {
        path: '/messages',
        element: <PrivateRoute><MessagesPage /></PrivateRoute>
      },
      {
        path: '/messages/:id',
        element: <PrivateRoute><MessageDetailPage /></PrivateRoute>
      },
      {
        path: '/notifications',
        element: <PrivateRoute><NotificationsPage /></PrivateRoute>
      }
    ]
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/verification-pending',
    element: <VerificationPending />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  }
]);
