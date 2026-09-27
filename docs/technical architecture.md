
# Business Management SaaS
## Technical Architecture and MVP Roadmap

### 1. Final Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js + TypeScript | Web application and server side application |
| UI | Tailwind CSS + shadcn/ui | Interface and reusable components |
| Forms | React Hook Form + Zod | Form handling and validation |
| Database | PostgreSQL | Primary application database |
| ORM | Drizzle ORM | Type safe database access and migrations |
| Authentication | Better Auth | Login, sessions, organizations and invitations |
| Authorization | Application permissions + PostgreSQL RLS | Tenant and role protection |
| Charts | Recharts | Financial and business reports |
| File storage | Cloudflare R2 | Receipts and future documents |
| Hosting | VPS | Application infrastructure |
| Deployment | Coolify | Application and database deployment |
| DNS / SSL | Cloudflare | DNS, SSL and basic security |
| Email | Resend or similar provider | Invitations, password reset and notifications |
| Payments | Paystack | SaaS subscription billing |
| Monitoring | Sentry | Application errors |
| Analytics | PostHog | Product usage analytics |
| Source control | GitHub | Code, issues and deployment |
| Background jobs | Add later | Reminders, reports and scheduled processing |

This keeps the core application under your control without trying to self host every supporting service.

Coolify can run PostgreSQL as a managed resource on your server, including persistent storage and scheduled database backups. Its documentation also makes an important distinction between persistent storage and actual database backups, so the latter should be configured from the beginning.

Drizzle is a good fit here because the database schema can live in the TypeScript codebase and production changes can be applied through version controlled migrations.

---

# 2. VPS Architecture

For the first production version:

```text
                    INTERNET
                       |
                   Cloudflare
                       |
                  app.domain.com
                       |
                    Coolify
                       |
             ----------------------
             |                    |
          Next.js              PostgreSQL
          Application          Database
             |                    |
             ----------------------
                       |
                 Internal Network
```

The PostgreSQL database should not be publicly accessible.

The Next.js application communicates with PostgreSQL through the internal Docker network.

Users only interact with the Next.js application.

### Recommended starting VPS

For an early production SaaS:

```text
CPU:       4 vCPU
RAM:       8 GB
Storage:   120 GB+ NVMe
OS:        Ubuntu LTS
Network:   Reliable 1 Gbps connection
```

Do not buy an oversized server simply because the application is intended to become large.

Start with enough resources for the application, database, Coolify and monitoring. Scale when actual usage requires it.

Coolify itself has relatively modest minimum requirements, but your application and database are the workloads that should determine the server size.

---

# 3. Coolify Services

I would initially have Coolify manage:

```text
Production
│
├── Next.js Application
│
├── PostgreSQL
│
└── Optional Redis later
```

And separately:

```text
Staging
│
├── Next.js Application
│
└── PostgreSQL
```

You do not need Redis on day one.

Do not introduce a queue, worker, Redis server or separate API server until the application actually needs one.

---

# 4. Application Architecture

I recommend a modular Next.js application rather than creating separate frontend and backend repositories.

```text
Next.js
│
├── Authentication
│
├── Business Management
│
├── Sales
│
├── Expenses
│
├── Customers
│
├── Suppliers
│
├── Inventory
│
├── Cash & Reconciliation
│
├── Reports
│
├── Staff & Permissions
│
├── Audit
│
└── Subscription/Billing
```

The application can use:

```text
Browser
   ↓
Next.js UI
   ↓
Server Actions / Route Handlers
   ↓
Business Services
   ↓
Drizzle ORM
   ↓
PostgreSQL
```

This avoids introducing Express or another backend framework without a clear need.

---

# 5. Multi Tenant Architecture

This is one of the most important parts of the project.

The system is not:

```text
User → Data
```

It is:

```text
User
  ↓
Business
  ↓
Business Data
```

A user can belong to one or more businesses.

Most business related tables should therefore contain:

```text
business_id
```

For example:

```text
businesses
products
sales
expenses
customers
suppliers
inventory_movements
payments
daily_closings
audit_logs
```

Each record is associated with a business.

Example:

```text
Sale
├── id
├── business_id
├── customer_id
├── created_by
├── total
├── payment_method
└── created_at
```

The application must never trust a `business_id` supplied by the browser.

The server determines the active business from the authenticated user's membership.

---

# 6. Tenant Security

