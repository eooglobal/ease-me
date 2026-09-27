# Product Requirements Document

## 1. Product Overview

### Working Product Description

A multi tenant business management platform that helps small and growing inventory based businesses record daily business activities, monitor money and inventory, reconcile operations, and understand business performance without requiring accounting expertise.

The product is designed primarily for retail shops, supermarkets, pharmacies, wholesalers, and similar businesses where sales, inventory, cash, staff activity, customer credit, and expenses need to be monitored regularly.

### Core Product Promise

> **Know what happened in your business today, know where your money is, know what happened to your stock, and know whether the business made money.**

The product should turn ordinary business activities into useful financial and operational information automatically.

The business owner should not need to understand accounting terminology to use the system.

---

# 2. Problem Statement

Many small businesses still manage sales, expenses, inventory, customer debts, supplier obligations, and cash manually.

This creates several problems:

1. Business owners do not have an accurate view of their current financial position.

2. Sales and expenses may be recorded inconsistently.

3. Inventory can disappear without the owner knowing when or how it happened.

4. Employees can make transactions or adjustments without sufficient accountability.

5. Customer debts are difficult to track.

6. Supplier obligations can be forgotten.

7. Owners may know their total sales but not their actual profit.

8. End of day reconciliation is often manual.

9. Financial records may be scattered across notebooks, spreadsheets, bank statements, receipts, and memory.

10. Traditional accounting applications can be too complicated for business owners who simply want to understand what is happening in their business.

The product addresses this by creating one business record for sales, money, expenses, inventory, debts, and staff activity.

---

# 3. Product Goals

The product should allow a business owner to:

1. Record daily sales quickly.

2. Record business expenses.

3. Track cash, bank transfers, and other payment methods.

4. Track customer credit and outstanding debts.

5. Track supplier obligations.

6. Manage inventory and stock movement.

7. Understand expected stock versus actual stock.

8. Identify unexplained inventory shortages.

9. Track who performed important actions.

10. Reconcile the business at the end of the day.

11. Understand daily revenue, expenses, profit, and cash position.

12. Give employees access to only the information required for their jobs.

13. View business activity from one dashboard.

14. Generate useful financial and operational reports without requiring accounting knowledge.

---

# 4. Target Users

## Primary Customers

The initial target market is inventory driven small and growing businesses.

Examples include:

1. Retail shops

2. Supermarkets

3. Pharmacies

4. Wholesale businesses

## Secondary Customers

Potential later markets include:

1. Restaurants

2. Small service businesses

3. Other businesses that handle significant daily transactions

The first version should remain focused on businesses where sales, inventory, cash, and staff activity are central to daily operations.

---

# 5. User Roles

The system should support multiple users within each business.

## Business Owner

The business owner has full control.

They can:

1. View all business information.

2. Add and manage staff.

3. Configure business settings.

4. View financial information.

5. View inventory information.

6. Approve or reject relevant actions.

7. Override selected transactions.

8. Review discrepancies.

9. Perform daily reconciliation.

10. View reports.

11. Lock completed daily records.

## Cashier or Sales Attendant

The cashier can:

1. Record sales.

2. Select payment methods.

3. View relevant product information.

4. View their own sales activity.

5. View permitted daily sales information.

The cashier should not automatically have access to:

1. Profit margins.

2. Business expenses.

3. Bank balances.

4. Full financial reports.

5. Sensitive business information.

## Store or Inventory Manager

The inventory manager can:

1. View inventory.

2. Record incoming stock.

3. Record damaged goods.

4. Record stock adjustments.

5. Report missing inventory.

6. View stock movement.

The inventory manager should not have access to sensitive financial information unless explicitly granted.

## Accountant or Auditor

The accountant or auditor can have read only access to:

1. Transaction records.

2. Expense records.

3. Receipts.

4. Financial reports.

5. Profit and loss information.

6. Cash flow information.

They should not be able to alter normal business transactions.

---

# 6. Core Product Modules

The initial product should contain these core modules:

1. Dashboard

2. Sales

3. Expenses

4. Customers and credit

5. Suppliers and obligations

6. Inventory

7. Cash and payment tracking

8. Daily reconciliation

9. Reports

