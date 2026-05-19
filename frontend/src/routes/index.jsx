import { Navigate } from 'react-router-dom';
import ProtectedAuthUser from '../components/ProtectedAuthUser';
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import HomePage from "../pages/HomePage";
import AuthLoginPage from "../pages/AuthLoginPage";
import AuthRegisterPage from "../pages/AuthRegisterPage";
import AuthForgotPasswordPage from "../pages/AuthForgotPasswordPage";
import ProfilePage from "../pages/ProfilePage";
import RideHistoryPage from "../pages/RideHistoryPage";
import RideInProgressPage from "../pages/RideInProgressPage";
import RideRequestPage from "../pages/RideRequestPage";
import RideWaitingPage from "../pages/RideWaitingPage";
import RideOpenDetailPage from "../pages/RideOpenDetailPage";
import RideSummaryPage from "../pages/RideSummaryPage";
import RideNavigationPage from "../pages/RideNavigationPage";
import AvailableRidesPage from "../pages/AvailableRidesPage";
import ScheduledRidesPage from "../pages/ScheduledRidesPage";

import MapTestPage from "../pages/Test/MapTest";

export default [
  {
    path: "/",
    element: <AuthLoginPage />,
  },
  {
    path: "/register",
    element: <AuthRegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <AuthForgotPasswordPage />,
  },
  {
    path: "/home",
    element: (
      <ProtectedAuthUser>
        <MainLayout />
      </ProtectedAuthUser>
    ),
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "rides/:id/navigate",
        element: <RideNavigationPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "rides/request",
        element: <RideRequestPage />,
      },
      {
        path: "rides/available",
        element: <AvailableRidesPage />,
      },
      {
        path: "rides/scheduled",
        element: <ScheduledRidesPage />,
      },
      {
        path: "rides/history",
        element: <RideHistoryPage />,
      },
      {
        path: "rides/:id/waiting",
        element: <RideWaitingPage />,
      },
      {
        path: "rides/:id/preview",
        element: <RideOpenDetailPage />,
      },
      {
        path: "rides/:id/active",
        element: <RideInProgressPage />,
      },
      {
        path: "rides/:id/summary",
        element: <RideSummaryPage />,
      },
      {
        path: "ride/in-progress",
        element: <RideInProgressPage />,
      },
    ],
  },
  {
    path: "/MapTest",
    element: <MapTestPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedAuthUser adminOnly>
        <AdminLayout />
      </ProtectedAuthUser>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
