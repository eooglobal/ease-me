Ease Me: Dashboard, Page and Build Instructions
Prepared for the engineering agent that will continue the build. Source of truth: the Ease Me Product Development Requirements v2.4.0.
1. How the Agent Must Use This Document
Think of this document as the architect's drawing handed to a builder who lost the plans halfway through a house. The builder must not improvise rooms. Every page, table and rule below is either confirmed by the specification or marked clearly as a decision.
Operating rules for the agent
• Audit before building. Before touching any code, list every route, component, table and server action that already exists. Compare it with this document. Report three lists: matches, mismatches, and missing items. Do not rewrite anything that already matches.
• Build one dashboard at a time, in the order in section 8. Do not begin the next phase until the current phase passes its acceptance checklist.
• Never invent a table, column, route or role that is not listed here. If something seems missing, stop and ask.
• Never write directly to products.currentStock. Every stock change goes through the inventory movement service.
• All money is handled as decimal strings or integer kobo, never as JavaScript floating point numbers.
• Every query is scoped by tenantId. Every list page must prove this with a test.
• After each phase run npx vitest run, npx tsc --noEmit and npm run build. A phase is not finished if any of the three fails.
• Report honestly. If something was not built or not tested, say so. Do not claim completion without evidence.
2. What the Product Is For
Ease Me answers six questions for a business owner without requiring accounting knowledge:
1. What do I have in stock, and what is it worth?
2. What did I sell today, and what did I actually earn?
3. Is any money or stock disappearing?
4. Who owes me, and who do I owe?
5. Is every cashier's drawer balanced?
6. What needs my attention right now?
Every page in the system must serve one of these six questions. A page that serves none of them should not exist. This is the filter for removing clutter.
3. Problems Found in the Specification
A skeptical reading of the document reveals contradictions that will cause the agent to hallucinate if left unresolved. Each item below carries a recommended decision. Confirm or change them before the build begins.
• Paystack webhook secret. The document says webhooks are verified with the tenant's secret key. Ease Me bills tenants for its own SaaS subscriptions, so verification must use the platform's own Paystack secret key. Recommended decision: one platform key, stored as an environment variable. Verify the signature on the raw request body before parsing JSON.
• Rate limit conflict. The architecture diagram says 10 requests per 10 seconds; section 7.3 says 30 per minute for checkout. Recommended decision: 30 per minute per cashier terminal for checkout, 10 per 10 seconds per IP for public portal routes. The diagram label is wrong.
• Shortage rule conflict. Section 4.3 says any shortage locks the shift and needs a co signature, while Module 3 says supervisor override applies only beyond plus or minus ₦500. Recommended decision: any shortage requires a written note; shortages above ₦500 additionally lock the shift until a manager signs; shortages of ₦500 or less close with a flag for review.
• Integer stock. currentStock is an integer, which fails for goods sold by weight or volume such as rice, fuel or fabric. Recommended decision: if any target tenant sells loose goods, change stock and quantity columns to numeric(12,3) now. Changing later is expensive.
• Missing tables. The schema shows only three tables, yet the system needs tenants, users, customers, customer debts, debt payments, shift sessions, suppliers, purchase orders, purchase order lines, expenses, product batches, audit logs, subscriptions and notifications. Recommended decision: the agent must propose the full schema for approval before writing migrations.
• Idempotency storage. The Idempotency Key needs a column with a unique index on (tenantId, idempotencyKey) in the sales table, otherwise the guarantee is only decorative.
• Row Level Security with Neon. RLS only works if the tenant identifier is set on the database session inside each transaction. Recommended decision: set it with a transaction scoped setting at the start of every request, and write a test that proves tenant A cannot read tenant B.
• Parked carts. Holding carts only in memory loses them on refresh. Recommended decision: store parked carts in local storage keyed by terminal.
• Offline mode and stock. An offline queue can oversell. Recommended decision: queued sales sync with their original timestamps; if stock is short at sync time, the sale is accepted and an exception is raised on the manager's attention list. A completed sale to a real customer must never be silently rejected.
• Voids and refunds. The spec has a return movement but no void or refund workflow. Recommended decision: only a manager can void or refund, always with a reason, always creating reversing records, never deleting rows.
• Dark mode. Prohibited by design. Do not add a theme toggle anywhere.
4. Role and Dashboard Map
Five workspaces, one per role. A user sees only the workspace for their role, and the sidebar for that role lists only the pages in this section.
• Store Owner (business_owner): full business oversight. Landing page /owner.
• Store Manager (admin): daily operations. Landing page /manager.
• Cashier (cashier): selling and shift handling. Landing page /pos.
• Customer (customer): own debt and invoices. Landing page /portal.
• Super Admin (super_admin): platform operations. Landing page /superadmin.
The agent must enforce role access in three places: the route guard, the server action or API handler, and the data query. Hiding a menu item alone is not security.
5. Shared Pages for All Roles
• Sign in (/login): email and password, forgot password. Redirects to the role landing page. No public registration for staff or customers; owners register through the signup flow below.
• Owner signup and onboarding (/signup, /onboarding): business name, business type (retail, pharmacy, supermarket, wholesale), currency, tax settings, first product import. A four step guided flow that ends on the owner dashboard with a setup checklist.
• Subscription locked (/locked): shown when a tenant is suspended or past the grace period. Explains why, shows the payment action for the owner, and shows a plain message for staff.
• Profile and password (/account): name, password change, active sessions.
• Not authorised and not found pages: plain, calm, with a button back to the role's landing page.
6. Dashboards and Pages in Detail
For each page: purpose, what it must show, and what it must not do.
6.1 Store Owner Workspace
The owner is the primary buyer. This workspace must make the owner feel in control within ten seconds of opening it.
/owner Overview
• Today's sales total, number of transactions, gross profit, and a comparison to the same weekday last week.
• Cash position: expected cash in tills, open shifts, shifts closed with variance.
• Attention panel: low stock items, expiring batches, overdue debtors, unsigned shifts, theft or shrinkage entries, failed payments. Each row links to the page that resolves it.
• Seven day sales chart and top five products by profit.
• Must not: show raw database counts without meaning, or decorative charts that answer no question.
/owner/sales: searchable list of all sales with filters for date, cashier, payment method and status. Detail drawer shows items, tender breakdown, cost snapshot and profit. Void and refund actions require a reason.
/owner/inventory
• Product list with stock, reorder point, cost, price, margin and status badge. Add, edit, archive, bulk import by spreadsheet, barcode assignment, category management.
• Product detail page with the full movement history for that product.
• /owner/inventory/adjustments: record damage, expiry, theft or audit corrections with mandatory reason. Theft entries write to the security audit log.
• /owner/inventory/batches: batch and expiry view with first expired, first out guidance. Visible and meaningful for pharmacy tenants; hidden for tenants who do not enable batches.
• /owner/inventory/stocktake: count sessions that compare counted quantity with system quantity and generate correction movements after approval.
/owner/purchases: purchase order list and creation, statuses DRAFT, ORDERED, PARTIALLY RECEIVED, FULFILLED, BILLED. Receiving a delivery creates purchase intake movements and recalculates weighted average cost. Landed costs such as transport and clearing fees can be added to the order and spread across lines.
/owner/suppliers: supplier directory, outstanding payables, payable aging, payment recording, supplier statement.
/owner/customers: customer list with credit limit, terms, outstanding debt, available headroom and last purchase. Create and edit customers, grant a portal invitation.
/owner/debtors: aging buckets Current (0 to 14 days), Due (15 to 30), Overdue (31 to 60), Bad Debt Risk (60 plus). Record repayment, view proof of transfer uploaded by the customer, approve or reject it. WhatsApp statement generator produces the formatted reminder text. Must not allow editing a debt balance directly; balances change only through sales and repayments.
/owner/expenses: category based expense ledger with date, amount, category, receipt attachment and who recorded it.
/owner/reports
• Income statement with the date filters from the specification.
• Cash flow view of real inflows against accrued revenue.
• Inventory valuation at weighted average cost.
• Sales by product, category, cashier and payment method.
• Shrinkage and loss report.
• Every report exports to PDF and CSV. Every figure must reconcile with the underlying ledger; the agent must write tests proving it.
/owner/shifts: history of every shift with opening float, expected cash, declared cash, variance, notes and signatures. Highlight cashiers with repeated shortages.
/owner/staff: create staff, assign role, reset access, deactivate. Deactivation never deletes history.
/owner/audit: filterable security and activity log covering price changes, cost changes, adjustments, voids, overrides, logins and exports.
/owner/settings: business profile, receipt template, tax rate, credit terms defaults, manager PIN, reorder defaults, payment accounts shown to customers.
/owner/billing: current plan, usage against limits, invoices, upgrade and payment.
6.2 Store Manager Workspace
The manager runs the day. This role sees operations, not ownership matters.
• /manager: today's operations board with open shifts, pending approvals, low stock, expiring items and exceptions.
• /manager/approvals: one queue for shift sign offs, audit corrections, purchase intake approvals, and credit limit overrides.
• /manager/shifts: open and close shifts, review variances, co sign shortages.
• /manager/inventory: the same inventory pages as the owner, including adjustments and stocktake, with cost visible.
• /manager/purchases: create and receive purchase orders.
• /manager/customers and /manager/debtors: manage customers and record repayments.
• /manager/sales: view and, within limits, void sales.
• /manager/schedule: staff scheduling.
Must not exist for the manager: subscription billing, tenant deletion, the full income statement and owner level profit reports unless the owner enables that permission, audit log deletion, and role changes for the owner account. Where a page is shared with the owner, reuse the same component with permission flags rather than copying code.
6.3 Cashier Workspace
The cashier workspace must be fast, quiet and nearly impossible to misuse. It runs on cheap screens in glare, so contrast and touch target size matter more than beauty.
• /pos Terminal: barcode scan or search, cart, quantity edit, line discounts only within a permitted limit, hold and resume up to 10 carts, customer attach, split tender (cash with change calculation, card with reference, transfer with reference, customer debt), complete sale, receipt print or share.
• /pos/shift: open shift with declared opening float; close shift using the blind flow. The expected total must never be sent to the browser before the cashier submits the count. Include the denomination counter.
• /pos/sales: the cashier's own sales for the current shift only, with reprint. No refunds without a manager PIN.
• /pos/customers: lookup showing the customer's name, available credit headroom and status only.
Must never appear for the cashier: cost price, supplier, margin, profit, total cost snapshot, other cashiers' sales, expected cash before count submission, reports, or any navigation outside these pages. The agent must serialize cashier data through a dedicated CashierProductView mapper, and a test must fail if any cost field leaks into an API response.
6.4 Customer Portal
A small, reassuring page set. Customers are often anxious about money they owe, so clarity and tone matter.
• /portal: outstanding balance, credit limit, available headroom, next due date.
• /portal/statements: itemised debts and repayments, with VAT invoice download.
• /portal/pay: business bank details, reference to quote, and upload of transfer proof. Proof goes to storage and appears in the owner's debtor queue as pending.
• /portal/history: purchases linked to this customer.
Must not: expose any other customer's data, product costs, stock levels or staff names. Public statement links must be signed, expiring and rate limited.
6.5 Super Admin Workspace
The platform operator's console. It manages the business of Ease Me, not the businesses on it.
• /superadmin: platform health, active tenants, revenue, failed payments, storage usage, error rate.
• /superadmin/tenants: list, search, provision, suspend, reactivate, plan and quota assignment. Tenant detail shows usage and subscription state, never raw sales rows.
• /superadmin/plans: Starter, Growth, Business and Enterprise definitions, limits and prices.
• /superadmin/billing: subscription events, webhook delivery log, failed charges, manual reconciliation.
• /superadmin/health: database connection, Redis, storage, queue status.
• /superadmin/audit: platform level audit log.
• /superadmin/support: impersonation is prohibited by default. If support access is ever required, it must be time boxed, consent based, read only and fully logged. Treat this as a future decision, not a phase one feature.
Must not: view unmasked customer personal data or any tenant's private transactions.
7. Business Rules the Agent Must Prove With Tests
• Weighted average cost recalculates only on purchase intake, using the formula in section 4.1 of the specification. Rounding is applied once, at the end.
• Each sale item snapshots unit cost at the moment of sale. Changing cost later never changes historical profit.
• A sale that would drive stock below zero is rejected unless backorder is enabled for that product.
• Two simultaneous sales of the last unit result in one success and one clean failure, proven with row locks.
• Submitting the same Idempotency Key twice creates one sale.
• A credit sale above available headroom is rejected without a manager PIN. Debt records carry a due date from the customer's terms.
• Shift variance behaves as decided in section 3.
• Expected cash includes opening float, cash sales and cash repayments, and subtracts cash payouts.
• Voids and returns create reversing movements and ledger entries. No row is ever deleted.
• A cashier request for any product endpoint returns no cost fields.
• A user from tenant A can never read or write tenant B data, including through guessed identifiers.
8. Build Order
Each phase ends with its acceptance checklist and the three quality commands. The agent must stop and report after every phase.
Phase 0: Audit and schema. Inventory of existing code, mismatch report, full schema proposal, RLS and tenant session strategy, seed data for one pharmacy and one supermarket tenant.
Phase 1: Foundation. Authentication, role guards, tenant context, shared layout shell with the role sidebar, error pages, audit log writer, rate limiter.
Phase 2: Inventory core. Products, categories, movement service, weighted average cost, adjustments, negative stock guard, batches. This is the base of everything else, so it is built and tested first.
Phase 3: Cashier workspace and sales. POS terminal, split tender, idempotency, receipts, parked carts, offline queue, cost shielding tests.
Phase 4: Shifts and reconciliation. Open and close shift, blind counting, variance rules, manager co sign, shift history.
Phase 5: Customers and debts. Customers, credit limits, debt ledger, repayments, aging, WhatsApp statement generator, proof upload.
Phase 6: Purchases and suppliers. Purchase order lifecycle, receiving, landed cost, payables and aging.
Phase 7: Owner overview, expenses and reports. Income statement, cash flow, valuation, shrinkage report, exports, and the attention panel.
Phase 8: Manager workspace. Approvals queue and the permission flagged reuse of shared pages.
Phase 9: Customer portal.
Phase 10: Billing and super admin. Paystack subscriptions, signed webhooks, grace period, tenant provisioning, health console.
Phase 11: Hardening. Security review, load test of checkout, accessibility pass, empty state and error state pass, backup and restore drill.
9. Interface Quality Standard
The design is the Crisp Light system already defined in the project. The following rules exist to prevent the generic, machine made look.
• One job per screen. Each page has one primary action in indigo. If a screen has three primary buttons, two of them are wrong.
• Real content, never filler. No placeholder names, no lorem ipsum, no invented statistics. Empty states explain what the page is for and offer the one action that fills it.
• Numbers are the heroes. Money, quantities and SKUs use the monospace tabular style, right aligned in tables, with the currency symbol consistent everywhere.
• Restraint with decoration. No gradients, glowing shadows, emoji headings, decorative icons beside every label, or card inside card nesting. Use borders and whitespace to create structure.
• Consistent spacing scale. Use the Tailwind scale only; no arbitrary pixel values. One radius for cards, one for controls.
• Status needs more than colour. Every badge pairs colour with a word or icon, for glare and colour blind users.
• Tables are the main workhorse. Sticky headers, sortable columns, saved filters, row actions in one consistent place, keyboard navigation, and a mobile layout that becomes stacked rows, not a squeezed table.
• Every state is designed. Loading uses skeletons matching the final layout; errors say what happened and what to do; success is confirmed quietly. Destructive actions ask for confirmation naming the object.
• Speed is a design feature. The POS must respond to a scan in under 200 milliseconds on a low cost device. Avoid layout shifts and heavy animations on cashier screens.
• Copy is plain. Short sentences, business vocabulary such as stock, till and debt, never technical vocabulary such as entity or payload. Error messages never blame the user.
• Touch and keyboard. Targets at least 44 pixels on cashier and portal screens; full keyboard operation on the POS.
• Accessibility floor. Contrast of at least 4.5 to 1, visible focus rings, labelled inputs, and no information carried by colour alone.
Before a page counts as finished, the agent must review it against this list and report any deviation.
10. What Must Not Exist
• Dark mode or a theme switcher.
• Any cost, margin or profit figure inside the cashier workspace.
• Any direct edit of stock quantity or debt balance outside the movement and ledger services.
• Hard deletion of sales, movements, shifts, debts or audit entries.
• Duplicate copies of the same page for different roles. Share components and pass permissions.
• Features outside the six questions in section 2, such as social feeds, chat systems, loyalty programs or e commerce storefronts. These may be proposed later; they are not part of this build.
• Mock data in production paths, silent error swallowing, and TODO comments presented as finished work.
