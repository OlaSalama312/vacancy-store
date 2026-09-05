import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="wrap" style={{ padding: "60px 0" }}>...جاري التحميل</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;

  return children;
}
