import { useEffect, useState } from "react";
import { api, getAdminPaymentProof } from "../api/client";

const statusOptions = [
  "Pending",
  "Paid",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const statusLabel = {
  Pending: "قيد المراجعة",
  Paid: "تم الدفع",
  Shipped: "تم الشحن",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
};

const paymentLabel = {
  InstaPay: "InstaPay",
  VodafoneCash: "Vodafone Cash",
  CashOnDelivery: "الدفع عند الاستلام",
  COD: "الدفع عند الاستلام",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("orders");

  return (
    <div className="wrap admin-page">
      <h2>لوحة التحكم</h2>

      <div className="admin-tabs">
        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          الطلبات
        </button>

        <button
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
        >
          المنتجات
        </button>
      </div>

      {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
    </div>
  );
}

/* =========================
   الطلبات
========================= */

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingProof, setOpeningProof] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);

    api
      .adminGetOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(error);
        alert(error.message || "حصل خطأ أثناء تحميل الطلبات");
      })
      .finally(() => setLoading(false));
  }

  async function changeStatus(id, status) {
    try {
      await api.adminUpdateOrderStatus(id, status);
      load();
    } catch (error) {
      alert(error.message || "حصل خطأ أثناء تغيير حالة الطلب");
    }
  }

  async function openPaymentProof(orderId) {
    try {
      setOpeningProof(orderId);

      const blob = await getAdminPaymentProof(orderId);

      const imageUrl = URL.createObjectURL(blob);

      window.open(imageUrl, "_blank");

      // نسيب الـ URL شغال شوية عشان الصورة تفتح
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 60000);
    } catch (error) {
      console.error(error);
      alert(error.message || "تعذر تحميل إثبات الدفع");
    } finally {
      setOpeningProof(null);
    }
  }

  if (loading) {
    return <p>...جاري تحميل الطلبات</p>;
  }

  if (orders.length === 0) {
    return <p>لا توجد طلبات حتى الآن</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>العميل</th>
            <th>قيمة المنتجات</th>
            <th>مصاريف الشحن</th>
            <th>الإجمالي النهائي</th>
            <th>طريقة الدفع</th>
            <th>إثبات الدفع</th>
            <th>الملاحظة</th>
            <th>الحالة</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => {
            const productsTotal = Number(o.total ?? 0);
            const shippingCost = Number(o.shippingCost ?? 0);

            const finalTotal = Number(
              o.finalTotal ?? productsTotal + shippingCost
            );

            const paymentMethod =
              paymentLabel[o.paymentMethod] ||
              o.paymentMethod ||
              "غير محدد";

            return (
              <tr key={o.id}>
                {/* رقم الطلب */}
                <td>
                  <strong>#{o.id}</strong>
                </td>

                {/* العميل */}
                <td>{o.customerName}</td>

                {/* قيمة المنتجات */}
                <td>
                  <strong>{productsTotal} ج.م</strong>
                </td>

                {/* الشحن */}
                <td>
                  {shippingCost === 0 ? (
                    <strong
                      style={{
                        color: "#2e7d32",
                        whiteSpace: "nowrap",
                      }}
                    >
                      شحن مجاني 🎁
                    </strong>
                  ) : (
                    <strong>{shippingCost} ج.م</strong>
                  )}
                </td>

                {/* الإجمالي النهائي */}
                <td>
                  <strong
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                    }}
                  >
                    {finalTotal} ج.م
                  </strong>
                </td>

                {/* طريقة الدفع */}
                <td>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#fff8ee",
                      border: "1px solid #d8c3a5",
                      color: "#6d5135",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {paymentMethod}
                  </div>
                </td>

                {/* إثبات الدفع */}
                <td>
                  {o.paymentProofUrl ? (
                    <button
                      type="button"
                      onClick={() => openPaymentProof(o.id)}
                      disabled={openingProof === o.id}
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background:
                          openingProof === o.id
                            ? "#aaa"
                            : "#8a6842",
                        color: "#fff",
                        border: "none",
                        cursor:
                          openingProof === o.id
                            ? "wait"
                            : "pointer",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {openingProof === o.id
                        ? "جاري الفتح..."
                        : "📷 عرض الإثبات"}
                    </button>
                  ) : (
                    <span
                      style={{
                        color: "#888",
                        whiteSpace: "nowrap",
                      }}
                    >
                      لا يوجد
                    </span>
                  )}
                </td>

                {/* الملاحظة */}
                <td>
                  {o.notes || "لا توجد ملاحظة"}
                </td>

                {/* الحالة */}
                <td>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      changeStatus(o.id, e.target.value)
                    }
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================
   المنتجات
