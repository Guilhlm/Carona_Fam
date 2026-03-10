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
        path: "rides/history",
        element: (
          <RequireAuth>
            <RideHistoryPage />
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
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
