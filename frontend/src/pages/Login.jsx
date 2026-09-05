import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const role = await login(email, password);
      const next = params.get("next");
      navigate(next || (role === "Admin" ? "/admin" : "/"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap auth-page">
      <div className="auth-card card-surface">
        <h2>تسجيل الدخول</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-block" disabled={loading}>{loading ? "..." : "دخول"}</button>
        </form>
        <p className="auth-switch">
          مالكيش حساب؟ <Link to="/register">سجلي دلوقتي</Link>
        </p>
      </div>
    </div>
  );
}
