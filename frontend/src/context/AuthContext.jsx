import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));

    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getRole(claims) {
  return (
    claims?.role ||
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer"
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      const claims = decodeJwt(token);

      if (claims) {
        setUser({
          email: claims.email,
          name: claims.name || claims.email,
          role: getRole(claims),
        });
      }
    }

    setLoading(false);
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });

    localStorage.setItem("auth_token", data.token);

    const claims = decodeJwt(data.token);
    const role = getRole(claims);

    setUser({
      email: claims.email,
      name: claims.name || claims.email,
      role,
    });

    return role;
  }

  async function register(payload) {
    const data = await api.register(payload);

    localStorage.setItem("auth_token", data.token);

    const claims = decodeJwt(data.token);
    const role = getRole(claims);

    setUser({
      email: claims.email,
      name: claims.name || claims.email,
      role,
    });
  }

  function logout() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}