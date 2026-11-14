import "dotenv/config";
import { db } from "./index";
import {
  businesses,
  plans,
  planFeatures,
  subscriptions,
  productCategories,
  products,
  customers,
  suppliers,
  expenses,
  expenseCategories,
  sales,
  saleItems,
  payments,
  dailyClosings,
  businessMembers,
} from "./schema";
import { BusinessService } from "../lib/business/business-service";
import { PRICING_TIERS } from "../lib/subscriptions/pricing-plans";
import { eq, and } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting Ease Me database seeder...\n");

  // 1. Seed Subscription Plans & Features
  console.log("1. Seeding Commercial Subscription Plans...");
  const planRecords: Record<string, string> = {};

  for (const [tierKey, tierConfig] of Object.entries(PRICING_TIERS)) {
    const existing = await db
      .select()
      .from(plans)
      .where(eq(plans.name, tierConfig.name))
      .limit(1);

    let planId: string;
    if (existing.length > 0) {
      planId = existing[0].id;
      console.log(`   - Plan "${tierConfig.name}" already exists.`);
    } else {
      const [newPlan] = await db
        .insert(plans)
        .values({
          name: tierConfig.name,
          description: tierConfig.description,
          price: tierConfig.monthlyPrice.toString(),
          billingInterval: "monthly",
          status: "active",
        })
        .returning();
      planId = newPlan.id;
      console.log(`   + Created Plan: "${tierConfig.name}" (₦${tierConfig.monthlyPrice.toLocaleString()}/mo)`);

      // Seed features
      for (const [featKey, limitVal] of Object.entries(tierConfig.features)) {
        await db
          .insert(planFeatures)
          .values({
            planId,
            featureKey: featKey,
            limitValue: limitVal,
          })
          .onConflictDoNothing();
      }
    }
    planRecords[tierKey] = planId;
  }

  // Ensure system permissions
  console.log("\n2. Verifying System RBAC Permissions...");
  await BusinessService.ensureSystemPermissions();
  console.log("   ✓ Permissions verified.");

  // 2. Seed Demo Retail Business
  console.log("\n3. Seeding Demo Retail Workspace...");
  const demoBusinessName = "Alpha Health & Retail Emporium Ltd";
  const [existingBiz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.name, demoBusinessName))
    .limit(1);

  let businessId: string;
  let ownerRoleId: string;
  let cashierRoleId: string;
  let inventoryRoleId: string;
  let accountantRoleId: string;

  if (existingBiz) {
    businessId = existingBiz.id;
    console.log(`   - Demo business "${demoBusinessName}" already exists (ID: ${businessId}).`);

    // Fetch existing roles
    const rolesList = await db.query.roles?.findMany?.({
      where: (r, { eq }) => eq(r.businessId, businessId),
    }) || [];

    ownerRoleId = rolesList.find((r: any) => r.name === "owner")?.id || "";
    cashierRoleId = rolesList.find((r: any) => r.name === "cashier")?.id || "";
    inventoryRoleId = rolesList.find((r: any) => r.name === "inventory_manager")?.id || "";
    accountantRoleId = rolesList.find((r: any) => r.name === "accountant")?.id || "";
  } else {
    const created = await BusinessService.createBusinessWithOwner({
      userId: "demo_owner_babatunde",
      userEmail: "owner@alpha-retail.ng",
      userName: "Alhaji Babatunde Bello",
      businessName: demoBusinessName,
      businessType: "pharmacy",
      currency: "NGN",
      phone: "+234 803 555 0192",
      address: "Plot 14, Admiralty Way, Lekki Phase 1, Lagos",
      openingCash: 250000,
    });

    businessId = created.business.id;
    ownerRoleId = created.roles.owner;
    cashierRoleId = created.roles.cashier;
    inventoryRoleId = created.roles.inventory_manager;
    accountantRoleId = created.roles.accountant;

    // Upgrade to Growth Plan for Demo Store
    if (planRecords.growth) {
      await db
        .update(subscriptions)
        .set({ planId: planRecords.growth })
        .where(eq(subscriptions.businessId, businessId));
    }

    console.log(`   + Created workspace: "${demoBusinessName}" (Upgraded to Growth Plan)`);
  }

  // 3. Seed Staff Members
  console.log("\n4. Seeding Staff Members & Segregation of Duties...");
  const demoStaff = [
    { userId: "demo_cashier_adaeze", roleId: cashierRoleId, email: "adaeze@alpha-retail.ng", name: "Adaeze Okon (POS-1)" },
    { userId: "demo_cashier_ibrahim", roleId: cashierRoleId, email: "ibrahim@alpha-retail.ng", name: "Ibrahim Musa (POS-2)" },
    { userId: "demo_inv_emeka", roleId: inventoryRoleId, email: "emeka@alpha-retail.ng", name: "Emeka Eze (Stock Mgr)" },
    { userId: "demo_acct_fatima", roleId: accountantRoleId, email: "fatima@alpha-retail.ng", name: "Fatima Aliyu (Accountant)" },
  ];

  for (const staff of demoStaff) {
    if (!staff.roleId) continue;
    const [exists] = await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.userId, staff.userId)
        )
      )
      .limit(1);

    if (!exists) {
      await db.insert(businessMembers).values({
        businessId,
        userId: staff.userId,
        roleId: staff.roleId,
        status: "active",
        joinedAt: new Date(),
      });
      console.log(`   + Added Staff: ${staff.name} (${staff.email})`);
    }
  }

  // 4. Seed Product Categories
  console.log("\n5. Seeding Product Categories...");
  const categoryDefs = [
    { name: "Pharmaceuticals & Healthcare", description: "Prescription & OTC medicines, vitamins, first aid" },
    { name: "Supermarket & Provisions", description: "Foodstuff, pantry staples, grains, and dairy" },
    { name: "Beverages & Cold Drinks", description: "Bottled water, energy drinks, juices, and soft drinks" },
    { name: "Household & Disinfectants", description: "Cleaning chemicals, detergents, and surface sanitizers" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const [existingCat] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.businessId, businessId),
          eq(productCategories.name, cat.name)
        )
      )
      .limit(1);

    if (existingCat) {
      catMap[cat.name] = existingCat.id;
    } else {
      const [inserted] = await db
        .insert(productCategories)
        .values({
          businessId,
          name: cat.name,
          description: cat.description,
        })
        .returning();
      catMap[cat.name] = inserted.id;
      console.log(`   + Category: ${cat.name}`);
    }
  }

  // 5. Seed 20 Realistic Nigerian Retail Products
  console.log("\n6. Seeding 20 Inventory Products & Cost Margins...");
  const demoProducts = [
    // Pharma
    { name: "Paracetamol 500mg Pack (100s)", cat: "Pharmaceuticals & Healthcare", sku: "MED-001", cost: 550, price: 850, stock: 120, min: 25 },
    { name: "Amoxicillin 500mg (20 Caps)", cat: "Pharmaceuticals & Healthcare", sku: "MED-002", cost: 1200, price: 1800, stock: 85, min: 20 },
    { name: "Vitamin C 1000mg Effervescent (20s)", cat: "Pharmaceuticals & Healthcare", sku: "MED-003", cost: 2200, price: 3200, stock: 40, min: 10 },
    { name: "Ibuprofen 400mg (10s)", cat: "Pharmaceuticals & Healthcare", sku: "MED-004", cost: 400, price: 650, stock: 150, min: 30 },
    { name: "Artemether-Lumefantrine ACT (24s)", cat: "Pharmaceuticals & Healthcare", sku: "MED-005", cost: 1800, price: 2600, stock: 60, min: 15 },
    { name: "Cough Relief Expectorant 100ml", cat: "Pharmaceuticals & Healthcare", sku: "MED-006", cost: 1100, price: 1650, stock: 35, min: 10 },
    // Supermarket
    { name: "Golden Penny Semovita 2kg", cat: "Supermarket & Provisions", sku: "GROC-101", cost: 2800, price: 3500, stock: 50, min: 15 },
    { name: "Royal Stallion Rice 5kg", cat: "Supermarket & Provisions", sku: "GROC-102", cost: 8500, price: 11200, stock: 28, min: 10 },
    { name: "Refined Sunflower Oil 3L", cat: "Supermarket & Provisions", sku: "GROC-103", cost: 4200, price: 5900, stock: 18, min: 8 },
    { name: "Milo Chocolate Malt 400g Refill", cat: "Supermarket & Provisions", sku: "GROC-104", cost: 2400, price: 3200, stock: 45, min: 12 },
    { name: "Peak Milk Powder 400g Tin", cat: "Supermarket & Provisions", sku: "GROC-105", cost: 2700, price: 3600, stock: 38, min: 10 },
    { name: "St. Louis Sugar Cubes 500g", cat: "Supermarket & Provisions", sku: "GROC-106", cost: 950, price: 1350, stock: 80, min: 20 },
    // Beverages
    { name: "Eva Natural Mineral Water 75cl", cat: "Beverages & Cold Drinks", sku: "BEV-201", cost: 150, price: 250, stock: 240, min: 50 },
    { name: "Coca-Cola Original 50cl PET", cat: "Beverages & Cold Drinks", sku: "BEV-202", cost: 280, price: 400, stock: 180, min: 40 },
    { name: "Fearless Energy Drink Red Berry 500ml", cat: "Beverages & Cold Drinks", sku: "BEV-203", cost: 350, price: 500, stock: 120, min: 30 },
    { name: "Chivita 100% Real Orange 1L", cat: "Beverages & Cold Drinks", sku: "BEV-204", cost: 1200, price: 1700, stock: 55, min: 15 },
    { name: "Hollandia Yoghurt Strawberry 1L", cat: "Beverages & Cold Drinks", sku: "BEV-205", cost: 1400, price: 1950, stock: 32, min: 10 },
    // Household
    { name: "Hypo Super Bleach 500ml", cat: "Household & Disinfectants", sku: "CLN-301", cost: 450, price: 700, stock: 60, min: 15 },
    { name: "Dettol Antiseptic Liquid 250ml", cat: "Household & Disinfectants", sku: "CLN-302", cost: 1850, price: 2600, stock: 35, min: 10 },
    { name: "Ariel Auto Washing Powder 1kg", cat: "Household & Disinfectants", sku: "CLN-303", cost: 2100, price: 2900, stock: 42, min: 12 },
  ];

  const seededProducts: any[] = [];
  for (const item of demoProducts) {
    const [existingProd] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.businessId, businessId),
          eq(products.sku, item.sku)
        )
      )
      .limit(1);

    if (existingProd) {
      seededProducts.push(existingProd);
    } else {
      const [inserted] = await db
        .insert(products)
        .values({
          businessId,
          categoryId: catMap[item.cat] || null,
          name: item.name,
          sku: item.sku,
          costPrice: item.cost.toString(),
          sellingPrice: item.price.toString(),
          currentStock: item.stock,
          minimumStockLevel: item.min,
          status: "active",
        })
        .returning();
      seededProducts.push(inserted);
    }
  }
  console.log(`   ✓ Seeded ${seededProducts.length} catalog products.`);

  // 6. Seed Customers & Debtors
  console.log("\n7. Seeding Customers & Debtors...");
  const demoCustomers = [
    { name: "Alhaji Musa Enterprises", phone: "+234 803 123 4567", balance: 40000, limit: 100000 },
    { name: "Chinedu Stores & Provision", phone: "+234 802 987 6543", balance: 18000, limit: 50000 },
    { name: "Grace Superette", phone: "+234 809 456 7890", balance: 0, limit: 30000 },
  ];

  for (const cust of demoCustomers) {
    const [existingCust] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          eq(customers.name, cust.name)
        )
      )
      .limit(1);

    if (!existingCust) {
      await db.insert(customers).values({
        businessId,
        name: cust.name,
        phone: cust.phone,
        notes: `Credit Limit: ₦${cust.limit.toLocaleString()}`,
        status: "active",
      });
      console.log(`   + Customer: ${cust.name} (Credit Limit: ₦${cust.limit.toLocaleString()})`);
    }
  }

  // 7. Seed Suppliers & Credit Obligations
  console.log("\n8. Seeding Suppliers & Payables...");
  const demoSuppliers = [
    { name: "Emzor Pharmaceuticals Direct", email: "sales@emzor.ng", phone: "+234 1 497 4500", balance: 150000 },
    { name: "Dangote Distribution Hub", email: "orders@dangote.com", phone: "+234 1 270 2000", balance: 80000 },
    { name: "Chi Limited Supply Depot", email: "supplies@chilimited.com", phone: "+234 1 271 2345", balance: 0 },
  ];

  for (const supp of demoSuppliers) {
    const [existingSupp] = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.businessId, businessId),
          eq(suppliers.name, supp.name)
        )
      )
      .limit(1);

    if (!existingSupp) {
      await db.insert(suppliers).values({
        businessId,
        name: supp.name,
        email: supp.email,
        phone: supp.phone,
        notes: `Payment Term: Net 30, Open Balance: ₦${supp.balance.toLocaleString()}`,
        status: "active",
      });
      console.log(`   + Supplier: ${supp.name} (Payable: ₦${supp.balance.toLocaleString()})`);
    }
  }

  // 8. Seed Operating Expenses with Receipts
  console.log("\n9. Seeding Operating Expenses with Cloudflare R2 Receipts...");
  const demoExpenses = [
    {
      desc: "Shop Generator Petrol (25L) - Daily Power",
      amount: 20000,
      source: "cash",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    },
    {
      desc: "Branded Packaging Bags (500pcs) & Twine",
      amount: 12000,
      source: "cash",
      receiptUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    },
    {
      desc: "Corporate Fiber Internet (Lekki Branch Monthly)",
      amount: 25000,
      source: "bank_transfer",
      receiptUrl: null,
    },
  ];

  for (const exp of demoExpenses) {
    const [existingExp] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.businessId, businessId),
          eq(expenses.description, exp.desc)
        )
      )
      .limit(1);

    if (!existingExp) {
      await db.insert(expenses).values({
        businessId,
        description: exp.desc,
        amount: exp.amount.toString(),
        paymentMethod: exp.source as any,
        status: "approved",
        expenseDate: new Date(),
        createdBy: "demo_owner_babatunde",
        approvedBy: "demo_owner_babatunde",
        approvedAt: new Date(),
        receiptUrl: exp.receiptUrl,
      });
      console.log(`   + Expense: ${exp.desc} (₦${exp.amount.toLocaleString()})`);
    }
  }

  console.log("\n✅ Database seeding successfully completed!");
  console.log("-------------------------------------------------------------------");
  console.log(`Workspace Name: ${demoBusinessName}`);
  console.log("Owner Login:    owner@alpha-retail.ng (User ID: demo_owner_babatunde)");
  console.log("Cashier Login:  adaeze@alpha-retail.ng (User ID: demo_cashier_adaeze)");
  console.log("-------------------------------------------------------------------\n");
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\n❌ Seeding failed with error:", err);
      process.exit(1);
    });
}
