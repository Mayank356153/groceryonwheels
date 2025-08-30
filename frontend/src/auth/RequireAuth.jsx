import { Navigate, useLocation, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const token = localStorage.getItem("token");
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/" replace state={{ from: loc }} />;
  }
  return <Outlet />; // <-- critical
}