========================= */

function emptyProduct() {
  return {
    id: null,
    name: "",
    category: "rings",
    price: "",
    oldPrice: "",
    imageUrl: "",
    imageFile: null,
  };
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct());
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);

    api
      .getProducts()
      .then(setProducts)
      .catch((error) => {
        console.error(error);
        alert(error.message || "حصل خطأ أثناء تحميل المنتجات");
      })
      .finally(() => setLoading(false));
  }

  function set(field) {
    return (e) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value,
      }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("من فضلك اختاري صورة فقط");
      return;
    }

    setForm((f) => ({
      ...f,
      imageFile: file,
    }));

    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("Name", form.name);
      formData.append("Category", form.category);
      formData.append("Price", String(form.price));

      if (form.oldPrice) {
        formData.append(
          "OldPrice",
          String(form.oldPrice)
        );
      }

      if (form.imageFile) {
        formData.append("Image", form.imageFile);
      }

      if (form.id) {
        await api.adminUpdateProduct(
          form.id,
          formData
        );
      } else {
        if (!form.imageFile) {
          alert("من فضلك اختاري صورة للمنتج");
          return;
        }

        await api.adminCreateProduct(formData);
      }

      alert(
        form.id
          ? "تم تعديل المنتج بنجاح ✅"
          : "تم إضافة المنتج بنجاح ✅"
      );

      setForm(emptyProduct());
      setImagePreview("");
      load();
    } catch (error) {
      alert(
        error.message ||
          "حصل خطأ، حاولي تاني"
      );
    }
  }

  async function handleDelete(id) {
    try {
      await api.adminDeleteProduct(id);
      load();
    } catch (error) {
      alert(
        error.message ||
          "حصل خطأ أثناء حذف المنتج"
      );
    }
  }

  return (
    <div className="admin-products">
      <form
        onSubmit={handleSubmit}
        className="card-surface admin-product-form"
      >
        <h3>
          {form.id ? "تعديل منتج" : "منتج جديد"}
        </h3>

        <div className="field">
          <label>الاسم</label>

          <input
            value={form.name}
            onChange={set("name")}
            required
          />
        </div>

        <div className="field">
          <label>القسم (slug)</label>

          <input
            value={form.category}
            onChange={set("category")}
            required
          />
        </div>

        <div className="field">
          <label>السعر</label>

          <input
            type="number"
            value={form.price}
            onChange={set("price")}
            required
          />
        </div>

        <div className="field">
          <label>
            السعر قبل الخصم (اختياري)
          </label>

          <input
            type="number"
            value={form.oldPrice}
            onChange={set("oldPrice")}
          />
        </div>

        <div className="field">
          <label>صورة المنتج</label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="معاينة الصورة"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                marginTop: "10px",
                borderRadius: "10px",
              }}
            />
          )}
        </div>

        <button className="btn btn-block">
          {form.id
            ? "حفظ التعديل"
            : "إضافة المنتج"}
        </button>
      </form>

      {loading ? (
        <p>...جاري التحميل</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>القسم</th>
              <th>السعر</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>

                <td>{p.category}</td>

                <td>{p.price} ج.م</td>

                <td>
                  <button
                    className="link-btn"
                    onClick={() => {
                      setForm({
                        ...p,
                        oldPrice:
                          p.oldPrice || "",
                        imageFile: null,
                      });

                      setImagePreview(
                        p.imageUrl || ""
                      );
                    }}
                  >
                    تعديل
                  </button>

                  <button
                    className="link-btn danger"
                    onClick={() =>
                      handleDelete(p.id)
                    }
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}