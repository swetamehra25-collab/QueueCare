import { createContext, useContext, useEffect, useState } from "react";
import { get, post } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("queuecare-token")) {
      setLoading(false);
      return;
    }
    get("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem("queuecare-token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const result = await post("/auth/login", credentials);
    localStorage.setItem("queuecare-token", result.token);
    setUser(result.user);
    return result.user;
  }

  async function loginPatient(credentials) {
    const result = await post("/auth/patient/login", credentials);
    localStorage.setItem("queuecare-token", result.token);
    setUser(result.user);
    return result.user;
  }

  async function registerPatient(details) {
    const result = await post("/auth/patient/register", details);
    localStorage.setItem("queuecare-token", result.token);
    setUser(result.user);
    return result;
  }

  function logout() {
    localStorage.removeItem("queuecare-token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, loginPatient, registerPatient, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
