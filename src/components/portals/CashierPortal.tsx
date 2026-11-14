"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Receipt,
  Search,
  Plus,
  Trash2,
  LockKeyhole,
  LogOut,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle2,
  Boxes,
  Tag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  History,
  Lock,
  PauseCircle,
  PlayCircle,
  Users,
  Wifi,
  WifiOff,
  DollarSign,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { ReceiptDetailModal } from "../modals/ReceiptDetailModal";
import { DailyReconciliationModal } from "../modals/DailyReconciliationModal";

export interface CashierProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number; // NOTE: Cost price is strictly stripped from cashier view
  stock: number;
}

interface ParkedCart {
  id: string;
  timestamp: string;
  items: { product: CashierProduct; qty: number }[];
  customerName?: string;
  total: number;
}

interface CashierCustomer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentDebt: number;
  headroom: number;
  status: "active" | "suspended";
}

interface CashierPortalProps {
  cashierName?: string;
  storeName?: string;
  products?: CashierProduct[];
  cashInDrawer?: number;
  onLogout?: () => void;
  triggerToast: (msg: string) => void;
}

type CashierTab = "register" | "shift" | "receipts" | "customers";

export function CashierPortal({
  cashierName = "Adaeze Okon (POS-1)",
  storeName = "Alpha Retail Ltd",
  products: initialProducts,
  cashInDrawer: initialCash = 250000,
  onLogout,
  triggerToast,
}: CashierPortalProps) {
  const [activeTab, setActiveTab] = useState<CashierTab>("register");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Products Catalog (Sanitized - Zero Cost Prices)
  const [products, setProducts] = useState<CashierProduct[]>(
    initialProducts || [
      { id: "1", name: "Paracetamol 500mg Pack (100s)", category: "Pharmacy", sku: "MED-001", price: 850, stock: 120 },
      { id: "2", name: "Amoxicillin 500mg (20 Caps)", category: "Pharmacy", sku: "MED-002", price: 1800, stock: 85 },
      { id: "3", name: "Vitamin C 1000mg Effervescent (20s)", category: "Pharmacy", sku: "MED-003", price: 3200, stock: 40 },
      { id: "4", name: "Ibuprofen 400mg (10s)", category: "Pharmacy", sku: "MED-004", price: 650, stock: 150 },
      { id: "5", name: "Artemether-Lumefantrine ACT (24s)", category: "Pharmacy", sku: "MED-005", price: 2600, stock: 60 },
      { id: "6", name: "Golden Penny Semovita 2kg", category: "Supermarket", sku: "GROC-101", price: 3500, stock: 50 },
      { id: "7", name: "Royal Stallion Rice 5kg", category: "Supermarket", sku: "GROC-102", price: 11200, stock: 28 },
      { id: "8", name: "Refined Sunflower Oil 3L", category: "Supermarket", sku: "GROC-103", price: 5900, stock: 18 },
      { id: "9", name: "Eva Mineral Water 75cl", category: "Beverages", sku: "BEV-201", price: 250, stock: 240 },
      { id: "10", name: "Fearless Energy Drink 500ml", category: "Beverages", sku: "BEV-203", price: 500, stock: 120 },
      { id: "11", name: "Hypo Super Bleach 500ml", category: "Household", sku: "CLN-301", price: 700, stock: 60 },
      { id: "12", name: "Dettol Antiseptic 250ml", category: "Household", sku: "CLN-302", price: 2600, stock: 35 },
    ]
  );

  // Active Cart State
  const [cart, setCart] = useState<{ product: CashierProduct; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cashInDrawer, setCashInDrawer] = useState(initialCash);
  const [isShiftLocked, setIsShiftLocked] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<any>(null);

  // Split Tender Modal State
  const [isSplitTenderOpen, setIsSplitTenderOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [cardRef, setCardRef] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferRef, setTransferRef] = useState<string>("");
  const [debtAmount, setDebtAmount] = useState<string>("");
  const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<string>("");

  // Parked Carts (Persistent in localStorage)
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [isParkedDrawerOpen, setIsParkedDrawerOpen] = useState(false);

  // Offline Queue
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Customers for Credit Lookup
  const [customers] = useState<CashierCustomer[]>([
    {
      id: "cust-1",
      name: "Alhaji Danladi Enterprises",
      phone: "0803 123 4567",
      creditLimit: 150000,
      currentDebt: 45000,
      headroom: 105000,
      status: "active",
    },
    {
      id: "cust-2",
      name: "Mrs. Folashade Adeleke",
      phone: "0802 987 6543",
      creditLimit: 50000,
      currentDebt: 48000,
      headroom: 2000,
      status: "active",
    },
    {
      id: "cust-3",
      name: "Emeka & Sons Provisions",
      phone: "0814 555 7788",
      creditLimit: 100000,
      currentDebt: 100000,
      headroom: 0,
      status: "suspended",
    },
  ]);

  // Load Parked Carts from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ease_me_parked_carts_pos1");
        if (saved) {
          setParkedCarts(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to load parked carts:", err);
      }
    }
  }, []);

  // Save Parked Carts to localStorage
  const saveParkedCarts = (updated: ParkedCart[]) => {
    setParkedCarts(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ease_me_parked_carts_pos1", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save parked carts:", err);
      }
    }
  };

  const [receiptsLog, setReceiptsLog] = useState([
    {
      id: "TX-7812",
      time: "10:14 AM",
      items: "Paracetamol 500mg (x2), Eva Mineral Water 75cl (x4)",
      amount: 2700,
      method: "cash",
      cashier: cashierName,
    },
    {
      id: "TX-7809",
      time: "09:42 AM",
      items: "Royal Stallion Rice 5kg (x1), Fearless Drink (x2)",
      amount: 12200,
      method: "bank_transfer",
      cashier: cashierName,
    },
    {
      id: "TX-7798",
      time: "09:05 AM",
      items: "Artemether ACT (x1)",
      amount: 2600,
      method: "card",
      cashier: cashierName,
    },
  ]);

  const categories = ["all", "Pharmacy", "Supermarket", "Beverages", "Household"];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: CashierProduct) => {
    if (isShiftLocked) {
      triggerToast("Shift is locked. Complete reconciliation to resume.");
      return;
    }
    if (product.stock <= 0) {
      triggerToast(`"${product.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          triggerToast(`Cannot exceed available stock of ${product.stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: CashierProduct; qty: number }[]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  // Park Cart Action (up to 10 carts)
  const handleParkCart = () => {
    if (cart.length === 0) return;
    if (parkedCarts.length >= 10) {
      triggerToast("Maximum of 10 parked carts reached. Resume or discard existing held carts.");
      return;
    }

    const newParked: ParkedCart = {
      id: `PARK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: cart,
      total: cartTotal,
    };

    saveParkedCarts([newParked, ...parkedCarts]);
    setCart([]);
    triggerToast(`Cart parked as ${newParked.id}. Stored in terminal memory.`);
  };

  // Resume Parked Cart Action
  const handleResumeCart = (parked: ParkedCart) => {
    if (cart.length > 0) {
      triggerToast("Active cart is not empty. Park or clear current cart first.");
      return;
    }
    setCart(parked.items);
    saveParkedCarts(parkedCarts.filter((p) => p.id !== parked.id));
    setIsParkedDrawerOpen(false);
    triggerToast(`Resumed cart ${parked.id}`);
  };

  // Open Split Tender Modal
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;
    if (isShiftLocked) {
      triggerToast("Register is locked for end-of-day closing.");
      return;
    }
    setCashAmount(cartTotal.toString());
    setCashTendered(cartTotal.toString());
    setCardAmount("");
    setTransferAmount("");
    setDebtAmount("");
    setIsSplitTenderOpen(true);
  };

  // Finalize Transaction from Split Tender Modal
  const handleFinalizeSplitTender = () => {
    const cAmount = parseFloat(cashAmount) || 0;
    const cdAmount = parseFloat(cardAmount) || 0;
    const tAmount = parseFloat(transferAmount) || 0;
    const dAmount = parseFloat(debtAmount) || 0;
    const totalTendered = cAmount + cdAmount + tAmount + dAmount;

    if (Math.abs(totalTendered - cartTotal) > 0.01) {
      triggerToast(`Split amounts (₦${totalTendered.toLocaleString()}) must exactly equal cart total (₦${cartTotal.toLocaleString()})`);
      return;
    }

    // Customer Debt Check
    if (dAmount > 0) {
      const cust = customers.find((c) => c.id === selectedCustomerForDebt);
      if (!cust) {
        triggerToast("Please select an approved customer for the debt tab.");
        return;
      }
      if (dAmount > cust.headroom) {
        triggerToast(`Credit exceeds available headroom of ₦${cust.headroom.toLocaleString()}. Requires Manager PIN.`);
        return;
      }
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart.find((item) => item.product.id === p.id);
        if (inCart) {
          return { ...p, stock: Math.max(0, p.stock - inCart.qty) };
        }
        return p;
      })
    );

    // Increase drawer cash if cash tender included
    if (cAmount > 0) {
      setCashInDrawer((prev) => prev + cAmount);
    }

    const receiptData = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: cart.map((i) => `${i.product.name} (x${i.qty})`).join(", "),
      amount: cartTotal,
      method:
        cAmount === cartTotal
          ? "cash"
          : cdAmount === cartTotal
          ? "card"
          : tAmount === cartTotal
          ? "bank_transfer"
          : "split_tender",
      cashier: cashierName,
    };

    setRecentReceipt(receiptData);
    setReceiptsLog((prev) => [receiptData, ...prev]);
    setCart([]);
    setIsSplitTenderOpen(false);
    triggerToast(`✓ Transaction finalized: ₦${cartTotal.toLocaleString()}`);
  };

  const calculatedCashChange = Math.max(0, (parseFloat(cashTendered) || 0) - (parseFloat(cashAmount) || 0));

  const navigationItems = [
    {
      id: "register" as CashierTab,
      label: "POS Register",
      description: "Barcode scan & active checkout",
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length}` : undefined,
    },
    {
      id: "shift" as CashierTab,
      label: "Shift & Drawer Cash",
      description: "Opening float & daily closing",
      icon: LockKeyhole,
    },
    {
      id: "receipts" as CashierTab,
      label: "Today's Receipts",
      description: "Recent transactions & reprints",
      icon: Receipt,
      badge: `${receiptsLog.length}`,
    },
    {
      id: "customers" as CashierTab,
      label: "Credit Lookup",
      description: "Customer headroom & tabs",
      icon: Users,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none font-sans">
      {/* ======================= SIDEBAR NAVIGATION ======================= */}
      <aside
        className={`${
          sidebarOpen ? "w-56" : "w-16"
        } transition-all duration-200 flex flex-col shrink-0 bg-white border-r border-slate-200 z-20`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <ShoppingCart size={16} />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs tracking-tight text-slate-900 truncate">{storeName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">
                  POS Terminal 1
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${isActive ? "text-indigo-700" : "text-slate-500"}`}
                />
                {sidebarOpen && (
                  <div className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-700 text-white font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="p-2 rounded-md bg-white border border-slate-200 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span>Cash In Drawer</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  ₦{cashInDrawer.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate text-[11px]">{cashierName}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Cost Margins Shielded</p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title={`Drawer: ₦${cashInDrawer.toLocaleString()}`}></span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              {navigationItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-[11px] text-slate-500">
              {navigationItems.find((i) => i.id === activeTab)?.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Parked Carts Trigger */}
            <button
              onClick={() => setIsParkedDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
            >
              <PauseCircle size={13} className="text-indigo-700" />
              <span>Held Carts ({parkedCarts.length})</span>
            </button>

            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Online Sync
            </span>

            <button
              onClick={() => setIsReconcileOpen(true)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <LockKeyhole size={12} />
              <span>Shift Reconciliation</span>
            </button>
          </div>
        </header>

        {/* ======================= TAB: REGISTER & CHECKOUT ======================= */}
        {activeTab === "register" && (
          <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Catalog Grid (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Search & Categories */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Scan barcode or type SKU / product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-xs">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                        selectedCategory === c
                          ? "bg-indigo-700 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock || isShiftLocked}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all bg-white ${
                        isOutOfStock
                          ? "opacity-40 border-slate-200 cursor-not-allowed"
                          : "hover:border-indigo-600 hover:shadow-xs border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span>{p.sku}</span>
                          <span className={p.stock <= 10 ? "text-rose-600 font-bold" : ""}>
                            {p.stock} left
                          </span>
                        </div>
                        <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          ₦{p.price.toLocaleString()}
                        </span>
                        <span className="p-1 rounded bg-indigo-50 text-indigo-700">
                          <Plus size={12} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Cart & Tender Panel (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col h-[calc(100vh-6rem)] sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <ShoppingCart size={15} className="text-indigo-700" />
                  <span>Current Cart ({cart.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleParkCart}
                    disabled={cart.length === 0}
                    className="p-1 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded flex items-center gap-1 font-semibold disabled:opacity-30"
                    title="Hold cart in terminal memory"
                  >
                    <PauseCircle size={13} />
                    <span>Hold</span>
                  </button>
                  <button
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Clear cart"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Cart Line Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        ₦{item.product.price.toLocaleString()} each
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono text-slate-900 w-16 text-right">
                      ₦{(item.product.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <ShoppingCart size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Cart is empty</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Scan barcodes or click items to ring up sale.</p>
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-600 uppercase">Subtotal:</span>
                  <span className="text-xl font-bold font-mono text-slate-900">
                    ₦{cartTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={handleInitiateCheckout}
                  disabled={cart.length === 0 || isShiftLocked}
                  className="w-full py-2.5 px-4 rounded-md bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span>Split Tender & Complete Sale</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: SHIFT & DRAWER ======================= */}
        {activeTab === "shift" && (
          <div className="p-6 max-w-3xl mx-auto space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Active Shift Drawer Reconciliation</h2>
              <p className="text-xs text-slate-500">
                End-of-day blind closing flow. Count physical cash in till without system expected cash preview.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => setIsReconcileOpen(true)}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-md shadow-xs"
                >
                  Open Blind Shift Count
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: TODAY'S RECEIPTS ======================= */}
        {activeTab === "receipts" && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Your Sales This Shift</h2>
                <span className="text-xs font-mono text-slate-500">{receiptsLog.length} Completed</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {receiptsLog.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{r.id}</span>
                        <span className="text-[11px] text-slate-400 font-mono">• {r.time}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{r.items}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-900">₦{r.amount.toLocaleString()}</div>
                      <button
                        onClick={() => setRecentReceipt(r)}
                        className="text-[11px] text-indigo-700 font-semibold hover:underline mt-1"
                      >
                        Reprint Thermal Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: CUSTOMER CREDIT LOOKUP ======================= */}
        {activeTab === "customers" && (
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Customer Credit & Headroom Lookup</h2>
                  <p className="text-xs text-slate-500">Check credit limits and available headroom before issuing goods on credit.</p>
                </div>
                <span className="text-xs font-mono text-slate-500">{customers.length} Approved</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">Customer Name</th>
                      <th className="py-2.5 px-4">Phone</th>
                      <th className="py-2.5 px-4 text-right">Credit Limit</th>
                      <th className="py-2.5 px-4 text-right">Outstanding Debt</th>
                      <th className="py-2.5 px-4 text-right">Available Headroom</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{c.phone}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          ₦{c.creditLimit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          ₦{c.currentDebt.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          ₦{c.headroom.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              c.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================= SPLIT TENDER MODAL ======================= */}
      {isSplitTenderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Split Tender Settlement</h3>
                <p className="text-[11px] text-slate-500">Divide payment across Cash, Card, Bank Transfer, and Credit Tab.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Total Sale Due</span>
                <span className="text-base font-bold font-mono text-indigo-700">
                  ₦{cartTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tender Options */}
            <div className="space-y-3">
              {/* 1. Cash Tender */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Banknote size={14} className="text-emerald-600" />
                    Cash Tender (₦)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Change Due: <strong className="text-emerald-700 font-bold">₦{calculatedCashChange.toFixed(2)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Amount applied to sale</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Customer Cash Handed</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* 2. POS Card Tender */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-blue-600" />
                  POS Terminal / Debit Card (₦)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="Card Amount (₦)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                  <input
                    type="text"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    placeholder="Auth Code / RRN #"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              {/* 3. Bank Transfer Tender */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-purple-600" />
                  Bank Transfer (₦)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Transfer Amount (₦)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="Bank Reference / Session ID"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              {/* 4. Customer Debt Tab */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users size={14} className="text-amber-600" />
                  Customer Credit Ledger (Tab)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedCustomerForDebt}
                    onChange={(e) => setSelectedCustomerForDebt(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-700"
                  >
                    <option value="">Select Debtor Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Headroom: ₦{c.headroom.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="Debt Amount (₦)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono font-bold text-amber-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSplitTenderOpen(false)}
                className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeSplitTender}
                className="px-4 py-1.5 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md shadow-xs"
              >
                Authorize & Finalize Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= PARKED CARTS DRAWER ======================= */}
      {isParkedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm h-full p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Parked Carts ({parkedCarts.length}/10)</h3>
              <button
                onClick={() => setIsParkedDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-xs"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {parkedCarts.map((p) => (
                <div key={p.id} className="p-3 border border-slate-200 rounded-md space-y-1.5 bg-slate-50">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-indigo-700">{p.id}</span>
                    <span className="text-[11px] text-slate-500">{p.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {p.items.map((i) => `${i.product.name} (x${i.qty})`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold font-mono text-slate-900">₦{p.total.toLocaleString()}</span>
                    <button
                      onClick={() => handleResumeCart(p)}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded shadow-xs"
                    >
                      Resume Cart
                    </button>
                  </div>
                </div>
              ))}

              {parkedCarts.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <PauseCircle size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No held carts</p>
                  <p className="text-[10px] text-slate-400">Click &quot;Hold&quot; in the active cart to park a transaction.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      <DailyReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        expectedCash={cashInDrawer}
        bankCollections={0}
        isShiftLocked={isShiftLocked}
        onUnlock={() => setIsShiftLocked(false)}
        onReconcile={(summary) => {
          setIsShiftLocked(true);
          triggerToast(`Shift finalized with ${summary.variance >= 0 ? "overage" : "shortage"} of ₦${Math.abs(summary.variance).toLocaleString()}`);
        }}
      />

      {/* Receipt Modal */}
      {recentReceipt && (
        <ReceiptDetailModal
          isOpen={Boolean(recentReceipt)}
          onClose={() => setRecentReceipt(null)}
          sale={{
            id: (recentReceipt as any).saleId || (recentReceipt as any).id || "REC-001",
            time: (recentReceipt as any).timestamp || new Date().toLocaleTimeString(),
            items: (recentReceipt as any).items ? (recentReceipt as any).items.map((i: any) => `${i.productName || i.name} x${i.quantity}`).join("; ") : "Items",
            amount: (recentReceipt as any).total || 0,
            method: (recentReceipt as any).paymentMethod || "Cash",
            cashier: (recentReceipt as any).cashierName || "Cashier",
          }}
        />
      )}
    </div>
  );
}
