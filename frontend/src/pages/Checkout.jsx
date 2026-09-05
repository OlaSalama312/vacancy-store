
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";

const INSTAPAY_ACCOUNT = "01142575907";
const VODAFONE_CASH_NUMBER = "01055891728";

// مناطق القاهرة وأسعار الشحن
const shippingAreas = [
  {
    title: "مناطق قريبة - 40 جنيه",
    price: 40,
    areas: [
      "مدينة نصر",
      "مصر الجديدة",
      "العباسية",
      "روكسي",
      "سراي القبة",
      "حدائق القبة",
      "الزيتون",
      "عين شمس",
      "المطرية",
    ],
  },
  {
    title: "مناطق متوسطة - 60 جنيه",
    price: 60,
    areas: [
      "المعادي",
      "المقطم",
      "شبرا",
      "وسط البلد",
      "الزمالك",
    ],
  },
  {
    title: "مناطق بعيدة - 80 جنيه",
    price: 80,
    areas: [
      "التجمع الأول",
      "التجمع الخامس",
      "القاهرة الجديدة",
      "الشروق",
      "بدر",
      "مدينتي",
      "العاصمة الإدارية",
    ],
  },
];

const getShippingCost = (area) => {
  for (const group of shippingAreas) {
    if (group.areas.includes(area)) {
      return group.price;
    }
  }

  return 0;
};

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

  const shippingCost = getShippingCost(form.city);
  const finalTotal = total + shippingCost;

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

    if (!form.city) {
      setError("من فضلك اختاري المنطقة");
      return;
    }

    if (shippingCost === 0) {
      setError("من فضلك اختاري منطقة صحيحة");
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

      // بيانات الشحن
      formData.append("ShippingCity", form.city);
      formData.append("ShippingAddress", form.address);

      // مصاريف الشحن
      formData.append("ShippingCost", shippingCost);

      // الإجمالي النهائي
      formData.append("FinalTotal", finalTotal);

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

        <div style={summaryStyle}>
          <p>
            قيمة المنتجات: <strong>{total} جنيه</strong>
          </p>

          <p>
            مصاريف الشحن: <strong>{shippingCost} جنيه</strong>
          </p>

          <hr />

          <p style={{ fontSize: "20px" }}>
            الإجمالي النهائي:{" "}
            <strong>{finalTotal} جنيه</strong>
          </p>
        </div>

        {paymentMethod === "instapay" && (
          <div style={infoStyle}>
            <h3>الدفع عن طريق InstaPay</h3>

            <p>حساب InstaPay:</p>

            <div style={numberStyle}>
              {INSTAPAY_ACCOUNT}
            </div>

            <p>
              بعد التحويل، احتفظي بإثبات الدفع لمراجعة الطلب.
            </p>
          </div>
        )}

        {paymentMethod === "vodafone_cash" && (
          <div style={infoStyle}>
            <h3>الدفع عن طريق Vodafone Cash</h3>

            <p>رقم Vodafone Cash:</p>

            <div style={numberStyle}>
              {VODAFONE_CASH_NUMBER}
            </div>

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

      <div style={summaryStyle}>
        <h3>ملخص الطلب</h3>

        <p>عدد المنتجات: {items.length}</p>

        <p>
          قيمة المنتجات: <strong>{total} جنيه</strong>
        </p>

        <p>
          مصاريف الشحن:{" "}
          <strong>
            {shippingCost > 0 ? `${shippingCost} جنيه` : "اختاري المنطقة"}
          </strong>
        </p>

        <hr />

        <p style={{ fontSize: "20px" }}>
          الإجمالي النهائي:{" "}
          <strong>
            {finalTotal} جنيه
          </strong>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <h3>بيانات الشحن</h3>

        <label style={labelStyle}>
          المحافظة
        </label>

        <select
          name="governorate"
          value="القاهرة"
          disabled
          style={inputStyle}
        >
          <option value="القاهرة">القاهرة</option>
        </select>

        <label style={labelStyle}>
          المنطقة
        </label>

        <select
          name="city"
          value={form.city}
          onChange={handleChange}
          required
          style={inputStyle}
        >
          <option value="">
            اختاري المنطقة
          </option>

          {shippingAreas.map((group) => (
            <optgroup
              key={group.title}
              label={group.title}
            >
              {group.areas.map((area) => (
                <option
                  key={area}
                  value={area}
                >
                  {area} - {group.price} جنيه
                </option>
              ))}
            </optgroup>
          ))}
        </select>

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

            <p>حساب InstaPay:</p>

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

            <p>رقم Vodafone Cash:</p>

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

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
};

const paymentStyle = {
  display: "block",
  padding: "14px",
  marginBottom: "10px",
  cursor: "pointer",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const summaryStyle = {
  background: "linear-gradient(135deg, #fffaf3, #f5eadb)",
  padding: "20px",
  borderRadius: "14px",
  marginBottom: "25px",
  border: "1px solid #d8c3a5",
  color: "#3d3025",
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





