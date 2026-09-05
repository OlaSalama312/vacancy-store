
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";

const INSTAPAY_ACCOUNT = "01142575907";
const VODAFONE_CASH_NUMBER = "01055891728";

export default function Checkout() {
  const { items, total, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentProof, setPaymentProof] = useState(null);

  const [form, setForm] = useState({
    city: "",
    address: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaymentProofChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPaymentProof(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("السلة فاضية");
      return;
    }

    if (
      (paymentMethod === "instapay" ||
        paymentMethod === "vodafone_cash") &&
      !paymentProof
    ) {
      setError("من فضلك ارفعي صورة إثبات التحويل");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("ShippingCity", form.city);
      formData.append("ShippingAddress", form.address);

      if (form.notes) {
        formData.append("Notes", form.notes);
      }

      formData.append("PaymentMethod", paymentMethod);

      items.forEach((item, index) => {
        formData.append(`Items[${index}].ProductId`, item.id);
        formData.append(`Items[${index}].Quantity`, item.qty);
      });

      if (paymentProof) {
        formData.append("PaymentProof", paymentProof);
      }

      const order = await api.createOrder(formData);

      setOrderId(order.id);
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(
        err.message || "حصل خطأ أثناء تأكيد الطلب"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          maxWidth: "700px",
          margin: "60px auto",
          padding: "30px",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <h1>تم تأكيد الطلب ✅</h1>

        <p>
          رقم الطلب: <strong>#{orderId}</strong>
        </p>

        <p>
          إجمالي الطلب: <strong>{total} جنيه</strong>
        </p>

        {paymentMethod === "instapay" && (
          <div style={infoStyle}>
            <h3>الدفع عن طريق InstaPay</h3>

            <p>
              حساب InstaPay:{" "}
              <strong>{INSTAPAY_ACCOUNT}</strong>
            </p>

            <p>
              بعد التحويل، احتفظي بإثبات الدفع لمراجعة الطلب.
            </p>
          </div>
        )}

        {paymentMethod === "vodafone_cash" && (
          <div style={infoStyle}>
            <h3>الدفع عن طريق Vodafone Cash</h3>

            <p>
              رقم Vodafone Cash:{" "}
              <strong>{VODAFONE_CASH_NUMBER}</strong>
            </p>

            <p>
              بعد التحويل، احتفظي بإثبات الدفع لمراجعة الطلب.
            </p>
          </div>
        )}

        {paymentMethod === "cod" && (
          <div style={infoStyle}>
            <h3>الدفع عند الاستلام</h3>
            <p>هتدفعي قيمة الطلب عند استلامه.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        direction: "rtl",
      }}
    >
      <h1>إتمام الطلب</h1>

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            color: "#b00000",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "#f7f7f7",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "25px",
        }}
      >
        <h3>ملخص الطلب</h3>

        <p>عدد المنتجات: {items.length}</p>

        <p>
          الإجمالي: <strong>{total} جنيه</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <h3>بيانات الشحن</h3>

        <input
          name="city"
          placeholder="المحافظة / المدينة"
          value={form.city}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <textarea
          name="address"
          placeholder="العنوان بالتفصيل"
          value={form.address}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <textarea
          name="notes"
          placeholder="ملاحظات إضافية (اختياري)"
          value={form.notes}
          onChange={handleChange}
          style={inputStyle}
        />

        <h3>طريقة الدفع</h3>

        <label style={paymentStyle}>
          <input
            type="radio"
            value="instapay"
            checked={paymentMethod === "instapay"}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
          />
          InstaPay
        </label>

        {paymentMethod === "instapay" && (
          <div style={infoStyle}>
            <strong>الدفع عن طريق InstaPay</strong>

          <p>
  حساب InstaPay:
</p>

<div style={numberStyle}>
  {INSTAPAY_ACCOUNT}
</div>
            <p>بعد التحويل، احتفظي بإثبات الدفع.</p>

            <label style={uploadStyle}>
              صورة إثبات التحويل

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePaymentProofChange}
              />
            </label>

            {paymentProof && (
              <p>
                تم اختيار الصورة:{" "}
                <strong>{paymentProof.name}</strong>
              </p>
            )}
          </div>
        )}

        <label style={paymentStyle}>
          <input
            type="radio"
            value="vodafone_cash"
            checked={paymentMethod === "vodafone_cash"}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
          />
          Vodafone Cash
        </label>

        {paymentMethod === "vodafone_cash" && (
          <div style={infoStyle}>
            <strong>الدفع عن طريق Vodafone Cash</strong>

          <p>
  رقم Vodafone Cash:
</p>

<div style={numberStyle}>
  {VODAFONE_CASH_NUMBER}
</div>

            <p>بعد التحويل، احتفظي بإثبات الدفع.</p>

            <label style={uploadStyle}>
              صورة إثبات التحويل

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePaymentProofChange}
              />
            </label>

            {paymentProof && (
              <p>
                تم اختيار الصورة:{" "}
                <strong>{paymentProof.name}</strong>
              </p>
            )}
          </div>
        )}

        <label style={paymentStyle}>
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
          />
          الدفع عند الاستلام
        </label>

        {paymentMethod === "cod" && (
          <div style={infoStyle}>
            <p>هتدفعي قيمة الطلب عند استلامه.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "20px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {loading
            ? "جاري تأكيد الطلب..."
            : "تأكيد الطلب"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  boxSizing: "border-box",
};

const paymentStyle = {
  display: "block",
  padding: "14px",
  marginBottom: "10px",
  cursor: "pointer",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const infoStyle = {
  padding: "20px",
  marginBottom: "15px",
  border: "1px solid #d8c3a5",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #fffaf3, #f5eadb)",
  color: "#3d3025",
  textAlign: "center",
  boxShadow: "0 5px 15px rgba(80, 55, 30, 0.10)",
};
const numberStyle = {
  background: "#fff",
  color: "#8a6842",
  padding: "12px 22px",
  borderRadius: "10px",
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "1.5px",
  direction: "ltr",
  display: "inline-block",
  border: "2px solid #d8c3a5",
  boxShadow: "0 3px 10px rgba(80, 55, 30, 0.12)",
  margin: "5px 0 10px",
};

const uploadStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "12px",
  marginTop: "12px",
  border: "1px dashed #999",
  borderRadius: "8px",
  cursor: "pointer",
};



