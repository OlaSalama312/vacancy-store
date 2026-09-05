import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  function goCheckout() {
    navigate(user ? "/checkout" : "/login?next=/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="wrap empty-state">
        <h2>السلة فاضية</h2>
        <p>لسه ماضفتيش أي قطعة، يلا نشوف الكولكشن</p>
        <Link className="btn" to="/">تسوقي دلوقتي</Link>
      </div>
    );
  }

  return (
    <div className="wrap cart-page">
      <h2>سلة المشتريات</h2>
      <div className="cart-list">
        {items.map((i) => (
          <div className="cart-row" key={i.id}>
            <img src={i.image} alt={i.name} />
            <div className="cart-row-info">
              <h4>{i.name}</h4>
              <span className="price">{i.price} ج.م</span>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQty(i.id, i.qty - 1)}>−</button>
              <span>{i.qty}</span>
              <button onClick={() => updateQty(i.id, i.qty + 1)}>+</button>
            </div>
            <span className="row-total">{i.price * i.qty} ج.م</span>
            <button className="remove-btn" onClick={() => removeItem(i.id)}>حذف</button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <span>الإجمالي</span>
        <strong>{total} ج.م</strong>
      </div>
      <button className="btn btn-block" onClick={goCheckout}>استكمال الطلب</button>
    </div>
  );
}