I recommend using two layers.

### Layer 1: Application authorization

Every server operation verifies:

```text
User
↓
Session
↓
Business membership
↓
Permission
↓
Requested resource
```

### Layer 2: PostgreSQL Row Level Security

PostgreSQL supports Row Level Security independently of Supabase. It can restrict which rows a database user can select, insert, update or delete.

This gives you an additional protection layer against accidental cross tenant access.

However, RLS needs to be designed properly with your database connection strategy. You should not simply enable RLS and assume everything is protected.

The application should establish the current tenant context for each database transaction, and database policies should enforce that context.

The principle should be:

```text
Even if application code makes a mistake,
Business A must never be able to read Business B's records.
```

---

# 7. Authentication

Use Better Auth with PostgreSQL.

Better Auth supports PostgreSQL directly and has an organization plugin for organizations, memberships, invitations and role based access control.

However, I would not blindly use its default `owner`, `admin`, and `member` roles as the complete business permission system.

Your product needs domain specific roles:

```text
OWNER
ADMIN
CASHIER
INVENTORY_MANAGER
ACCOUNTANT
```

Then define permissions such as:

```text
sales.create
sales.view
sales.edit
sales.cancel

expenses.create
expenses.approve
expenses.view

inventory.view
inventory.receive
inventory.adjust
inventory.damage

reports.view
financials.view

staff.manage

reconciliation.perform
reconciliation.close
reconciliation.reopen
```

This is much better than writing conditions such as:

```text
if user.role === "admin"
```

throughout the application.

---

# 8. Core Database Model

The first schema should roughly look like:

```text
users
businesses
business_members
roles
permissions

products
product_categories
units

customers
customer_transactions

suppliers
supplier_transactions

sales
sale_items

expenses
expense_categories

payments

inventory_movements
inventory_counts

daily_closings

financial_transactions

audit_logs

subscriptions
subscription_events
```

There will be supporting tables for authentication and invitations.

The important thing is that the database should represent what actually happened rather than only storing today's totals.

---

# 9. Inventory Architecture

This is where I would be particularly strict.

Do not make:

```text
products.quantity
```

the primary source of truth.

Instead:

```text
Inventory Movement
```

becomes the historical record.

For example:

```text
Opening Stock       +100
Stock Received       +50
Sales                -30
Damaged               -2
Adjustment            -1
-------------------------
Expected Stock       117
```

The current stock can be calculated from the movement history or maintained as a cached value that is always derived from those movements.

Every movement records:

```text
product
business
movement type
quantity
reason
reference
user
timestamp
```

This gives you the audit trail needed for the client's original theft and accountability problem.

The system should say:

> Expected stock: 117  
> Physical count: 113  
> Difference: 4 units

It should **not** say:

> Staff stole 4 units.

The system identifies discrepancies. Management determines the cause.

---

# 10. Sales Architecture

A sale should create a chain of related records.

```text
SALE
 │
 ├── Sale Items
 │
 ├── Payment
 │
 ├── Inventory Movement
 │
 ├── Revenue
 │
 └── Customer Receivable
       if credit
```

For example:

```text
Sale: ₦50,000

Payment:
Cash = ₦20,000
Transfer = ₦30,000
```

Or:

```text
Sale: ₦50,000
Credit: ₦50,000
```

The second case creates a customer receivable.

This makes the financial system traceable.

---

# 11. Expense Architecture

An expense should similarly create a financial event.

```text
Expense
   ↓
Expense Category
   ↓
Payment
   ↓
Cash / Bank
   ↓
Financial Report
```

For example:

```text
Fuel
₦20,000
Cash
Recorded by: Staff A
Approved by: Owner
```

The approval requirement can depend on business settings and user permissions.

---

# 12. Financial Engine

This is the part I would avoid rushing.

The dashboard should not contain dozens of independent calculations.

Instead, establish a financial calculation layer.

For example:

```text
Revenue
   ↓
COGS
   ↓
Gross Profit
   ↓
Operating Expenses
   ↓
Net Profit
```

And:

```text
Money In
   ↓
Cash / Bank / Receivables
```

and:

```text
Money Out
   ↓
Expenses / Supplier Payments
```

This gives the reports a common source of truth.

### Important decision

Before development of the P&L engine, confirm with the client how inventory cost should be calculated.

Possible approaches include:

```text
Weighted Average Cost
FIFO
```

