import React from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/history", label: "History" },
  ];

  return (
    <div className="min-h-screen bg-[#f1f2f3] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[#dcdcdc] p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="font-semibold text-slate-900">Compliance Hub</div>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="text-slate-600 focus:outline-none p-1 rounded hover:bg-slate-100"
        >
          {/* Hamburger Icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar - Responsive */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#ebebeb] border-r border-[#dcdcdc] transform transition-transform duration-200 ease-in-out shadow-xl md:shadow-none
          md:relative md:translate-x-0 md:flex md:flex-col md:shrink-0 md:w-60 md:visible
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close Button for Mobile */}
        <div className="md:hidden absolute top-4 right-4 z-50">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 hover:text-slate-700 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 hidden md:block">
          {/* Logo spacer for desktop */}
        </div>
        <div className="p-4 md:hidden">
          <span className="font-semibold text-slate-900">Menu</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2 md:mt-0">
          {navItems.map(({ path, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
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

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 h-[calc(100vh-65px)] md:h-screen">
        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
