import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

export default function AppShell({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="app-shell__main">
        <Navbar user={user} onLogout={onLogout} />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