For the first version, I would lean toward **weighted average cost** because it is easier to implement and explain.

But this should be confirmed with the client's accountant or financial adviser before it becomes the foundation of the reporting engine.

---

# 13. Daily Reconciliation

This should become one of the signature features of the product.

At closing:

```text
Opening Cash
+
Cash Sales
+
Other Cash Inflows
-
Cash Expenses
-
Cash Withdrawals
=
Expected Closing Cash
```

Then:

```text
Expected Closing Cash
vs
Actual Cash Count
```

Example:

```text
Expected: ₦185,000
Actual:   ₦180,000

Difference: -₦5,000
```

The system asks for an explanation.

The day can then be closed.

Once closed, ordinary users cannot silently modify historical records.

If an authorized user reopens or corrects the day:

```text
Original value
New value
Reason
User
Timestamp
```

goes into the audit trail.

---

# 14. Audit Trail

Audit logging should not be something added near launch.

Build it into the system from the beginning.

Record events such as:

```text
Sale created
Sale edited
Sale cancelled

Expense created
Expense approved
Expense edited

Stock received
Stock damaged
Stock adjusted

Customer payment recorded
Supplier payment recorded

Daily reconciliation completed
Daily closing reopened

Staff role changed
User invited
User disabled
```

For sensitive changes, retain:

```text
who
what
when
record
old value
new value
reason
```

This is one of the features that differentiates the product from a basic notebook style bookkeeping app.

---

# 15. MVP Scope

I would divide the product into three releases.

## Release 1: Business Control MVP

This is what I would actually build first.

### Business

```text
Business registration
Business profile
Opening balance
Business settings
```

### Users

```text
Owner
Admin
Cashier
Inventory Manager
Accountant
```

### Products

```text
Products
Categories
Selling price
Cost price
Stock level
Low stock threshold
```

### Customers

```text
Customers
Credit sales
Payments
Outstanding balance
```

### Suppliers

```text
Suppliers
Purchases
Outstanding supplier balances
Payments
```

### Sales

```text
Record sale
Payment method
Cash
Transfer
Card
Credit
Sale history
```

### Expenses

```text
Record expense
Categories
Payment method
Receipt attachment
Approval
```

### Inventory

```text
Opening stock
Stock received
Stock sold
Damaged stock
Missing stock
Manual adjustment
Movement history
Low stock alerts
```

### Daily Closing

```text
Opening cash
Sales
Expenses
Expected closing
Actual closing
Variance
Explanation
Close day
```

### Dashboard

```text
Today's sales
Today's expenses
Cash
Digital collections
Estimated profit
Customer debts
Supplier obligations
Low stock
Inventory discrepancies
```

### Reports

```text
Sales
Expenses
Inventory
Customer debts
Supplier obligations
P&L
Cash reconciliation
Activity
```

### Audit

```text
User activity
Financial changes
Inventory changes
Reconciliation changes
```

That is already a substantial product.

---

# 16. Release 2

After real businesses have used the MVP:

```text
Advanced reporting
Tax ready reports
Recurring expenses
Advanced customer management
Advanced supplier management
Multiple locations
More granular permissions
Digital receipts
WhatsApp reminders
SMS reminders
Export to Excel/PDF
Improved dashboard analytics
```

---

# 17. Release 3

Only after product usage validates these needs:

```text
Bank feeds
Payroll
Payment integrations
Automated tax workflows
Accounting integrations
Advanced forecasting
AI business insights
Multiple branches
Advanced automation
Third party integrations
```

Do not put bank feeds and payroll into the first release simply because they appeared in the client's vision.

They are useful, but they increase both development and operational complexity considerably.

---

# 18. Subscription Architecture

The application should have plans from the beginning even if billing is initially disabled.

```text
plans
│
├── FREE
│
└── PRO
```

The business record should contain something like:

```text
plan
subscription_status
subscription_id
trial_ends_at
subscription_ends_at
```

Feature access should be handled through a central feature entitlement system.

For example:

```text
FREE
├── sales
├── basic expenses
├── basic customers
├── limited inventory
└── basic dashboard

PRO
├── everything in FREE
├── multiple users
├── advanced permissions
├── complete inventory
├── audit trail
├── reconciliation
├── advanced reports
└── advanced financial insights
```

This prevents subscription checks from being scattered throughout the codebase.

---

# 19. File Storage

