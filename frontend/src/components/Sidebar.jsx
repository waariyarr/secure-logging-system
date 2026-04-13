import { NavLink } from "react-router-dom";

const baseLinks = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/logs", label: "Logs" },
  { to: "/chain", label: "Blockchain" },
];

export default function Sidebar({ user }) {
  const links = user?.isAdmin
    ? [...baseLinks, { to: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <aside className="app-shell__sidebar" aria-label="Main navigation">
      <div className="sidebar__label">Menu</div>
      <nav className="sidebar__nav">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
