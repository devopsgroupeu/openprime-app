// src/components/layout/AppLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onMenuClick={() => setNavOpen(true)} />
      <div className="flex flex-1">
        <AppSidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
