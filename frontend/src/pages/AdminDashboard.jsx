import { useEffect, useState } from "react";
import { api } from "../api/client";

const statusOptions = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];
const statusLabel = {
  Pending: "قيد المراجعة", Paid: "تم الدفع", Shipped: "تم الشحن",
  Delivered: "تم التسليم", Cancelled: "ملغي",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("orders");

  return (
    <div className="wrap admin-page">
     <h2>لوحة التحكم - TEST</h2>
      <div className="admin-tabs">
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>الطلبات</button>
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>المنتجات</button>
      </div>
      {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  function load() {
    setLoading(true);
    api.adminGetOrders().then(setOrders).finally(() => setLoading(false));
  }

  async function changeStatus(id, status) {
    await api.adminUpdateOrderStatus(id, status);
    load();
  }

  if (loading) return <p>...جاري التحميل</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>#{o.id}</td>
            <td>{o.customerName}</td>
            <td>{o.total} ج.م</td>
            <td>
              <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                {statusOptions.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function emptyProduct() {
  return { id: null, name: "", category: "rings", price: "", oldPrice: "", imageUrl: "" };
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct());
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  function load() {
    setLoading(true);
    api.getProducts().then(setProducts).finally(() => setLoading(false));
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null };
    if (form.id) {
      await api.adminUpdateProduct(form.id, payload);
    } else {
      await api.adminCreateProduct(payload);
    }
    setForm(emptyProduct());
    load();
  }

  async function handleDelete(id) {
    await api.adminDeleteProduct(id);
    load();
  }

  return (
    <div className="admin-products">
      <form onSubmit={handleSubmit} className="card-surface admin-product-form">
        <h3>{form.id ? "تعديل منتج" : "منتج جديد"}</h3>
        <div className="field"><label>الاسم</label><input value={form.name} onChange={set("name")} required /></div>
        <div className="field"><label>القسم (slug)</label><input value={form.category} onChange={set("category")} required /></div>
        <div className="field"><label>السعر</label><input type="number" value={form.price} onChange={set("price")} required /></div>
        <div className="field"><label>السعر قبل الخصم (اختياري)</label><input type="number" value={form.oldPrice} onChange={set("oldPrice")} /></div>
        <div className="field"><label>رابط الصورة</label><input value={form.imageUrl} onChange={set("imageUrl")} required /></div>
        <button className="btn btn-block">{form.id ? "حفظ التعديل" : "إضافة المنتج"}</button>
      </form>

      {loading ? <p>...جاري التحميل</p> : (
        <table className="admin-table">
          <thead><tr><th>الاسم</th><th>القسم</th><th>السعر</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.price} ج.م</td>
                <td>
                  <button className="link-btn" onClick={() => setForm({ ...p, oldPrice: p.oldPrice || "" })}>تعديل</button>
                  <button className="link-btn danger" onClick={() => handleDelete(p.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