10. Staff and permissions

11. Activity and audit history

12. Business settings

---

# 7. Business Setup

When a business joins the platform, it should create its business account.

The setup process should collect:

1. Business name

2. Business type

3. Business location

4. Currency

5. Owner information

6. Opening cash balance

7. Products or inventory information

8. Initial staff members where applicable

The owner should then be able to begin recording business activity.

### Business Isolation

Each business must operate within its own isolated workspace.

A user belonging to Business A must not be able to access data belonging to Business B.

A user can belong to one or more businesses only if the business model later requires it.

---

# 8. Dashboard

The dashboard is the primary business control centre.

It should answer the question:

> **What is happening in my business right now?**

The dashboard should show:

### Today's Sales

Total sales recorded today.

### Today's Expenses

Total business expenses recorded today.

### Today's Profit

Estimated profit based on recorded sales and relevant costs.

### Cash Position

Expected cash based on recorded transactions.

### Bank and Digital Payments

Money recorded through transfers, cards, and other digital payment methods.

### Customer Debts

Money currently owed by customers.

### Supplier Obligations

Money currently owed to suppliers.

### Inventory Alerts

Products approaching their minimum stock level.

### Discrepancy Alerts

Examples include:

1. Cash mismatch.

2. Inventory shortage.

3. Unusual stock adjustment.

4. Unapproved expense.

### Recent Activity

Important recent actions performed by users.

The dashboard should allow the owner to move from a summary figure into the underlying records.

---

# 9. Sales Management

The system should allow authorized users to record sales.

A sale should contain information such as:

1. Date and time

2. Products sold

3. Quantity

4. Selling price

5. Total amount

6. Payment method

7. Customer where applicable

8. Staff member who recorded the transaction

9. Credit status where applicable

The system should automatically update relevant inventory records when a sale is recorded.

### Payment Methods

The initial product should support:

1. Cash

2. Bank transfer

3. Card

4. Credit

Additional payment methods can be introduced later.

### Credit Sale

If a sale is recorded as credit:

1. The sale remains recorded as revenue.

2. The amount owed becomes a customer receivable.

3. The customer balance is updated.

4. The owner can later record payment against the outstanding debt.

---

# 10. Expense Management

Authorized users should be able to record business expenses.

An expense should include:

1. Amount

2. Expense category

3. Date

4. Description

5. Payment method

6. Person who recorded it

7. Receipt or supporting document where applicable

Examples include:

1. Restocking related expenses

2. Transportation

3. Fuel

4. Logistics

5. Utilities

6. Rent

7. Repairs

8. Staff related expenses

9. Other operating expenses

Expenses should contribute to the financial reporting system.

Depending on permissions, some expenses may require owner approval.

---

# 11. Customer Credit Management

The system should maintain customer balances.

The owner should be able to:

1. Create customers.

2. Record credit sales.

3. View outstanding balances.

4. Record customer payments.

5. View customer transaction history.

6. See overdue balances.

7. Identify customers with outstanding debts.

The customer balance should automatically update whenever a credit transaction or payment is recorded.

---

# 12. Supplier Management

The system should allow the business to record supplier relationships and obligations.

A supplier record may include:

1. Supplier name

2. Contact information

3. Products supplied

4. Outstanding amount

5. Transaction history

6. Payment history

When stock is received without immediate full payment, the outstanding amount should become a supplier obligation.

The owner should be able to see how much the business currently owes suppliers.

---

# 13. Inventory Management

Inventory is one of the core components of the product.

The system should maintain a stock record for every product.

Each product should contain information such as:

1. Product name

2. Category

3. SKU or internal identifier

4. Selling price

5. Cost price

6. Current quantity

7. Minimum stock level

8. Supplier where applicable

9. Status

### Stock Movement

The system should record:

1. Opening stock

2. Stock received

3. Stock sold

4. Damaged stock

5. Missing stock

6. Manual adjustments

7. Returned stock where applicable

Every adjustment should record:

1. What changed

2. Quantity affected

3. Reason

4. Person who made the change

5. Date and time

---

# 14. Inventory Discrepancy Detection

The system should calculate expected inventory based on recorded stock movement.

For example:

Opening stock: 100

Stock received: 50

