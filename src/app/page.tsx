"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  PlusCircle,
  Wallet,
  LockKeyhole,
  Users,
  Truck,
  Building2,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  Store,
  CreditCard,
  Banknote,
  SlidersHorizontal,
  ChevronRight,
  Menu,
  FileSpreadsheet,
  Printer,
  FileText,
  TrendingUp,
  FolderOpen,
  Scale,
  ClipboardList,
  Layers,
  Package,
  Calendar,
  DollarSign,
  Tag,
  BarChart3,
  Coins,
  History,
  TrendingDown,
  ArrowRight,
  Eye,
  LogOut,
  UserPlus,
  ShieldAlert,
  Loader2,
} from "lucide-react";

import { AddProductModal, ProductItem } from "@/components/modals/AddProductModal";
import { RestockIntakeModal } from "@/components/modals/RestockIntakeModal";
import { StockAdjustmentModal } from "@/components/modals/StockAdjustmentModal";
import { LogExpenseModal } from "@/components/modals/LogExpenseModal";
import { DailyReconciliationModal } from "@/components/modals/DailyReconciliationModal";
import { CustomerRepaymentModal, CustomerItem } from "@/components/modals/CustomerRepaymentModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { AddSupplierModal, SupplierItem } from "@/components/modals/AddSupplierModal";
import { ReceiptDetailModal, SaleTransaction } from "@/components/modals/ReceiptDetailModal";
import { AddStaffModal } from "@/components/modals/AddStaffModal";
import { RevenueProfitChart } from "@/components/charts/RevenueProfitChart";
import { PaymentDistributionChart } from "@/components/charts/PaymentDistributionChart";

import { getCurrentContextAction } from "@/actions/auth-actions";
import { getDashboardDataAction } from "@/actions/dashboard-actions";
import { listProductsAction, createProductAction, recordInventoryMovementAction } from "@/actions/inventory-actions";
import { listSalesAction, recordSaleAction } from "@/actions/sale-actions";
import { listExpensesAction, logExpenseAction } from "@/actions/expense-actions";
import { listCustomersAction, createCustomerAction, recordCustomerRepaymentAction, listSuppliersAction, createSupplierAction } from "@/actions/parties-actions";
import { closeDayAction } from "@/actions/reconciliation-actions";
import { listStaffMembersAction, addStaffMemberAction, updateStaffRoleAction, removeStaffMemberAction } from "@/actions/staff-actions";
import { signOut } from "@/lib/auth/auth-client";
import { SystemRole } from "@/lib/security/permissions";
import {
  exportSalesToCSV,
  exportInventoryToCSV,
  exportCustomersToCSV,
  exportSuppliersToCSV,
  exportPnLToCSV,
} from "@/lib/export/export-utils";
import { BillingView } from "@/components/billing/BillingView";
import { getSubscriptionStatusAction } from "@/actions/subscription-actions";

import { SuperAdminDashboard } from "@/components/portals/SuperAdminDashboard";
import { CashierPortal } from "@/components/portals/CashierPortal";
import { CustomerPortal } from "@/components/portals/CustomerPortal";
import { RoleSwitcher, ActiveRole } from "@/components/auth/RoleSwitcher";

type NavSection =
  | "overview"
  | "pos"
  | "sales_history"
  | "inventory_catalog"
  | "inventory_restock"
  | "inventory_count"
  | "expenses"
  | "reconciliation"
  | "customers"
  | "suppliers"
  | "reports_pnl"
  | "reports_cash"
  | "reports_exposure"
  | "staff"
  | "billing";

