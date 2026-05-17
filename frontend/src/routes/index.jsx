import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
}

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
    path: "/home/rides/:id/navigate",
    element: (
      <RequireAuth>
        <RideNavigationPage />
      </RequireAuth>
    ),
  },
  {
    path: "/home",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/request",
        element: (
          <RequireAuth>
            <RideRequestPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/available",
        element: (
          <RequireAuth>
            <AvailableRidesPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/scheduled",
        element: (
          <RequireAuth>
            <ScheduledRidesPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/history",
        element: (
          <RequireAuth>
            <RideHistoryPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/:id/waiting",
        element: (
          <RequireAuth>
            <RideWaitingPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/:id/preview",
        element: (
          <RequireAuth>
            <RideOpenDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/:id/active",
        element: (
          <RequireAuth>
            <RideInProgressPage />
          </RequireAuth>
        ),
      },
      {
        path: "rides/:id/summary",
        element: (
          <RequireAuth>
            <RideSummaryPage />
          </RequireAuth>
        ),
      },
      {
        path: "ride/in-progress",
        element: (
          <RequireAuth>
            <RideInProgressPage />
          </RequireAuth>
        ),
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
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
