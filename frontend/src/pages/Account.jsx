import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const statusLabel = {
  Pending: "قيد المراجعة",
  Paid: "تم الدفع",
  Shipped: "تم الشحن",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
};

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="wrap account-page">
      <h2>أهلاً، {user?.name}</h2>
      <h3 style={{ marginTop: 30, marginBottom: 16 }}>طلباتي</h3>

      {loading && <p>...جاري التحميل</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && orders.length === 0 && <p>مفيش طلبات لسه.</p>}

      <div className="orders-list">
        {orders.map((o) => (
          <div className="order-card card-surface" key={o.id}>
            <div className="order-head">
              <span>طلب #{o.id}</span>
              <span className={`status-pill status-${o.status?.toLowerCase()}`}>
                {statusLabel[o.status] || o.status}
              </span>
            </div>
            <div className="order-items">
              {o.items?.map((it) => (
                <div key={it.productId} className="summary-row">
                  <span>{it.productName} × {it.quantity}</span>
                  <span>{it.price * it.quantity} ج.م</span>
                </div>
              ))}
            </div>
            <div className="summary-row total">
              <span>الإجمالي</span>
              <strong>{o.total} ج.م</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
