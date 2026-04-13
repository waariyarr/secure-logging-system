import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Blockchain from "./pages/Blockchain";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";

const toastBase = {
  style: {
    background: "#1a1d28",
    color: "#e8eaef",
    border: "1px solid #2a2f40",
  },
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={toastBase} />
      <BrowserRouter>
        {user ? (
          <Routes>
            <Route
              element={<AppShell user={user} onLogout={handleLogout} />}
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/chain" element={<Blockchain />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={<Login onAuthSuccess={(u) => setUser(u)} />}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
