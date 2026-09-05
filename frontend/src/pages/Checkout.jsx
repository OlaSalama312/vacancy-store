import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ city: "", address: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const order = await api.createOrder({
        items: items.map((i) => ({ productId: i.id, quantity: i.qty })),
        shippingCity: form.city,
        shippingAddress: form.address,
        notes: form.notes,
        paymentMethod,
      });

      if (paymentMethod === "card") {
        const { paymentUrl } = await api.startPayment(order.id);
        window.location.href = paymentUrl; // بيوديها لصفحة الدفع بتاعة Paymob
      } else {
        clearCart();
        navigate("/account");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap checkout-page">
      <h2>استكمال الطلب</h2>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="card-surface">
          <div className="field">
            <label>المحافظة / المدينة</label>
            <input value={form.city} onChange={set("city")} required />
          </div>
          <div className="field">
            <label>العنوان بالتفصيل</label>
            <textarea rows={2} value={form.address} onChange={set("address")} required />
          </div>
          <div className="field">
            <label>ملاحظات (اختياري)</label>
            <textarea rows={2} value={form.notes} onChange={set("notes")} />
          </div>

          <div className="field">
            <label>طريقة الدفع</label>
            <div className="payment-options">
              <label className={`pay-option ${paymentMethod === "card" ? "active" : ""}`}>
                <input type="radio" name="pay" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                دفع بالكارت (Paymob)
              </label>
              <label className={`pay-option ${paymentMethod === "cod" ? "active" : ""}`}>
                <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                الدفع عند الاستلام
              </label>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-block" disabled={loading}>
            {loading ? "..." : paymentMethod === "card" ? "الانتقال للدفع" : "تأكيد الطلب"}
          </button>
        </form>

        <div className="order-summary card-surface">
          <h3>ملخص الطلب</h3>
          {items.map((i) => (
            <div className="summary-row" key={i.id}>
              <span>{i.name} × {i.qty}</span>
              <span>{i.price * i.qty} ج.م</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>الإجمالي</span>
            <strong>{total} ج.م</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
