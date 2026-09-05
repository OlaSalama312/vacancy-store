import { useState } from "react";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";

const INSTAPAY_ACCOUNT = "01142575907";
const VODAFONE_CASH_NUMBER = "01055891728";

// ==========================================
// مناطق القاهرة وأسعار الشحن بعد انتهاء العرض
// ==========================================

const shippingAreas = [
  {
    title: "مناطق قريبة",
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
    title: "مناطق متوسطة",
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
    title: "مناطق بعيدة",
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

// ==========================================
// معرفة تاريخ القاهرة الحالي
// ==========================================

const getCairoDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// ==========================================
// هل نحن داخل فترة الشحن المجاني؟
// من 9/9/2026 إلى 31/12/2026
// ==========================================

const isFreeShippingPeriod = () => {
  const cairoDate = getCairoDate();

  return (
    cairoDate >= "2026-09-09" &&
    cairoDate <= "2026-12-31"
  );
};

// ==========================================
// التأكد إن المنطقة موجودة في القائمة
// ==========================================

const isValidShippingArea = (area) => {
  return shippingAreas.some((group) =>
    group.areas.includes(area)
  );
};

// ==========================================
// حساب الشحن
// ==========================================

const getShippingCost = (area) => {
  if (!area) {
    return 0;
  }

  // أثناء فترة العرض:
  // كل المناطق الموجودة في القائمة = شحن مجاني
  if (isFreeShippingPeriod()) {
    if (isValidShippingArea(area)) {
      return 0;
    }

    return 0;
  }

  // بعد انتهاء العرض:
  // نرجع للأسعار الطبيعية
  for (const group of shippingAreas) {
    if (group.areas.includes(area)) {
      return group.price;
    }
  }

  return 0;
};

export default function Checkout() {
  const { items, total, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState("cod");

  const [paymentProof, setPaymentProof] =
    useState(null);

  const [form, setForm] = useState({
    city: "",
    address: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const [orderId, setOrderId] = useState(null);

  // ==========================================
  // حالة الشحن الحالية
  // ==========================================

  const freeShipping = isFreeShippingPeriod();

  const shippingCost = getShippingCost(form.city);

  const productsTotal = Number(total) || 0;

  const finalTotal =
    productsTotal + Number(shippingCost);

  // ==========================================
  // نحفظ بيانات الطلب قبل clearCart
  // ==========================================

  const [completedOrder, setCompletedOrder] =
    useState({
      productsTotal: 0,
      shippingCost: 0,
      finalTotal: 0,
    });

  // ==========================================
  // تغيير بيانات الفورم
  // ==========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // رفع صورة إثبات الدفع
  // ==========================================

  const handlePaymentProofChange = (e) => {
    const file =
      e.target.files?.[0] || null;

    setPaymentProof(file);
  };

  // ==========================================
  // تأكيد الطلب
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // السلة فاضية
    if (items.length === 0) {
      setError("السلة فاضية");
      return;
    }

    // لازم يختار منطقة
    if (!form.city) {
      setError("من فضلك اختاري المنطقة");
      return;
    }

    // لازم المنطقة تكون من مناطق القاهرة المحددة
    if (!isValidShippingArea(form.city)) {
      setError(
        "من فضلك اختاري منطقة صحيحة داخل القاهرة"
      );
      return;
    }

    // إثبات الدفع مطلوب في InstaPay و Vodafone Cash
    if (
      (paymentMethod === "instapay" ||
        paymentMethod === "vodafone_cash") &&
      !paymentProof
    ) {
      setError(
        "من فضلك ارفعي صورة إثبات التحويل"
      );
      return;
    }

    setLoading(true);

    try {
      // ========================================
      // حساب الإجماليات
      // ========================================

      const productsTotalValue =
        Number(total) || 0;

      const selectedShippingCost =
        Number(shippingCost) || 0;

      const selectedFinalTotal =
        productsTotalValue +
        selectedShippingCost;

      // ========================================
      // إنشاء FormData
      // ========================================

      const formData = new FormData();

      // بيانات الشحن
      formData.append(
        "ShippingCity",
        form.city
      );

      formData.append(
        "ShippingAddress",
        form.address
      );

      // مصاريف الشحن
      formData.append(
        "ShippingCost",
        String(selectedShippingCost)
      );

      // الإجمالي النهائي
      formData.append(
        "FinalTotal",
        String(selectedFinalTotal)
      );

      // الملاحظات
      if (form.notes) {
        formData.append(
          "Notes",
          form.notes
        );
      }

      // طريقة الدفع
      formData.append(
        "PaymentMethod",
        paymentMethod
      );

      // ========================================
      // المنتجات
      // ========================================

      items.forEach((item, index) => {
        formData.append(
          `Items[${index}].ProductId`,
          String(item.id)
        );

        formData.append(
          `Items[${index}].Quantity`,
          String(item.qty)
        );
      });

      // ========================================
      // إثبات الدفع
      // ========================================

      if (paymentProof) {
        formData.append(
          "PaymentProof",
          paymentProof
        );
      }

      // ========================================
      // إرسال الطلب للـBackend
      // ========================================

      const order =
        await api.createOrder(formData);

      // ========================================
      // استخدام بيانات الـBackend
      // ========================================

      const backendProductsTotal =
        Number(
          order.total ??
          productsTotalValue
        );

      const backendShippingCost =
        Number(
          order.shippingCost ??
          selectedShippingCost
        );

      const backendFinalTotal =
        Number(
          order.finalTotal ??
          (
            backendProductsTotal +
            backendShippingCost
          )
        );

      // ========================================
      // حفظ البيانات قبل مسح السلة
      // ========================================

      setCompletedOrder({
        productsTotal:
          backendProductsTotal,

        shippingCost:
          backendShippingCost,

        finalTotal:
          backendFinalTotal,
      });

      setOrderId(order.id);

      setSuccess(true);

      clearCart();

    } catch (err) {
      setError(
        err.message ||
        "حصل خطأ أثناء تأكيد الطلب"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // صفحة نجاح الطلب
  // ==========================================

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
        <h1>
          تم تأكيد الطلب ✅
        </h1>

        <p>
          رقم الطلب:{" "}
          <strong>
            #{orderId}
          </strong>
        </p>

        <div style={summaryStyle}>
          <h3>
            ملخص الطلب
          </h3>

          <p>
            قيمة المنتجات:{" "}
            <strong>
              {completedOrder.productsTotal} جنيه
            </strong>
          </p>

          <p>
            مصاريف الشحن:{" "}
            <strong>
              {completedOrder.shippingCost === 0
                ? "شحن مجاني 🎁"
                : `${completedOrder.shippingCost} جنيه`}
            </strong>
          </p>

          <hr />

          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
            }}
          >
            الإجمالي النهائي:{" "}
            <strong>
              {completedOrder.finalTotal} جنيه
            </strong>
          </p>
        </div>

        {/* InstaPay */}

        {paymentMethod === "instapay" && (
          <div style={infoStyle}>
            <h3>
              الدفع عن طريق InstaPay
            </h3>

            <p>
              حساب InstaPay:
            </p>

            <div style={numberStyle}>
              {INSTAPAY_ACCOUNT}
            </div>

            <p>
              بعد التحويل، احتفظي بإثبات
              الدفع لمراجعة الطلب.
            </p>
          </div>
        )}

        {/* Vodafone Cash */}

        {paymentMethod === "vodafone_cash" && (
          <div style={infoStyle}>
            <h3>
              الدفع عن طريق Vodafone Cash
            </h3>

            <p>
              رقم Vodafone Cash:
            </p>

            <div style={numberStyle}>
              {VODAFONE_CASH_NUMBER}
            </div>

            <p>
              بعد التحويل، احتفظي بإثبات
              الدفع لمراجعة الطلب.
            </p>
          </div>
        )}

        {/* Cash On Delivery */}

        {paymentMethod === "cod" && (
          <div style={infoStyle}>
            <h3>
              الدفع عند الاستلام
            </h3>

            <p>
              هتدفعي قيمة الطلب عند استلامه.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // صفحة Checkout
  // ==========================================

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
        direction: "rtl",
      }}
    >
      <h1>
        إتمام الطلب
      </h1>

      {/* رسالة العرض */}

      {freeShipping && (
        <div style={freeShippingStyle}>
          🎁 شحن مجاني على جميع مناطق القاهرة
          <br />
          العرض ساري من 9 سبتمبر حتى 31 ديسمبر 2026
        </div>
      )}

      {/* رسالة الخطأ */}

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

      {/* ======================================
          ملخص الطلب
          ====================================== */}

      <div style={summaryStyle}>
        <h3>
          ملخص الطلب
        </h3>

        <p>
          عدد المنتجات:{" "}
          <strong>
            {items.length}
          </strong>
        </p>

        <p>
          قيمة المنتجات:{" "}
          <strong>
            {productsTotal} جنيه
          </strong>
        </p>

        <p>
          مصاريف الشحن:{" "}
          <strong>
            {!form.city
              ? "اختاري المنطقة"
              : shippingCost === 0
                ? "شحن مجاني 🎁"
                : `${shippingCost} جنيه`}
          </strong>
        </p>

        <hr />

        <p
          style={{
            fontSize: "22px",
            fontWeight: "700",
            marginTop: "15px",
          }}
        >
          الإجمالي النهائي:{" "}
          <strong>
            {finalTotal} جنيه
          </strong>
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ====================================
            بيانات الشحن
            ==================================== */}

        <h3>
          بيانات الشحن
        </h3>

        <label style={labelStyle}>
          المحافظة
        </label>

        <select
          name="governorate"
          value="القاهرة"
          disabled
          style={inputStyle}
        >
          <option value="القاهرة">
            القاهرة
          </option>
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

          {shippingAreas.map(
            (group) => (
              <optgroup
                key={group.title}
                label={
                  freeShipping
                    ? `${group.title} - شحن مجاني 🎁`
                    : `${group.title} - ${group.price} جنيه`
                }
              >
                {group.areas.map(
                  (area) => (
                    <option
                      key={area}
                      value={area}
                    >
                      {freeShipping
                        ? `${area} - شحن مجاني`
                        : `${area} - ${group.price} جنيه`}
                    </option>
                  )
                )}
              </optgroup>
            )
          )}
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

        {/* ====================================
            طريقة الدفع
            ==================================== */}

        <h3>
          طريقة الدفع
        </h3>

        {/* InstaPay */}

        <label style={paymentStyle}>
          <input
            type="radio"
            value="instapay"
            checked={
              paymentMethod === "instapay"
            }
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          />
          InstaPay
        </label>

        {paymentMethod === "instapay" && (
          <div style={infoStyle}>
            <strong>
              الدفع عن طريق InstaPay
            </strong>

            <p>
              حساب InstaPay:
            </p>

            <div style={numberStyle}>
              {INSTAPAY_ACCOUNT}
            </div>

            <p>
              بعد التحويل، احتفظي بإثبات الدفع.
            </p>

            <label style={uploadStyle}>
              صورة إثبات التحويل

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePaymentProofChange
                }
              />
            </label>

            {paymentProof && (
              <p>
                تم اختيار الصورة:{" "}
                <strong>
                  {paymentProof.name}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* Vodafone Cash */}

        <label style={paymentStyle}>
          <input
            type="radio"
            value="vodafone_cash"
            checked={
              paymentMethod ===
              "vodafone_cash"
            }
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          />
          Vodafone Cash
        </label>

        {paymentMethod ===
          "vodafone_cash" && (
          <div style={infoStyle}>
            <strong>
              الدفع عن طريق Vodafone Cash
            </strong>

            <p>
              رقم Vodafone Cash:
            </p>

            <div style={numberStyle}>
              {VODAFONE_CASH_NUMBER}
            </div>

            <p>
              بعد التحويل، احتفظي بإثبات الدفع.
            </p>

            <label style={uploadStyle}>
              صورة إثبات التحويل

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePaymentProofChange
                }
              />
            </label>

            {paymentProof && (
              <p>
                تم اختيار الصورة:{" "}
                <strong>
                  {paymentProof.name}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* Cash On Delivery */}

        <label style={paymentStyle}>
          <input
            type="radio"
            value="cod"
            checked={
              paymentMethod === "cod"
            }
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          />
          الدفع عند الاستلام
        </label>

        {paymentMethod === "cod" && (
          <div style={infoStyle}>
            <p>
              هتدفعي قيمة الطلب عند استلامه.
            </p>
          </div>
        )}

        {/* ====================================
            زر تأكيد الطلب
            ==================================== */}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "20px",
            cursor: loading
              ? "not-allowed"
              : "pointer",
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

// ==========================================
// Styles
// ==========================================

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
  background:
    "linear-gradient(135deg, #fffaf3, #f5eadb)",
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
  background:
    "linear-gradient(135deg, #fffaf3, #f5eadb)",
  color: "#3d3025",
  textAlign: "center",
  boxShadow:
    "0 5px 15px rgba(80, 55, 30, 0.10)",
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
  boxShadow:
    "0 3px 10px rgba(80, 55, 30, 0.12)",
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

const freeShippingStyle = {
  background:
    "linear-gradient(135deg, #fff8e8, #f5eadb)",
  border: "1px solid #d8c3a5",
  borderRadius: "14px",
  padding: "15px",
  marginBottom: "20px",
  textAlign: "center",
  fontWeight: "700",
  color: "#8a6842",
  lineHeight: "1.8",
};




