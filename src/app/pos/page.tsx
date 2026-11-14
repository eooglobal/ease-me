"use client";

import React, { useState } from "react";
import { CashierPortal } from "@/components/portals/CashierPortal";
import { useRouter } from "next/navigation";
import { performSignOut } from "@/lib/auth/auth-client";

export default function PosPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = async () => {
    await performSignOut();
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}

      <CashierPortal
        cashierName="Adaeze Okon (POS-1)"
        storeName="Alpha Retail Ltd"
        onLogout={handleLogout}
        triggerToast={triggerToast}
      />
    </div>
  );
}

