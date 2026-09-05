import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap auth-page">
      <div className="auth-card card-surface">
        <h2>حساب جديد</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>الاسم بالكامل</label>
            <input value={form.name} onChange={set("name")} required />
          </div>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="field">
            <label>رقم الموبايل</label>
            <input type="tel" value={form.phone} onChange={set("phone")} required />
          </div>
          <div className="field">
            <label>كلمة المرور</label>
            <input type="password" value={form.password} onChange={set("password")} required minLength={6} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-block" disabled={loading}>{loading ? "..." : "إنشاء الحساب"}</button>
        </form>
        <p className="auth-switch">
          عندك حساب؟ <Link to="/login">سجلي دخول</Link>
        </p>
      </div>
    </div>
  );
}