Do not store uploaded receipts directly inside the PostgreSQL database.

Use object storage.

My preference:

```text
Cloudflare R2
```

Store only the metadata in PostgreSQL:

```text
file_id
business_id
record_type
record_id
storage_key
filename
mime_type
size
uploaded_by
created_at
```

The actual file lives in object storage.

If you want absolutely everything on the VPS for the first prototype, local storage is possible, but production backups then need to include those files.

For a financial application, I would rather keep the database and uploaded files independently recoverable.

---

# 20. Backup Strategy

This is non negotiable.

You need:

```text
Database
   ↓
Scheduled backup
   ↓
Offsite storage
```

Do not rely only on the VPS disk.

Do not consider a Docker volume a backup.

Coolify explicitly notes that persistent storage is not the same as a database aware backup and provides scheduled database backup functionality.

I would configure:

```text
Daily database backup
Weekly longer retention backup
Offsite backup
Periodic restore test
```

Also back up the uploaded files.

And keep a separate backup of the Coolify configuration itself. Coolify's own instance backup does not automatically back up the application and database data deployed on your servers.

---

# 21. Development Environments

Use three environments conceptually:

```text
LOCAL
   ↓
STAGING
   ↓
PRODUCTION
```

### Local

Your computer.

```text
Next.js
PostgreSQL Docker container
```

### Staging

VPS / Coolify.

Used for:

```text
Testing
Client demonstrations
Migration testing
QA
```

### Production

Separate database and application resources.

Used by real businesses.

Never develop directly against production.

---

# 22. GitHub and Deployment

The flow should be:

```text
Developer
   ↓
GitHub
   ↓
Pull Request
   ↓
Testing
   ↓
Merge
   ↓
Coolify
   ↓
Build
   ↓
Deploy
```

Production should deploy from the production branch.

Staging can deploy from a development or staging branch.

Database migrations should also be version controlled.

Drizzle supports generating migration files and applying them with `drizzle-kit migrate`, which fits this deployment model.

---

# 23. Security Baseline

Before allowing real businesses onto the platform:

```text
HTTPS everywhere

Database not publicly exposed

Strong database credentials

SSH key authentication

Firewall enabled

Only required ports exposed

Automatic security updates

Secure session cookies

CSRF protection where applicable

Rate limiting

Input validation

Server side authorization

Tenant isolation

Audit logging

Encrypted backups

Offsite backups

Restore testing
```

Also ensure that application logs never expose:

```text
Passwords
Session tokens
Payment secrets
Database credentials
Private customer information
```

---

# 24. Build Roadmap

I would build this in the following order.

## Phase 0: Architecture Decisions

Before writing the actual application:

```text
Finalize business terminology
Finalize roles
Finalize permissions
Finalize transaction types
Finalize inventory rules
Finalize accounting rules
Confirm cost calculation method
Confirm payment methods
Confirm daily closing logic
Confirm subscription boundaries
```

This phase prevents expensive rewrites.

---

## Phase 1: Infrastructure

Set up:

```text
VPS
Ubuntu
Coolify
Cloudflare
GitHub connection
Production environment
Staging environment
PostgreSQL
Backups
Domain
SSL
```

Verification:

```text
Can deploy application
Can connect application to database
Can restore database backup
Can access staging
Production database is not publicly accessible
```

---

## Phase 2: Application Foundation

Build:

```text
Next.js project
TypeScript
Tailwind
shadcn/ui
Drizzle
PostgreSQL
Better Auth
Session management
Business creation
Business membership
Roles
Permissions
Tenant context
Audit foundation
```

Verification:

```text
User can register
User can create business
User can invite staff
Staff can accept invitation
User can switch business
User cannot access another business's data
Permissions work correctly
```

---

## Phase 3: Product and Inventory

Build:

```text
Categories
Products
Opening stock
Stock receiving
Stock movement
Stock adjustment
Damaged stock
Missing stock
Low stock
Inventory history
```

Verification:

```text
Opening stock works
Stock received increases quantity
Sale decreases quantity
Damage decreases quantity
Adjustment is logged
Every adjustment identifies the user
Inventory discrepancy can be calculated
```

---

## Phase 4: Sales

Build:

```text
Sale creation
Sale items
Payment methods
Cash sales
Transfer sales
Card sales
Credit sales
Sale history
Sale cancellation
Customer association
```