Units sold: 40

Expected stock: 110

If the physical count is 106, the system should identify a shortage of 4 units.

The owner should be able to investigate the discrepancy.

The system should not automatically assume theft.

It should identify the difference and show the available activity history so the business owner can investigate.

---

# 15. Daily Reconciliation

Daily reconciliation is one of the product's key workflows.

At the end of the business day, an authorized user should initiate closing.

The system should calculate:

1. Expected cash

2. Recorded cash sales

3. Recorded digital payments

4. Recorded expenses

5. Expected closing cash

6. Actual closing cash

The user enters the actual amount available.

The system compares expected and actual values.

### Example

Expected cash:

₦250,000

Actual cash:

₦243,000

Difference:

₦7,000

The system should flag the difference for review.

The owner should be able to record an explanation where necessary.

Once the owner is satisfied, the day can be closed.

A closed day should become restricted from ordinary editing.

Any later correction should be clearly recorded in the audit history.

---

# 16. Profit and Loss

The system should automatically produce simplified financial performance information.

The owner should be able to see:

1. Revenue

2. Cost of goods sold

3. Gross profit

4. Operating expenses

5. Net profit

The interface should avoid unnecessary accounting terminology.

The system should allow users to view performance by:

1. Day

2. Week

3. Month

4. Custom period

Where the available records are insufficient to calculate an exact figure, the interface should clearly indicate that the figure is an estimate.

---

# 17. Cash Flow Visibility

The system should show how money moves through the business.

The owner should be able to understand:

1. Money received.

2. Money spent.

3. Cash available.

4. Bank and digital collections.

5. Customer money still outstanding.

6. Supplier obligations.

The system should distinguish between sales revenue and actual cash received.

This is particularly important for credit sales.

---

# 18. Audit Trail

Important business actions should be recorded.

Examples include:

1. Sale created

2. Sale edited

3. Sale cancelled

4. Expense created

5. Expense approved

6. Stock received

7. Stock adjusted

8. Damaged stock recorded

9. Customer payment recorded

10. Supplier payment recorded

11. Daily reconciliation completed

12. Daily record reopened

The audit record should show:

1. User

2. Action

3. Affected record

4. Date and time

5. Relevant previous and new values where appropriate

The audit trail should help the owner understand who did what.

---

# 19. Notifications and Alerts

The system should generate alerts for important events.

Initial alerts should include:

1. Low stock.

2. Inventory discrepancy.

3. Cash discrepancy.

4. Outstanding customer debt.

5. Supplier obligation.

6. Pending expense approval.

7. Important staff activity.

Notifications can initially exist inside the application.

SMS and WhatsApp notifications can be added later as paid capabilities.

---

# 20. Reports

The first release should provide useful reports without overwhelming users.

Core reports should include:

### Sales Report

Sales by date, user, product, and payment method.

### Expense Report

Expenses by date and category.

### Inventory Report

Current stock and stock movement.

### Customer Debt Report

Outstanding customer balances.

### Supplier Report

Outstanding supplier obligations.

### Profit and Loss Report

Revenue, cost, expenses, and profit.

### Cash Reconciliation Report

Expected versus actual cash.

### Activity Report

Actions performed by users.

Reports should support filtering by date and relevant categories.

Export functionality can be included where practical.

---

# 21. Staff and Permissions

The owner should be able to:

1. Invite staff.

2. Assign roles.

3. Modify permissions.

4. Disable staff accounts.

5. Review staff activity.

6. Reset access where necessary.

The permission system should follow the principle that users only see the information required for their role.

For example, a cashier should not automatically see company profit.

---

# 22. Core Daily Business Flow

The primary business workflow should be:

### Step 1

Business opens.

Owner or authorized user sees the current business status.

### Step 2

Sales are recorded throughout the day.

### Step 3

Inventory is automatically reduced based on recorded sales.

### Step 4

Expenses are recorded as they occur.

### Step 5

Stock received from suppliers is recorded.

### Step 6

Customer credit transactions are recorded.

### Step 7

Staff actions are captured in the activity history.

### Step 8

At closing, the business performs reconciliation.

### Step 9

The system compares expected and actual cash.

### Step 10

The owner reviews inventory and financial discrepancies.

