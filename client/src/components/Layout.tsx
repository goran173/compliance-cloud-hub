import React from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/history", label: "History" },
  ];

  return (
    <div className="min-h-screen bg-[#f1f2f3] flex">
      {/* Sidebar - Light/Native Style */}
      <aside className="w-60 bg-[#ebebeb] border-r border-[#dcdcdc] flex flex-col shrink-0">
        <div className="p-4">
          {/* Logo or minimal placeholder if needed, or just empty space */}
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ path, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#dcdcdc]">
          <span className="text-xs text-slate-500">v0.1.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header removed as requested */}
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
