import { NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { to: "/",       icon: "📊", label: "Dashboard" },
  { to: "/admin",  icon: "⚙️",  label: "Admin" },
  { to: "/rules",  icon: "📝", label: "Rules" },
];

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <nav className="flex w-56 flex-col border-r border-border-subtle bg-bg-secondary px-3 py-6 flex-shrink-0">
        <div className="mb-8 px-3">
          <span className="text-lg font-semibold text-text-primary">💰 Money Disk</span>
        </div>
        <div className="flex flex-col gap-1">
          {navLinks.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-accent-primary/15 text-accent-primary"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary")
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mt-auto px-3">
          <p className="text-xs text-text-tertiary">Personal Finance</p>
        </div>
      </nav>
      <main className="flex-1 overflow-auto bg-bg-primary">
        <Outlet />
      </main>
    </div>
  );
}