export default function EaseMeApp() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<ActiveRole>("owner");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<NavSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Accordion Menu Open States
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    commerce: true,
    inventory: true,
    finance: true,
    parties: false,
    reports: false,
  });

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  // Financial State
  const [salesRevenue, setSalesRevenue] = useState(412000);
  const [cogs, setCogs] = useState(258000);
  const [expensesTotal, setExpensesTotal] = useState(32000);
  const [cashInDrawer, setCashInDrawer] = useState(285000);
  const [bankCollections, setBankCollections] = useState(102000);
  const [customerDebts, setCustomerDebts] = useState(58000);
  const [supplierObligations, setSupplierObligations] = useState(230000);
  const [isShiftLocked, setIsShiftLocked] = useState(false);

  // Data Collections
  const [productsList, setProductsList] = useState<ProductItem[]>([
    { id: "1", name: "Paracetamol 500mg Pack (100s)", category: "Pharmacy", sku: "MED-001", cost: 550, price: 850, stock: 92, minStock: 25 },
    { id: "2", name: "Premium Basmati Rice 5kg", category: "Supermarket", sku: "GROC-102", cost: 8500, price: 11200, stock: 14, minStock: 15 },
    { id: "3", name: "Refined Sunflower Oil 3L", category: "Supermarket", sku: "OIL-303", cost: 4200, price: 5900, stock: 6, minStock: 10 },
    { id: "4", name: "Sparkling Energy Drink 330ml", category: "Retail", sku: "BEV-504", cost: 350, price: 600, stock: 140, minStock: 30 },
    { id: "5", name: "Disinfectant Liquid 1L", category: "Cleaning", sku: "CLN-201", cost: 1200, price: 1750, stock: 22, minStock: 8 },
  ]);

  const [customersList, setCustomersList] = useState<CustomerItem[]>([
    { id: "1", name: "Alhaji Musa Enterprises", phone: "+234 803 123 4567", balance: 40000, limit: 100000, status: "Active" },
    { id: "2", name: "Chinedu Stores & Provision", phone: "+234 802 987 6543", balance: 18000, limit: 50000, status: "Active" },
    { id: "3", name: "Grace Superette", phone: "+234 809 456 7890", balance: 0, limit: 20000, status: "Active" },
  ]);

  const [suppliersList, setSuppliersList] = useState<SupplierItem[]>([
    { id: "1", name: "Emzor Pharmaceuticals Direct", contact: "sales@emzor.ng", balance: 150000, term: "Net 14" },
    { id: "2", name: "Dangote Distribution Hub", contact: "orders@dangote.com", balance: 80000, term: "Net 30" },
  ]);

  interface ExpenseItem {
    id: string;
    description: string;
    category: string;
    amount: number;
    source: string;
    time: string;
    receiptUrl?: string;
  }

  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([
    { id: "EXP-101", description: "Shop Generator Petrol (25L)", category: "utilities", amount: 20000, source: "cash", time: "09:30 AM" },
    { id: "EXP-102", description: "Branded Packaging Bags (500pcs)", category: "petty_cash", amount: 12000, source: "cash", time: "11:15 AM" },
  ]);

  const [salesHistory, setSalesHistory] = useState<SaleTransaction[]>([
    { id: "TX-9014", time: "10:14 AM", items: "Paracetamol 500mg (x4)", amount: 3400, method: "cash", cashier: "Adaeze (POS-1)" },
    { id: "TX-9013", time: "09:42 AM", items: "Basmati Rice 5kg (x1), Oil 3L (x1)", amount: 17100, method: "bank_transfer", cashier: "Adaeze (POS-1)" },
    { id: "TX-9012", time: "08:50 AM", items: "Sparkling Energy Drink (x12)", amount: 7200, method: "credit", cashier: "Adaeze (POS-1)", customer: "Alhaji Musa Enterprises" },
  ]);

  // Modal Visibility States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [repaymentCustomer, setRepaymentCustomer] = useState<CustomerItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleTransaction | null>(null);
  const [selectedProductSkuForRestock, setSelectedProductSkuForRestock] = useState<string>("");

  // Live Tenant & Staff State
  const [tenantContext, setTenantContext] = useState<any>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([
    { memberId: "m1", userId: "owner_admin", roleName: "owner", status: "active", joinedAt: new Date().toISOString() },
    { memberId: "m2", userId: "adaeze_cashier", roleName: "cashier", status: "active", joinedAt: new Date().toISOString() },
  ]);

  const loadSubscriptionStatus = async () => {
    try {
      const subRes = await getSubscriptionStatusAction();
      if (subRes && subRes.success && subRes.data) {
        setSubscriptionInfo(subRes.data);
      }
    } catch (e) {
      console.warn("Could not load subscription details:", e);
    }
  };

  // Initial Data Initialization from Server Actions
  useEffect(() => {
    async function loadWorkspace() {
      let initialRole: ActiveRole = "owner";
      let hasDemoAccess = false;

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlRole = params.get("role") as ActiveRole | null;
        const storedRole = localStorage.getItem("ease_me_active_role") as ActiveRole | null;
        const loggedInFlag = localStorage.getItem("ease_me_logged_in");

        if (urlRole && ["super_admin", "owner", "cashier", "customer"].includes(urlRole)) {
          initialRole = urlRole;
          localStorage.setItem("ease_me_active_role", urlRole);
          localStorage.setItem("ease_me_logged_in", "true");
          hasDemoAccess = true;
        } else if (storedRole && ["super_admin", "owner", "cashier", "customer"].includes(storedRole)) {
          initialRole = storedRole;
        }

        if (loggedInFlag === "true") {
          hasDemoAccess = true;
        }
      }

      try {
        const ctxRes = await getCurrentContextAction();
        if (ctxRes.success && ctxRes.context) {
          setTenantContext(ctxRes.context);
          setIsLiveMode(true);
          setIsAuthenticated(true);
          setActiveRole(initialRole);

          const [productsRes, customersRes, suppliersRes, expensesRes, salesRes, dashRes, staffRes, subRes] =
            await Promise.allSettled([
              listProductsAction(),
              listCustomersAction(),
              listSuppliersAction(),
              listExpensesAction(),
              listSalesAction({ limit: 50 }),
              getDashboardDataAction(),
              listStaffMembersAction(),
              getSubscriptionStatusAction(),
            ]);

          if (productsRes.status === "fulfilled" && productsRes.value.success && productsRes.value.products?.length) {
            setProductsList(
              productsRes.value.products.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: "Store Item",
                sku: p.sku || `SKU-${p.id.slice(0, 4)}`,
                cost: parseFloat(p.costPrice) || 0,
                price: parseFloat(p.sellingPrice) || 0,
                stock: p.currentStock || 0,
                minStock: p.minimumStockLevel || 10,
              }))
            );
          }

          if (customersRes.status === "fulfilled" && customersRes.value.success && customersRes.value.customers) {
            setCustomersList(
              customersRes.value.customers.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone || "No phone",
                balance: parseFloat(c.currentBalance) || 0,
                limit: 50000,
                status: c.status === "active" ? "Active" : "Inactive",
              }))
            );
          }

          if (suppliersRes.status === "fulfilled" && suppliersRes.value.success && suppliersRes.value.suppliers) {
            setSuppliersList(
              suppliersRes.value.suppliers.map((s: any) => ({
                id: s.id,
                name: s.name,
                contact: s.email || s.phone || "Direct",
                balance: parseFloat(s.currentBalance) || 0,
                term: "Net 30",
              }))
            );
          }

          if (expensesRes.status === "fulfilled" && expensesRes.value.success && expensesRes.value.expenses?.length) {
            setExpensesList(
              expensesRes.value.expenses.map((e: any) => ({
                id: `EXP-${e.id.slice(0, 4).toUpperCase()}`,
                description: e.description,
                category: e.categoryName?.toLowerCase() || "utilities",
                amount: parseFloat(e.amount) || 0,
                source: e.paymentMethod === "bank_transfer" ? "bank" : "cash",
                receiptUrl: e.receiptUrl || undefined,
                time: new Date(e.expenseDate || e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }))
            );
          }

          if (dashRes.status === "fulfilled" && dashRes.value.success && dashRes.value.data?.kpis) {
            const kpis = dashRes.value.data.kpis;
            setSalesRevenue(kpis.todaySales || 0);
            setExpensesTotal(kpis.todayExpenses || 0);
            setCashInDrawer(kpis.cashPosition || 0);
            setBankCollections(kpis.digitalCollections || 0);
            setCustomerDebts(kpis.customerReceivables || 0);
            setSupplierObligations(kpis.supplierObligations || 0);
          }

          if (staffRes.status === "fulfilled" && staffRes.value.success && staffRes.value.staff) {
            setStaffList(staffRes.value.staff);
          }

          if (subRes.status === "fulfilled" && subRes.value && subRes.value.success && subRes.value.data) {
            setSubscriptionInfo(subRes.value.data);
          }
        } else if (hasDemoAccess) {
          setIsAuthenticated(true);
          setActiveRole(initialRole);
        } else {
          // Strict route gating: unauthenticated visitors are sent to /login
          setIsAuthenticated(false);
          router.replace("/login");
          return;
        }
      } catch (err) {
        if (hasDemoAccess) {
          setIsAuthenticated(true);
          setActiveRole(initialRole);
        } else {
          setIsAuthenticated(false);
          router.replace("/login");
          return;
        }
      }
    }
    loadWorkspace();

    // Check payment callback
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("payment") === "success") {
        const plan = searchParams.get("plan") || "Growth";
        triggerToast(`🎉 Payment confirmed! Your workspace is now upgraded to ${plan.toUpperCase()}.`);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [router]);

  // POS & Filter State
  const [posCart, setPosCart] = useState<{ product: ProductItem; qty: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"cash" | "bank_transfer" | "credit">("cash");
  const [posSearch, setPosSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  // Toast / Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Calculations
  const grossProfit = salesRevenue - cogs;
  const netProfit = grossProfit - expensesTotal;
  const posCartTotal = posCart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const posCartCogs = posCart.reduce((sum, item) => sum + item.product.cost * item.qty, 0);

  // Handlers
  const handleAddToCart = (product: ProductItem) => {
    if (product.stock <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            if (newQty > item.product.stock) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleCheckout = async () => {
    if (posCart.length === 0) return;
    if (paymentType === "credit" && !selectedCustomerId) {
      alert("Please select a verified customer debtor for credit checkout.");
      return;
    }

    // If connected to live database, trigger Server Action
    if (isLiveMode && tenantContext) {
      try {
        const saleRes = await recordSaleAction({
          items: posCart.map((i) => ({
            productId: i.product.id,
            quantity: i.qty,
            unitPrice: i.product.price,
            discount: 0,
          })),
          discount: 0,
          tax: 0,
          isCreditSale: paymentType === "credit",
          customerId: selectedCustomerId || undefined,
          payments:
            paymentType !== "credit"
              ? [
                  {
                    paymentMethod: paymentType === "bank_transfer" ? "bank_transfer" : "cash",
                    amount: posCartTotal,
                  },
                ]
              : [],
        });

        if (!saleRes.success) {
          triggerToast(`⚠️ Sale error: ${(saleRes as any).error?.message || "Failed to save sale"}`);
        }
      } catch (err: any) {
        console.warn("Server action failed, updating locally:", err);
      }
    }

    // Deduct stock locally
    setProductsList((prev) =>
      prev.map((p) => {
        const cartItem = posCart.find((ci) => ci.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
      })
    );

    // Update financials
    setSalesRevenue((prev) => prev + posCartTotal);
    setCogs((prev) => prev + posCartCogs);

    if (paymentType === "cash") {
      setCashInDrawer((prev) => prev + posCartTotal);
    } else if (paymentType === "bank_transfer") {
      setBankCollections((prev) => prev + posCartTotal);
    } else if (paymentType === "credit") {
      setCustomerDebts((prev) => prev + posCartTotal);
      if (selectedCustomerId) {
        setCustomersList((prev) =>
          prev.map((c) =>
            c.id === selectedCustomerId ? { ...c, balance: c.balance + posCartTotal } : c
          )
        );
      }
    }

    const itemSummary = posCart.map((i) => `${i.product.name} (x${i.qty})`).join(", ");
    const newTx: SaleTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: itemSummary,
      amount: posCartTotal,
      method: paymentType,
      cashier: tenantContext?.userName ? `${tenantContext.userName} (POS-1)` : "Adaeze (POS-1)",
      customer: selectedCustomerId ? customersList.find((c) => c.id === selectedCustomerId)?.name : undefined,
    };

    setSalesHistory((prev) => [newTx, ...prev]);
    triggerToast(`✓ Sale of ₦${posCartTotal.toLocaleString()} completed successfully`);
    setSelectedReceipt(newTx);
    setPosCart([]);
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    if (isLiveMode && tenantContext) {
      try {
        await createProductAction({
          name: newProduct.name,
          sku: newProduct.sku,
          unit: "unit",
          costPrice: newProduct.cost,
          sellingPrice: newProduct.price,
          initialStock: newProduct.stock,
          minimumStockLevel: newProduct.minStock,
          trackInventory: true,
        });
      } catch (err) {
        console.warn("Product creation saved locally:", err);
      }
    }

    setProductsList((prev) => [newProduct, ...prev]);
    triggerToast(`✓ Added product "${newProduct.name}" to catalog`);
  };

  const handleRestock = async (data: { sku: string; qty: number; unitCost: number; supplierName: string }) => {
    const targetProduct = productsList.find((p) => p.sku === data.sku);

    if (isLiveMode && tenantContext && targetProduct) {
      try {
        await recordInventoryMovementAction({
          productId: targetProduct.id,
          movementType: "received",
          quantity: data.qty,
          unitCost: data.unitCost,
          reason: `Supplier Intake: ${data.supplierName}`,
        });
      } catch (err) {
        console.warn("Restock saved locally:", err);
      }
    }

    setProductsList((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          const totalExistingValue = p.stock * p.cost;
          const incomingValue = data.qty * data.unitCost;
          const newTotalStock = p.stock + data.qty;
          const newWac = Math.round((totalExistingValue + incomingValue) / (newTotalStock || 1));
          return {
            ...p,
            stock: newTotalStock,
            cost: newWac,
          };
        }
        return p;
      })
    );
    const invoiceTotal = data.qty * data.unitCost;
    setSupplierObligations((prev) => prev + invoiceTotal);
    triggerToast(`✓ Restocked ${data.qty} units of SKU ${data.sku}`);
  };

  const handleStockAdjustment = async (data: { sku: string; countedQty: number; reason: string; note: string }) => {
    const targetProduct = productsList.find((p) => p.sku === data.sku);
    if (isLiveMode && tenantContext && targetProduct) {
      try {
        const delta = data.countedQty - targetProduct.stock;
        if (delta !== 0) {
          await recordInventoryMovementAction({
            productId: targetProduct.id,
            movementType: delta < 0 ? "damaged" : "adjustment",
            quantity: delta,
            reason: `${data.reason}: ${data.note}`,
          });
        }
      } catch (err) {
        console.warn("Adjustment saved locally:", err);
      }
    }

    setProductsList((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          return {
            ...p,
            stock: data.countedQty,
          };
        }
        return p;
      })
    );
    triggerToast(`✓ Stock count updated for SKU ${data.sku}: ${data.countedQty} units logged`);
  };

  const handleAddExpense = async (expense: {
    description: string;
    category: string;
    amount: number;
    source: "cash" | "bank";
    receiptUrl?: string;
  }) => {
    if (isLiveMode && tenantContext) {
      try {
        await logExpenseAction({
          description: expense.description,
          amount: expense.amount,
          paymentMethod: expense.source === "bank" ? "bank_transfer" : "cash",
          requiresApproval: false,
          receiptUrl: expense.receiptUrl,
        });
      } catch (err) {
        console.warn("Expense saved locally:", err);
      }
    }

    const newEntry = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      source: expense.source,
      receiptUrl: expense.receiptUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setExpensesList((prev) => [newEntry, ...prev]);
    setExpensesTotal((prev) => prev + expense.amount);
    if (expense.source === "cash") {
      setCashInDrawer((prev) => Math.max(0, prev - expense.amount));
    }
    triggerToast(`✓ Logged expense of ₦${expense.amount.toLocaleString()}`);
  };

  const handleCustomerRepay = async (repayment: {
    customerId: string;
    amount: number;
    method: "cash" | "bank" | "card" | string;
    proofUrl?: string;
    externalReference?: string;
    notes?: string;
  }) => {
    if (isLiveMode && tenantContext) {
      try {
        await recordCustomerRepaymentAction({
          customerId: repayment.customerId,
          amount: repayment.amount,
          paymentMethod: repayment.method === "bank" ? "bank_transfer" : repayment.method === "card" ? "card" : "cash",
          referenceType: "customer_debt_repayment",
        });
      } catch (err) {
        console.warn("Repayment saved locally:", err);
      }
    }

    setCustomersList((prev) =>
      prev.map((c) =>
        c.id === repayment.customerId ? { ...c, balance: Math.max(0, c.balance - repayment.amount) } : c
      )
    );
    setCustomerDebts((prev) => Math.max(0, prev - repayment.amount));
    if (repayment.method === "cash") {
      setCashInDrawer((prev) => prev + repayment.amount);
    } else {
      setBankCollections((prev) => prev + repayment.amount);
    }
    triggerToast(`✓ Debt repayment of ₦${repayment.amount.toLocaleString()} received`);
    setRepaymentCustomer(null);
  };

  const handleReconcile = async (summary: { declaredCash: number; variance: number; varianceReason: string; notes: string }) => {
    if (isLiveMode && tenantContext) {
      try {
        await closeDayAction({
          actualCash: summary.declaredCash,
          notes: `${summary.varianceReason} - ${summary.notes}`,
        });
      } catch (err) {
        console.warn("Closing shift saved locally:", err);
      }
    }

    setIsShiftLocked(true);
    triggerToast(`✓ Daily Register Shift reconciled & locked. Variance: ₦${summary.variance.toLocaleString()}`);
  };

  const handleAddStaffMember = async (data: { userId: string; roleName: SystemRole }) => {
    if (isLiveMode && tenantContext) {
      const res = await addStaffMemberAction(data);
      if (!res.success) {
        throw new Error((res as any).error?.message || "Failed to add staff member.");
      }
    }

    const newMember = {
      memberId: `m_${Date.now()}`,
      userId: data.userId,
      roleName: data.roleName,
      status: "active",
      joinedAt: new Date().toISOString(),
    };
    setStaffList((prev) => [newMember, ...prev]);
    triggerToast(`✓ Added staff member "${data.userId}" with role ${data.roleName.toUpperCase()}`);
  };

  const handleUpdateStaffRole = async (memberId: string, newRole: SystemRole) => {
    if (isLiveMode && tenantContext) {
      const res = await updateStaffRoleAction({ memberId, newRoleName: newRole });
      if (!res.success) {
        triggerToast(`⚠️ ${(res as any).error?.message || "Failed to update role"}`);
        return;
      }
    }

    setStaffList((prev) =>
      prev.map((m) => (m.memberId === memberId ? { ...m, roleName: newRole } : m))
    );
    triggerToast(`✓ Role updated to ${newRole.toUpperCase()}`);
  };

  const handleRemoveStaffMember = async (memberId: string) => {
    if (isLiveMode && tenantContext) {
      const res = await removeStaffMemberAction(memberId);
      if (!res.success) {
        triggerToast(`⚠️ ${(res as any).error?.message || "Failed to remove staff"}`);
        return;
      }
    }

    setStaffList((prev) => prev.filter((m) => m.memberId !== memberId));
    triggerToast("✓ Staff member removed from workspace.");
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("ease_me_logged_in");
      localStorage.removeItem("ease_me_active_role");
      localStorage.removeItem("ease_me_user_email");
      window.location.href = "/login";
    }
  };

  const handleRoleChange = (role: ActiveRole) => {
    setActiveRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("ease_me_active_role", role);
    }
    triggerToast(`Switched view to ${role.replace("_", " ").toUpperCase()}`);
  };

  // Auth Gating Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
            <Store size={26} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Ease Me Business OS</h2>
            <p className="text-xs text-slate-400 mt-1">Verifying authenticated session & access permissions...</p>
          </div>
          <Loader2 size={20} className="animate-spin text-orange-500 mt-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Super Admin Platform Dashboard View
  if (activeRole === "super_admin") {
    return (
      <div className="relative min-h-screen bg-slate-50 text-slate-900">
        <SuperAdminDashboard
          onLogout={handleLogout}
          onSwitchToTenant={(tenantName) => {
            setActiveRole("owner");
            if (typeof window !== "undefined") {
              localStorage.setItem("ease_me_active_role", "owner");
            }
            triggerToast(`Impersonating store owner: ${tenantName}`);
          }}
          triggerToast={triggerToast}
        />
        <RoleSwitcher currentRole={activeRole} onSelectRole={handleRoleChange} onLogout={handleLogout} />
      </div>
    );
  }

  // Cashier Dedicated POS Terminal View
  if (activeRole === "cashier") {
    return (
      <div className="relative min-h-screen bg-slate-50 text-slate-900">
        <CashierPortal
          cashierName={tenantContext?.userName || "Adaeze Okon (POS-1)"}
          storeName={tenantContext?.businessName || "Alpha Health & Retail Emporium Ltd"}
          products={productsList.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            sku: p.sku,
            price: p.price,
            stock: p.stock,
          }))}
          cashInDrawer={cashInDrawer}
          onLogout={handleLogout}
          triggerToast={triggerToast}
        />
        <RoleSwitcher currentRole={activeRole} onSelectRole={handleRoleChange} onLogout={handleLogout} />
      </div>
    );
  }

  // Customer Self-Service Debt & Receipt Portal View
  if (activeRole === "customer") {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <CustomerPortal
          customerName={customersList[0]?.name || "Alhaji Musa Enterprises"}
          phone={customersList[0]?.phone || "+234 803 123 4567"}
          balance={customersList[0]?.balance || customerDebts}
          creditLimit={100000}
          storeName={tenantContext?.businessName || "Alpha Health & Retail Emporium Ltd"}
          onLogout={handleLogout}
          triggerToast={triggerToast}
        />
        <RoleSwitcher currentRole={activeRole} onSelectRole={handleRoleChange} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 ease-in-out flex flex-col shrink-0 bg-white/95 backdrop-blur-md border-r border-slate-200/80 z-20 select-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              EM
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900">Ease Me</span>
                <span className="text-[11px] uppercase font-bold tracking-wider text-orange-600">Business Control</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <Menu size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Categories with Standard Clean Submenus & Dedicated Icons */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* Section: Overview */}
          <div>
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-orange-50 text-orange-700 shadow-xs"
                  : "text-slate-800 hover:text-slate-950 hover:bg-slate-100/70"
              }`}
            >
              <LayoutDashboard size={18} className={activeTab === "overview" ? "text-orange-600" : "text-slate-700"} />
              {sidebarOpen && <span>Executive Dashboard</span>}
            </button>
          </div>

          {/* Section: Commerce & POS (Accordion) */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleMenu("commerce")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} className="text-slate-700" />
                {sidebarOpen && <span>Commerce & Sales</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${openMenus.commerce ? "" : "-rotate-90"}`}
                />
              )}
            </button>
            {openMenus.commerce && sidebarOpen && (
              <div className="space-y-0.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("pos")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "pos"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <ShoppingCart size={16} className={activeTab === "pos" ? "text-orange-600" : "text-slate-400"} />
                  <span>Sales Terminal (POS)</span>
                </button>
                <button
                  onClick={() => setActiveTab("sales_history")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "sales_history"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Receipt size={16} className={activeTab === "sales_history" ? "text-orange-600" : "text-slate-400"} />
                  <span>Receipts & Audit Log</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Inventory & Supply (Accordion) */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleMenu("inventory")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Boxes size={18} className="text-slate-700" />
                {sidebarOpen && <span>Inventory & Stock</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${openMenus.inventory ? "" : "-rotate-90"}`}
                />
              )}
            </button>
            {openMenus.inventory && sidebarOpen && (
              <div className="space-y-0.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("inventory_catalog")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "inventory_catalog"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Boxes size={16} className={activeTab === "inventory_catalog" ? "text-orange-600" : "text-slate-400"} />
                  <span>Product Catalog (SKUs)</span>
                </button>
                <button
                  onClick={() => {
                    setIsRestockOpen(true);
                    setActiveTab("inventory_catalog");
                  }}
                  className="w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium transition-colors"
                >
                  <PlusCircle size={16} className="text-slate-400" />
                  <span>Stock Intake (Restock)</span>
                </button>
                <button
                  onClick={() => {
                    setIsStockAdjustOpen(true);
                    setActiveTab("inventory_catalog");
                  }}
                  className="w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium transition-colors"
                >
                  <Scale size={16} className="text-slate-400" />
                  <span>Stock Count & Audit</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Financial Control (Accordion) */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleMenu("finance")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-slate-700" />
                {sidebarOpen && <span>Financial Control</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${openMenus.finance ? "" : "-rotate-90"}`}
                />
              )}
            </button>
            {openMenus.finance && sidebarOpen && (
              <div className="space-y-0.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "expenses"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Wallet size={16} className={activeTab === "expenses" ? "text-orange-600" : "text-slate-400"} />
                  <span>Operating Expenses</span>
                </button>
                <button
                  onClick={() => setActiveTab("reconciliation")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "reconciliation"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <LockKeyhole size={16} className={activeTab === "reconciliation" ? "text-orange-600" : "text-slate-400"} />
                  <span>Daily Shift Closing</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Parties & Ledgers (Accordion) */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleMenu("parties")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="text-slate-700" />
                {sidebarOpen && <span>Parties & Ledgers</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${openMenus.parties ? "" : "-rotate-90"}`}
                />
              )}
            </button>
            {openMenus.parties && sidebarOpen && (
              <div className="space-y-0.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "customers"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Users size={16} className={activeTab === "customers" ? "text-orange-600" : "text-slate-400"} />
                  <span>Customer Debtors</span>
                </button>
                <button
                  onClick={() => setActiveTab("suppliers")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "suppliers"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Truck size={16} className={activeTab === "suppliers" ? "text-orange-600" : "text-slate-400"} />
                  <span>Supplier Payables</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Intelligence & Reports (Accordion) */}
          <div className="space-y-0.5">
            <button
              onClick={() => toggleMenu("reports")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[15px] font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={18} className="text-slate-700" />
                {sidebarOpen && <span>Reports & Statements</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown
                  size={15}
                  className={`text-slate-500 transition-transform duration-200 ${openMenus.reports ? "" : "-rotate-90"}`}
                />
              )}
            </button>
            {openMenus.reports && sidebarOpen && (
              <div className="space-y-0.5 pt-0.5">
                <button
                  onClick={() => setActiveTab("reports_pnl")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "reports_pnl"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <TrendingUp size={16} className={activeTab === "reports_pnl" ? "text-orange-600" : "text-slate-400"} />
                  <span>Profit & Loss Statement</span>
                </button>
                <button
                  onClick={() => setActiveTab("reports_cash")}
                  className={`w-full flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-sm transition-all ${
                    activeTab === "reports_cash"
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                  }`}
                >
                  <Banknote size={16} className={activeTab === "reports_cash" ? "text-orange-600" : "text-slate-400"} />
                  <span>Liquidity & Collections</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Staff & Permissions */}
          <div>
            <button
              onClick={() => setActiveTab("staff")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-bold transition-all ${
                activeTab === "staff"
                  ? "bg-orange-50 text-orange-700 shadow-xs"
                  : "text-slate-800 hover:text-slate-950 hover:bg-slate-100/70"
              }`}
            >
              <ShieldCheck size={18} className={activeTab === "staff" ? "text-orange-600" : "text-slate-700"} />
              {sidebarOpen && <span>Staff & Permissions</span>}
            </button>
          </div>

          {/* Section: Billing & Plans */}
          <div>
            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-bold transition-all ${
                activeTab === "billing"
                  ? "bg-orange-50 text-orange-700 shadow-xs"
                  : "text-slate-800 hover:text-slate-950 hover:bg-slate-100/70"
              }`}
            >
              <CreditCard size={18} className={activeTab === "billing" ? "text-orange-600" : "text-slate-700"} />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span>Billing & Plans</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {subscriptionInfo?.currentPlan?.name ? subscriptionInfo.currentPlan.name.split(" ")[0] : "Starter"}
                  </span>
                </div>
              )}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {tenantContext ? (
            <div className="flex items-center justify-between p-2 rounded-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {tenantContext.userName ? tenantContext.userName.slice(0, 2).toUpperCase() : "US"}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{tenantContext.userName}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] text-slate-500 font-semibold uppercase">{tenantContext.roleName}</span>
                    </div>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-semibold text-slate-700">Active Test Mode</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  {activeRole}
                </span>
              </div>
              {sidebarOpen && (
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-center py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP CONTROL BAR */}
        <header className="h-16 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/60 text-sm font-semibold text-slate-800">
              <Store size={16} className="text-orange-600" />
              <span>{tenantContext?.businessName || "Ikeja Main Outlet (Demo)"}</span>
              {isLiveMode ? (
                <span className="ml-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                  LIVE DB
                </span>
              ) : (
                <span className="ml-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                  DEMO
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isShiftLocked ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              <span>Register Shift #042: <strong className="text-slate-900 font-bold">{isShiftLocked ? "LOCKED" : "OPEN"}</strong></span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLogExpenseOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
            >
              <Wallet size={15} />
              <span>+ Expense</span>
            </button>
            <button
              onClick={() => setIsRestockOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
            >
              <Boxes size={15} />
              <span>+ Restock</span>
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-xs transition-colors"
            >
              <ShoppingCart size={15} />
              <span>New Sale</span>
            </button>
          </div>
        </header>

        {/* Dynamic Alert Banner */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-sm px-6 py-2.5 font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100 font-bold text-base">
              ✕
            </button>
          </div>
        )}

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* ======================= TAB: EXECUTIVE OVERVIEW ======================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Executive Control Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Real-time financial visibility, gross profit estimation, and drawer liquidity.</p>
              </div>

              {/* HIGH-DENSITY 6-METRIC OPERATIONAL CASH FLOW STRIP */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Revenue */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Sales</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Inflow"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-slate-900 num-mono tracking-tight">
                      ₦{salesRevenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                      <ArrowUpRight size={11} />
                      <span>+14.8% vs last wk</span>
                    </p>
                  </div>
                </div>

                {/* 2. Est. Net Profit */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Net Profit</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Net Operating Margin"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-slate-900 num-mono tracking-tight">
                      ₦{netProfit.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Margin: <span className="num-mono font-semibold text-slate-700">{salesRevenue > 0 ? Math.round((netProfit / salesRevenue) * 100) : 0}%</span>
                    </p>
                  </div>
                </div>

                {/* 3. Cash In Drawer */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cash In Drawer</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Physical Liquid Cash"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-slate-900 num-mono tracking-tight">
                      ₦{cashInDrawer.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Shift #042 {isShiftLocked ? "(Locked)" : "(Active)"}
                    </p>
                  </div>
                </div>

                {/* 4. Bank Collections */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bank Digital</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Bank & POS Collections"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-slate-900 num-mono tracking-tight">
                      ₦{bankCollections.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Verified Settlements
                    </p>
                  </div>
                </div>

                {/* 5. Customer Debts */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Receivables</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Outstanding Customer Debt"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-amber-700 num-mono tracking-tight">
                      ₦{customerDebts.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      3 Active Debtors
                    </p>
                  </div>
                </div>

                {/* 6. Supplier Obligations */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs transition-colors hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Payables</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500" title="Supplier Obligations Due"></span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-bold text-rose-700 num-mono tracking-tight">
                      ₦{supplierObligations.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Net 14 / Net 30 Terms
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Operations Toolbar - High-Density Clean Strip */}
              <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-1">
                  <SlidersHorizontal size={14} className="text-orange-600" />
                  <span>Operations Bar:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                  <button
                    onClick={() => setIsRestockOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                  >
                    <Boxes size={13} />
                    <span>Intake Stock</span>
                  </button>
                  <button
                    onClick={() => setIsStockAdjustOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                  >
                    <Scale size={13} />
                    <span>Audit Count</span>
                  </button>
                  <button
                    onClick={() => setIsLogExpenseOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                  >
                    <Wallet size={13} />
                    <span>Log Expense</span>
                  </button>
                  <button
                    onClick={() => setIsReconcileOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    <LockKeyhole size={13} />
                    <span>Lock Register Shift</span>
                  </button>
                </div>
              </div>

              {/* FUNCTIONAL VISUAL PRESENTATION CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueProfitChart />
                </div>
                <div>
                  <PaymentDistributionChart
                    cashAmount={cashInDrawer}
                    bankAmount={bankCollections}
                    creditAmount={customerDebts}
                  />
                </div>
              </div>

              {/* Activity Log & Stock Watchlist */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-lg p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-orange-600" />
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Live Transaction Stream</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("sales_history")}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>View All</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {salesHistory.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReceipt(item)}
                        className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-md cursor-pointer transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-xs num-mono">{item.id}</span>
                            <span className="text-slate-400 text-[10px] num-mono">{item.time}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded uppercase ${
                                item.method === "cash"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.method === "bank_transfer"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {item.method.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs font-medium truncate max-w-md">{item.items}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-sm num-mono">₦{item.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.cashier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Low Stock Watchlist</h3>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      Alerts
                    </span>
                  </div>

                  <div className="space-y-2">
                    {productsList
                      .filter((p) => p.stock <= p.minStock)
                      .map((p) => (
                        <div key={p.id} className="p-2.5 rounded-md bg-amber-50/40 border border-amber-200/60 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium num-mono">SKU: {p.sku}</p>
                            </div>
                            <span className="text-xs font-bold text-amber-800 num-mono">
                              {p.stock} left
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProductSkuForRestock(p.sku);
                              setIsRestockOpen(true);
                            }}
                            className="w-full py-1 text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-900 rounded-md border border-amber-300 transition-colors flex items-center justify-center gap-1 shadow-xs"
                          >
                            <PlusCircle size={12} />
                            <span>Quick Restock</span>
                          </button>
                        </div>
                      ))}
                    {productsList.filter((p) => p.stock <= p.minStock).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6 font-medium">All stock levels healthy.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: SALES TERMINAL (POS) ======================= */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-7xl mx-auto h-[calc(100vh-8.5rem)]">
              {/* Product Catalog Picker */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col overflow-hidden shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Point of Sale Catalog</h2>
                    <p className="text-[11px] text-slate-500">Tap products to build active checkout order.</p>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search SKU or name..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {productsList
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(posSearch.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddToCart(p)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors flex flex-col justify-between ${
                          p.stock <= 0
                            ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                            : "bg-white hover:border-orange-400 border-slate-200/90 shadow-xs"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 num-mono">{p.sku}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded num-mono ${p.stock <= p.minStock ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                              {p.stock} in stock
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-900 mt-1 leading-snug">{p.name}</h4>
                          <span className="text-[10px] text-slate-500 font-medium">{p.category}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <span className="text-sm font-bold text-slate-900 num-mono">₦{p.price.toLocaleString()}</span>
                          <button
                            disabled={p.stock <= 0}
                            className="px-2.5 py-1 text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Checkout Cart Terminal */}
              <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col overflow-hidden shadow-xs">
                <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-orange-600" />
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Active Cart</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 num-mono">{posCart.length} item(s)</span>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                  {posCart.map((item) => (
                    <div key={item.product.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-base font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-500 font-medium tabular-nums">₦{item.product.price.toLocaleString()} ea</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center border border-slate-300 rounded bg-white">
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold tabular-nums text-slate-900 text-sm">{item.qty}</span>
                          <button
                            onClick={() => handleUpdateCartQty(item.product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-slate-900 min-w-18 text-right tabular-nums text-base">
                          ₦{(item.product.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {posCart.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm font-medium">
                      Cart is empty. Select products from the catalog.
                    </div>
                  )}
                </div>

                {/* Checkout Summary */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-bold text-slate-700">₦{posCartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-100">
                      <span className="text-base">Total Payable</span>
                      <span className="text-orange-600 tabular-nums text-xl font-black">₦{posCartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tender Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType("cash")}
                        className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          paymentType === "cash"
                            ? "bg-orange-50 border-orange-500 text-orange-700 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <Banknote size={16} />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("bank_transfer")}
                        className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          paymentType === "bank_transfer"
                            ? "bg-orange-50 border-orange-500 text-orange-700 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <CreditCard size={16} />
                        <span>Transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("credit")}
                        className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          paymentType === "credit"
                            ? "bg-orange-50 border-orange-500 text-orange-700 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <AlertTriangle size={16} />
                        <span>Credit</span>
                      </button>
                    </div>
                  </div>

                  {paymentType === "credit" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Select Customer Debtor</label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">-- Select Debtor --</option>
                        {customersList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Debt: ₦{c.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    disabled={posCart.length === 0}
                    onClick={handleCheckout}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold rounded-lg text-base shadow-xs transition-colors"
                  >
                    Confirm & Print Receipt (₦{posCartTotal.toLocaleString()})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB: INVENTORY CATALOG ======================= */}
          {(activeTab === "inventory_catalog" || activeTab === "inventory_restock" || activeTab === "inventory_count") && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog & Stock Management</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Atomic inventory levels, reorder thresholds, and Weighted Average Cost valuation.</p>
                </div>
                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => exportInventoryToCSV(productsList)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
                    title="Download Inventory CSV"
                  >
                    <FileSpreadsheet size={15} />
                    <span>Export Catalog</span>
                  </button>
                  <button
                    onClick={() => setIsStockAdjustOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Scale size={15} />
                    <span>Stocktake / Count</span>
                  </button>
                  <button
                    onClick={() => setIsRestockOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <PlusCircle size={15} />
                    <span>Receive Stock</span>
                  </button>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>New Product</span>
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="bg-white border border-slate-200/90 rounded-lg p-3 flex items-center justify-between shadow-xs">
                <div className="relative w-full max-w-sm">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter products by name or SKU..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-xs text-slate-600 font-medium num-mono">
                  {productsList.length} SKUs registered
                </span>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-2.5 px-3.5">SKU</th>
                      <th className="py-2.5 px-3.5">Item Name</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5 text-right">Unit Cost (WAC)</th>
                      <th className="py-2.5 px-3.5 text-right">Selling Price</th>
                      <th className="py-2.5 px-3.5 text-right">Stock</th>
                      <th className="py-2.5 px-3.5 text-right">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {productsList
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(inventorySearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3.5 font-semibold text-slate-800 num-mono">{p.sku}</td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-3.5 text-slate-600">{p.category}</td>
                          <td className="py-2.5 px-3.5 text-right num-mono text-slate-700">₦{p.cost.toLocaleString()}</td>
                          <td className="py-2.5 px-3.5 text-right num-mono font-bold text-slate-900">₦{p.price.toLocaleString()}</td>
                          <td className="py-2.5 px-3.5 text-right num-mono font-semibold text-slate-900">{p.stock} units</td>
                          <td className="py-2.5 px-3.5 text-right">
                            {p.stock <= 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 uppercase">
                                Out of Stock
                              </span>
                            ) : p.stock <= p.minStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase num-mono">
                                Low ({p.stock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedProductSkuForRestock(p.sku);
                                setIsRestockOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <PlusCircle size={11} />
                              <span>Restock</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: OPERATING EXPENSES ======================= */}
          {activeTab === "expenses" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Operating Expenses Ledger</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Track petty cash outflows, shop generator fuel, logistics, and store maintenance.</p>
                </div>
                <button
                  onClick={() => setIsLogExpenseOpen(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start"
                >
                  <Plus size={15} />
                  <span>Record Expense</span>
                </button>
              </div>

              {/* Expense Summary Tile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Total Expenses</span>
                  <p className="text-2xl font-bold text-slate-900 num-mono">₦{expensesTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Drawer Petty Cash</span>
                  <p className="text-2xl font-bold text-slate-700 num-mono">
                    ₦{expensesList.filter((e) => e.source === "cash").reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Corporate Transfer</span>
                  <p className="text-2xl font-bold text-slate-700 num-mono">
                    ₦{expensesList.filter((e) => e.source === "bank").reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-2.5 px-3.5">Ref</th>
                      <th className="py-2.5 px-3.5">Time</th>
                      <th className="py-2.5 px-3.5">Expense Description</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Source</th>
                      <th className="py-2.5 px-3.5">Proof / Receipt</th>
                      <th className="py-2.5 px-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {expensesList.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800 num-mono">{e.id}</td>
                        <td className="py-2.5 px-3.5 text-slate-500 num-mono">{e.time}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900">{e.description}</td>
                        <td className="py-2.5 px-3.5 text-slate-600 capitalize">{e.category.replace("_", " ")}</td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${e.source === "cash" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                            {e.source === "cash" ? "Petty Cash" : "Transfer"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {e.receiptUrl ? (
                            <a
                              href={e.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                              title="View Cloudflare R2 Proof"
                            >
                              <FileText size={13} />
                              <span>Receipt</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-bold text-slate-900 text-base">₦{e.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: DAILY RECONCILIATION ======================= */}
          {activeTab === "reconciliation" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daily Financial Closing & Lock</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Verify drawer physical cash against system expectation, audit variance, and lock shift.</p>
                </div>
                <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${isShiftLocked ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
                  {isShiftLocked ? "SHIFT LOCKED & FROZEN" : "SHIFT OPEN"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-2 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">System Expected Cash</span>
                  <p className="text-3xl font-bold text-slate-900 num-mono tracking-tight">₦{cashInDrawer.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Opening float + cash sales - cash expenses.</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-2 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Electronic Bank Collections</span>
                  <p className="text-3xl font-bold text-slate-900 num-mono tracking-tight">₦{bankCollections.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Direct transfer and card payments deposited to corporate accounts.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg p-6 text-center space-y-3 shadow-xs">
                <h3 className="text-base font-bold text-slate-900">End-of-Day Register Closing</h3>
                <p className="text-xs text-slate-600 max-w-lg mx-auto">
                  Input counted drawer physical notes to flag discrepancies and freeze register records.
                </p>
                <button
                  onClick={() => setIsReconcileOpen(true)}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <LockKeyhole size={15} />
                  <span>{isShiftLocked ? "View Closing Status / Unlock Shift" : "Initiate Daily Reconciliation Modal"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================= TAB: CUSTOMER DEBTORS ======================= */}
          {activeTab === "customers" && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Customer Credit & Debt Ledgers</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Track credit limits, active debts, and record customer repayments.</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => exportCustomersToCSV(customersList)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors"
                    title="Download Customer Debtors CSV"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Export Debtors</span>
                  </button>
                  <button
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>New Customer</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-2.5 px-3.5">Customer Name</th>
                      <th className="py-2.5 px-3.5">Phone / Contact</th>
                      <th className="py-2.5 px-3.5 text-right">Credit Limit</th>
                      <th className="py-2.5 px-3.5 text-right">Outstanding Debt</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-base">{c.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-sm font-medium">{c.phone}</td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 text-sm font-medium">₦{c.limit.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-bold text-amber-600 text-base">₦{c.balance.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            disabled={c.balance <= 0}
                            onClick={() => setRepaymentCustomer(c)}
                            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-700 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <Banknote size={14} />
                            <span>Receive Payment</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: SUPPLIER PAYABLES ======================= */}
          {activeTab === "suppliers" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Supplier Obligations & Payables</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Pending manufacturer invoices and trade credit terms.</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => exportSuppliersToCSV(suppliersList)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors border border-slate-200/90"
                    title="Download Supplier Payables CSV"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Export Payables</span>
                  </button>
                  <button
                    onClick={() => setIsAddSupplierOpen(true)}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>New Supplier</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider text-xs font-bold">
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Payment Terms</th>
                      <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliersList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs font-medium font-mono">{s.contact}</td>
                        <td className="py-3 px-4 text-slate-700 text-xs font-medium">{s.term}</td>
                        <td className="py-3 px-4 text-right num-mono tabular-nums font-bold text-rose-600">₦{s.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: SALES HISTORY ======================= */}
          {activeTab === "sales_history" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Receipts & Sales Audit Log</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Immutable transaction history and electronic receipt inspection.</p>
                </div>
                <button
                  onClick={() => exportSalesToCSV(salesHistory)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0 border border-slate-200/90"
                  title="Download Sales History CSV"
                >
                  <FileSpreadsheet size={14} />
                  <span>Export Sales CSV</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider text-xs font-bold">
                      <th className="py-3 px-4">Receipt ID</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4">Tender</th>
                      <th className="py-3 px-4">Attendant</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesHistory.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{s.id}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono tabular-nums text-xs">{s.time}</td>
                        <td className="py-3 px-4 text-slate-800 text-xs font-medium">{s.items}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            s.method === "cash"
                              ? "bg-slate-50 text-slate-700 border-slate-200"
                              : s.method === "bank_transfer"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {s.method.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{s.cashier}</td>
                        <td className="py-3 px-4 text-right num-mono tabular-nums font-bold text-slate-900">₦{s.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedReceipt(s)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors inline-flex items-center gap-1 border border-slate-200"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB: REPORTS P&L ======================= */}
          {(activeTab === "reports_pnl" || activeTab === "reports_cash" || activeTab === "reports_exposure") && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Financial Visibility & Statements</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Simplified financial performance statements without accounting jargon.</p>
                </div>
                <button
                  onClick={() =>
                    exportPnLToCSV({
                      salesRevenue,
                      cogs,
                      grossProfit,
                      expensesTotal,
                      netProfit,
                      cashInDrawer,
                      bankCollections,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                  title="Download Financial Statement CSV"
                >
                  <FileSpreadsheet size={14} />
                  <span>Export Statement (CSV)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <TrendingUp size={16} className="text-orange-600" />
                    <span>Profit & Loss Statement</span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Total Revenue:</span>
                      <span className="font-bold num-mono tabular-nums text-slate-900 text-sm">₦{salesRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Cost of Goods Sold (COGS):</span>
                      <span className="num-mono tabular-nums text-slate-700 font-semibold text-sm">-₦{cogs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-700 font-medium">Gross Profit:</span>
                      <span className="num-mono tabular-nums text-slate-900 font-bold text-sm">₦{grossProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Operating Expenses:</span>
                      <span className="num-mono tabular-nums text-slate-700 font-semibold text-sm">-₦{expensesTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 font-bold text-sm border-t border-slate-200 text-emerald-700">
                      <span>Net Business Profit:</span>
                      <span className="num-mono tabular-nums">₦{netProfit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Banknote size={16} className="text-blue-600" />
                    <span>Liquidity & Collections</span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Cash in Hand / Drawer:</span>
                      <span className="font-bold num-mono tabular-nums text-slate-900 text-sm">₦{cashInDrawer.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Electronic Bank Balance:</span>
                      <span className="font-bold num-mono tabular-nums text-slate-900 text-sm">₦{bankCollections.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 font-bold text-sm border-t border-slate-200 text-slate-900">
                      <span>Total Available Liquidity:</span>
                      <span className="num-mono tabular-nums text-orange-600">₦{(cashInDrawer + bankCollections).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>Net Working Capital Position</span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Customer Receivables (Debts):</span>
                      <span className="font-bold num-mono tabular-nums text-amber-700 text-sm">+₦{customerDebts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-600 font-medium">Supplier Obligations (Payables):</span>
                      <span className="font-bold num-mono tabular-nums text-rose-600 text-sm">-₦{supplierObligations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 font-bold text-sm border-t border-slate-200 text-slate-900">
                      <span>Net Trade Exposure:</span>
                      <span className="num-mono tabular-nums text-slate-900">
                        {customerDebts - supplierObligations >= 0
                          ? `+₦${(customerDebts - supplierObligations).toLocaleString()}`
                          : `-₦${Math.abs(customerDebts - supplierObligations).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= STAFF & PERMISSIONS VIEW ======================= */}
          {activeTab === "staff" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Role Permissions</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Manage team member access. Cashiers, managers, and accountants only see what is required for their duties.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                >
                  <UserPlus size={14} />
                  <span>+ Add Staff Member</span>
                </button>
              </div>

              {/* Staff Table */}
              <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-4">Role Assigned</th>
                        <th className="py-3 px-4">Access Scope</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {staffList.map((member) => (
                        <tr key={member.memberId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                {member.userId.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{member.userId}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  Joined {new Date(member.joinedAt || Date.now()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${
                                member.roleName === "owner"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : member.roleName === "admin"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : member.roleName === "cashier"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : member.roleName === "inventory_manager"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {member.roleName.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {member.roleName === "owner" && "Full administrative control & financial reports"}
                            {member.roleName === "admin" && "Operational control, inventory, and sales"}
                            {member.roleName === "cashier" && "POS Sales & customer view (no margin leakage)"}
                            {member.roleName === "inventory_manager" && "Stock receiving & count adjustments"}
                            {member.roleName === "accountant" && "Read-only financial statements & reconciliation"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Active</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {member.roleName !== "owner" && (
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  value={member.roleName}
                                  onChange={(e) => handleUpdateStaffRole(member.memberId, e.target.value as any)}
                                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                >
                                  <option value="cashier">Cashier</option>
                                  <option value="inventory_manager">Inventory Manager</option>
                                  <option value="accountant">Accountant</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveStaffMember(member.memberId)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Revoke Access"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Role Matrix Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Security & Anti-Theft Principle</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ease Me enforces strict segregation of duties: Cashiers cannot inspect business profit margins or delete historical transactions. Inventory managers record incoming shipments and physical counts, while stock variances are immediately flagged for owner review during end-of-day reconciliation.
                </p>
              </div>
            </div>
          )}

          {/* TAB: BILLING & PLANS */}
          {activeTab === "billing" && (
            <BillingView
              currentPlanName={subscriptionInfo?.currentPlan?.name || "Starter (Freemium)"}
              isPaidPlan={subscriptionInfo?.currentPlan?.isPaid || false}
              productCount={productsList.length}
              staffCount={staffList.length}
              onPlanChanged={async () => {
                await loadSubscriptionStatus();
                triggerToast("✓ Subscription state successfully updated!");
              }}
              triggerToast={triggerToast}
            />
          )}
        </main>
      </div>

      {/* ======================= MODAL DIALOGS ======================= */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onAddStaff={handleAddStaffMember}
        staffCount={staffList.length}
        maxStaff={subscriptionInfo?.quotas?.staff?.max ?? (tenantContext ? 1 : 999)}
        onUpgradeClick={() => setActiveTab("billing")}
      />
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAdd={handleAddProduct}
        productCount={productsList.length}
        maxProducts={subscriptionInfo?.quotas?.products?.max ?? (tenantContext ? 50 : 999)}
        onUpgradeClick={() => setActiveTab("billing")}
      />

      <RestockIntakeModal
        isOpen={isRestockOpen}
        onClose={() => {
          setIsRestockOpen(false);
          setSelectedProductSkuForRestock("");
        }}
        products={productsList}
        defaultSku={selectedProductSkuForRestock}
        onRestock={handleRestock}
      />

      <StockAdjustmentModal
        isOpen={isStockAdjustOpen}
        onClose={() => setIsStockAdjustOpen(false)}
        products={productsList}
        onAdjust={handleStockAdjustment}
      />

      <LogExpenseModal
        isOpen={isLogExpenseOpen}
        onClose={() => setIsLogExpenseOpen(false)}
        cashInDrawer={cashInDrawer}
        onAddExpense={handleAddExpense}
      />

      <DailyReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        expectedCash={cashInDrawer}
        bankCollections={bankCollections}
        isShiftLocked={isShiftLocked}
        onReconcile={handleReconcile}
        onUnlock={() => {
          setIsShiftLocked(false);
          triggerToast("Shift unlocked by Manager override.");
        }}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onAdd={(newCust) => {
          setCustomersList((prev) => [newCust, ...prev]);
          triggerToast(`✓ Added customer "${newCust.name}"`);
        }}
      />

      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onAdd={(newSupp) => {
          setSuppliersList((prev) => [newSupp, ...prev]);
          triggerToast(`✓ Added supplier "${newSupp.name}"`);
        }}
      />

      <CustomerRepaymentModal
        isOpen={!!repaymentCustomer}
        onClose={() => setRepaymentCustomer(null)}
        customer={repaymentCustomer}
        onRepay={handleCustomerRepay}
      />

      <ReceiptDetailModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        sale={selectedReceipt}
      />

      {/* Floating Interactive Role Switcher Pill */}
      <RoleSwitcher currentRole={activeRole} onSelectRole={handleRoleChange} onLogout={handleLogout} />
    </div>
  );
}
