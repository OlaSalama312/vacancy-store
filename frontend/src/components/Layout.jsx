import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <div>
      <div className="topstrip">توصيل لجميع المحافظات · اطلبي أونلاين وادفعي بالكارت أو عند الاستلام</div>

      <header className="site-header">
        <div className="wrap headbar">
          <Link to="/" className="logo">
            <span className="gem"></span> لالئ
          </Link>

          <nav>
            <Link to="/">الكتالوج</Link>
            {user?.role === "Admin" && <Link to="/admin">لوحة الأدمن</Link>}
            {user && user.role !== "Admin" && <Link to="/account">طلباتي</Link>}
          </nav>

          <div className="head-actions">
            {user ? (
              <>
                <span className="user-chip">أهلاً، {user.name}</span>
                <button className="icon-btn" onClick={() => { logout(); navigate("/"); }} title="خروج">⏻</button>
              </>
            ) : (
              <Link className="icon-btn" to="/login" title="تسجيل الدخول">
                👤
              </Link>
            )}
            <Link className="icon-btn cart-btn" to="/cart" title="السلة">
              🛍️
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="wrap foot-grid">
          <div>
            <h4>لالئ</h4>
            <p>متجر إكسسوارات مصري بيقدملك قطع مختارة بعناية بسعر مناسب وتوصيل لكل المحافظات.</p>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            <Link to="/">الكتالوج</Link>
            <Link to="/account">طلباتي</Link>

          </div>
          <div>
            <h4>تواصلي معنا</h4>
            <a href="https://wa.me/201055891728" target="_blank" rel="noreferrer">واتساب: 010558917280</a>
          </div>
        </div>
        <div className="foot-bottom wrap">© 2026 لالئ للإكسسوارات — جميع الحقوق محفوظة</div>
      </footer>
    </div>
  );
}
