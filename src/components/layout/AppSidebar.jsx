// src/components/layout/AppSidebar.jsx
import { NavLink } from "react-router";
import { Server, Settings, X } from "lucide-react";

const NAV_ITEMS = [
  { to: "/environments", label: "Environments", icon: Server },
  { to: "/settings", label: "Settings", icon: Settings, end: true },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-2 transition-colors ${
    isActive
      ? "border-primary bg-primary-muted text-primary"
      : "border-transparent text-secondary hover:text-primary hover:bg-surface-elevated"
  }`;

const NavList = ({ onItemClick }) => (
  <nav className="flex flex-col gap-1 p-4">
    <p className="section-label px-3 mb-2">Platform</p>
    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={linkClass}
        onClick={onItemClick}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

const AppSidebar = ({ mobileOpen, onClose }) => (
  <>
    {/* Desktop — static rail */}
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-surface/40 sticky top-16 h-[calc(100vh-4rem)]"
      aria-label="Primary navigation"
    >
      <NavList />
    </aside>

    {/* Mobile — slide-in drawer */}
    {mobileOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/50 animate-fade-in"
          onClick={onClose}
        />
        <aside
          className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-border shadow-elevation-4 animate-slide-up"
          aria-label="Primary navigation"
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-border">
            <span className="section-label">Menu</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg text-tertiary hover:text-primary hover:bg-surface-elevated"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <NavList onItemClick={onClose} />
        </aside>
      </div>
    )}
  </>
);

export default AppSidebar;