### Step 11

The day is closed.

### Step 12

The system produces the daily business summary.

The owner should finish the process knowing:

> What we sold.

> What we spent.

> What we received.

> What we owe.

> What customers owe us.

> What stock we have.

> What stock is missing.

> How much money we should have.

> How much profit we made.

---

# 23. Freemium Business Model

The product is intended to operate as a SaaS subscription business.

## Free Plan

The free plan should provide enough functionality to demonstrate the value of digital record keeping.

Potential capabilities:

1. Basic sales recording.

2. Basic expense recording.

3. Basic cash tracking.

4. Limited inventory.

5. Basic dashboard.

6. Basic customer credit records.

Usage limits should encourage growing businesses to upgrade.

## Paid Plan

The paid plan should unlock capabilities such as:

1. Multiple users.

2. Role based permissions.

3. Full inventory lifecycle management.

4. Inventory audit trail.

5. Advanced reports.

6. Profit and loss reporting.

7. Cash reconciliation.

8. Advanced customer and supplier management.

9. Tax ready reports.

10. Expanded business history.

Exact pricing and limits should be determined separately.

---

# 24. Later Capabilities

The following should not be required for the first release unless the business decides they are essential:

1. Automated bank feeds.

2. Payroll management.

3. Automated WhatsApp reminders.

4. SMS notifications.

5. Digital receipts.

6. Advanced tax automation.

7. Advanced accounting integrations.

8. Multiple branches.

9. Advanced analytics.

10. Supplier marketplace.

11. Customer facing applications.

12. Payment processing.

13. Hardware POS integration.

14. Advanced forecasting.

These can become future product modules after the core business workflow has been validated.

---

# 25. What the Product Is Not

The first version should not be positioned or designed primarily as:

### A traditional accounting system

Users should not need accounting knowledge to operate the system.

### A hardware POS

The product records sales but does not depend on payment terminals or specialized POS hardware.

### A simple digital notebook

The system should do more than store records. It should connect those records and produce useful business information.

### A pure inventory system

Inventory is important, but the product must connect inventory activity to money and business performance.

---

# 26. Key Product Principle

Every important business event should answer three questions:

### What happened?

A sale, expense, stock movement, payment, adjustment, or other event.

### Who did it?

The user responsible for the action.

### What did it affect?

Money, inventory, customer balance, supplier balance, or business performance.

This principle should guide the product throughout development.

---

# 27. MVP Definition

The first release should focus on the smallest useful version of the business control system.

### MVP must include

1. Business registration and setup.

2. Business workspace.

3. User accounts.

4. Role based access.

5. Product management.

6. Inventory tracking.

7. Sales recording.

8. Expense recording.

9. Customer credit.

10. Supplier obligations.

11. Cash and payment tracking.

12. Daily reconciliation.

13. Dashboard.

14. Basic profit and loss.

15. Inventory discrepancy tracking.

16. Audit trail.

17. Basic reports.

### MVP should not require

1. Payment processing.

2. Bank API integration.

3. Payroll.

4. WhatsApp automation.

5. SMS automation.

6. Advanced tax automation.

7. Hardware POS integration.

8. Complex accounting features.

9. Multi branch management.

These features can be introduced after the core workflow is proven.

---

# 28. Success Criteria

The product should be considered successful when a business owner can use it to answer these questions without consulting multiple notebooks, spreadsheets, or staff members:

1. How much did we sell today?

2. How much money actually came in?

3. How much did we spend?

4. How much cash should we have?

5. How much profit did we make?

6. How much stock do we have?

7. What stock is running low?

8. Is any stock missing?

9. Who made the relevant adjustment?

10. How much do customers owe us?

11. How much do we owe suppliers?

12. What happened in the business today?

The product should make these answers available from a single business workspace.

---

# 29. Product Direction

The product should ultimately move beyond record keeping.

The long term vision is to become a **business control system for small businesses**.

The system starts by capturing business activity.

It then connects the activity.

It then reconciles the activity.

It then explains the activity.

Eventually, it can help the business owner make better operational decisions based on the information being collected.

The progression is:

**Record → Track → Reconcile → Understand → Act**

This should remain the guiding direction for future product development.