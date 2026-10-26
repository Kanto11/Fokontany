import { Navigate, Outlet } from "react-router-dom";

export default function RouteProtegee({ type }) {
  const token = localStorage.getItem("access");
  const monType = localStorage.getItem("type");

  if (!token) return <Navigate to="/authentification" replace />;

  if (monType !== type) {
    return <Navigate to={monType === "RESPONSABLE" ? "/responsable" : "/habitant"} replace />;
  }
  return <Outlet />;
}