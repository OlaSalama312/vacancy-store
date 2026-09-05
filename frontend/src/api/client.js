// عنوان الـ API - غيّريه في ملف .env (VITE_API_URL) وقت النشر
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("auth_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { };
    if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = "حصل خطأ، حاولي تاني";
    try {
      const data = await res.json();
      message = data.message || data.title || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ---- Auth ----
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  // ---- Catalog ----
  getCategories: () => request("/categories"),
  getProducts: (categorySlug) =>
    request(`/products${categorySlug ? `?category=${categorySlug}` : ""}`),
  getProduct: (id) => request(`/products/${id}`),

  // ---- Orders (customer) ----
  createOrder: (payload) => request("/orders", { method: "POST", body: payload, auth: true }),
  getMyOrders: () => request("/orders/mine", { auth: true }),

  // ---- Payment ----
  startPayment: (orderId) =>
    request(`/payments/paymob/initiate`, { method: "POST", body: { orderId }, auth: true }),

  // ---- Admin ----
  adminGetOrders: () => request("/admin/orders", { auth: true }),
  adminUpdateOrderStatus: (orderId, status) =>
    request(`/admin/orders/${orderId}/status`, { method: "PUT", body: { status }, auth: true }),
  adminCreateProduct: (payload) =>
    request("/admin/products", { method: "POST", body: payload, auth: true }),
  adminUpdateProduct: (id, payload) =>
    request(`/admin/products/${id}`, { method: "PUT", body: payload, auth: true }),
  adminDeleteProduct: (id) =>
    request(`/admin/products/${id}`, { method: "DELETE", auth: true }),
};

export { getToken };
