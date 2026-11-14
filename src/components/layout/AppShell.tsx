"use client";

import React, { ReactNode, useState } from "react";
import { RoleSidebar, SystemRole } from "./RoleSidebar";
import { Menu, X, Bell } from "lucide-react";

interface AppShellProps {
  role: SystemRole;
  children: ReactNode;
  userEmail?: string;
  userName?: string;
  businessName?: string;
}

export function AppShell({
  role,
  children,
  userEmail,
  userName,
  businessName,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <RoleSidebar
          role={role}
          userEmail={userEmail}
          userName={userName}
          businessName={businessName}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <RoleSidebar
          role={role}
          userEmail={userEmail}
          userName={userName}
          businessName={businessName}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-slate-900">Ease Me</span>
          <button
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md border border-slate-200"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}