Verification:

```text
Sale records correctly
Inventory updates correctly
Payment records correctly
Credit creates receivable
Cancellation reverses the correct effects
Audit trail is created
```

---

## Phase 5: Customers and Suppliers

Build:

```text
Customers
Customer balances
Customer payments

Suppliers
Supplier purchases
Supplier balances
Supplier payments
```

Verification:

```text
Credit sale increases customer debt
Customer payment reduces debt
Credit purchase increases supplier obligation
Supplier payment reduces obligation
History remains traceable
```

---

## Phase 6: Expenses and Financial Engine

Build:

```text
Expense categories
Expenses
Expense approvals
Financial transactions
COGS
Revenue
Gross profit
Operating expenses
Net profit
Cash position
```

Verification:

```text
Sales affect revenue
Inventory cost affects COGS
Expenses affect profit
Payments affect cash
Credit sales affect receivables
Supplier obligations are represented correctly
```

This is the phase where you should test the numbers heavily.

---

## Phase 7: Daily Reconciliation

Build:

```text
Opening cash
Expected closing cash
Actual cash
Variance
Explanation
Daily close
Reopen
Correction
Audit
```

Verification should include deliberately creating:

```text
Exact match
Cash shortage
Cash excess
Unrecorded expense
Credit sale
Transfer sale
Multiple payment methods
```

---

## Phase 8: Dashboard and Reports

Build the dashboard only after the underlying calculations are trustworthy.

Dashboard:

```text
Sales
Expenses
Profit
Cash
Digital collections
Receivables
Supplier obligations
Inventory
Low stock
Discrepancies
```

Reports:

```text
Sales
Expenses
Inventory
P&L
Cash
Customers
Suppliers
Audit
```

This prevents you from building beautiful dashboards around unreliable calculations.

---

## Phase 9: Staff and Security

Finalize:

```text
Role permissions
Staff management
Activity logs
Sensitive action confirmation
Approval workflows
Closed day restrictions
Audit trail
```

Test every role independently.

---

## Phase 10: Subscription System

Add:

```text
Plans
Feature entitlements
Usage limits
Trial
Paystack
Subscription status
Payment webhooks
Upgrade
Downgrade
Cancellation
```

The free plan should be usable enough to acquire businesses.

The paid plan should unlock the features that create operational value.

---

# 25. Recommended Development Order

The most important development principle is:

```text
DATABASE
   ↓
BUSINESS LOGIC
   ↓
API / SERVER ACTIONS
   ↓
UI
```

Not:

```text
Dashboard UI
   ↓
Make database fit the UI
```

For this product, the database and transaction engine are the product.

The dashboard is simply how the business sees what the engine knows.

---

# 26. The Core Transaction Philosophy

I would make this a rule for the entire development team:

> Every important business event must be recorded once and traceable to its consequences.

For example:

```text
SALE
 ↓
Sale record
 ↓
Payment
 ↓
Inventory movement
 ↓
Revenue
 ↓
COGS
 ↓
Profit
 ↓
Cash / Receivable
 ↓
Audit log
```

Likewise:

```text
STOCK RECEIVED
 ↓
Inventory movement
 ↓
Inventory quantity
 ↓
Cost basis
 ↓
Supplier obligation
 ↓
Audit log
```

This architecture is what makes the application more than another simple sales or debt tracking application.

---

# 27. MVP Definition

The first version is ready for pilot testing when a real shop can perform this complete workflow:

```text
Create business
      ↓
Add staff
      ↓
Add products
      ↓
Enter opening stock
      ↓
Open business
      ↓
Record sales
      ↓
Record expenses
      ↓
Receive stock
      ↓
Record customer credit
      ↓
Record payments
      ↓
See inventory position
      ↓
Reconcile cash
      ↓
Close day
      ↓
Review profit
      ↓
Investigate discrepancies
      ↓
View audit history
```

If that workflow works reliably, you have the foundation of the product.

You do not need payroll, bank feeds, WhatsApp automation, SMS, AI forecasting or ten different integrations before testing whether businesses actually want this.

---

# 28. Product Development Principle

The product should be built around this sequence:

**Record → Track → Reconcile → Understand → Act**

The user records what happened.

The system tracks the consequences.

The business reconciles expected versus actual.

The system turns the records into understandable financial information.

The owner then acts on the information.

That should remain the centre of the product as additional features are added.