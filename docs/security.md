# Security Specification

## 1. Purpose

This document defines the security requirements for the multi tenant business management and financial visibility SaaS.

The application handles business financial information, sales records, inventory data, customer debts, supplier obligations, staff activity, business performance data, subscription data, and uploaded business documents.

Security is a core architectural requirement and must be implemented before major business functionality.

The security model is:

```text
Cloudflare
    ↓
HTTPS / Edge Protection
    ↓
Coolify Proxy
    ↓
Next.js Application
    ↓
Security Controls
    ↓
Authentication
    ↓
Tenant Context
    ↓
Authorization
    ↓
Input Validation
    ↓
Service Layer
    ↓
Database Transaction
    ↓
PostgreSQL + Row Level Security
    ↓
Audit Trail
```

No single security mechanism is sufficient on its own.

---

# 2. Application Security Context

## 2.1 Product

The application is a multi tenant SaaS for retail shops, supermarkets, pharmacies, wholesalers, restaurants, and other small businesses that need visibility into sales, expenses, inventory, cash flow, customer debts, supplier obligations, and profitability.

## 2.2 Primary Users

The initial roles are:

```text
Owner / Admin
Cashier / Sales Attendant
Store / Inventory Manager
Accountant / Auditor
```

## 2.3 Sensitive Data

The application may contain:

```text
Business information
User accounts
Staff permissions
Sales
Sale items
Expenses
Customer debts
Supplier obligations
Inventory quantities
Inventory adjustments
Cash balances
Payment records
Financial transactions
Profit and loss information
Audit records
Receipts and attachments
Subscription information
```

## 2.4 Technology Stack

The planned stack is:

```text
Next.js
TypeScript
PostgreSQL
Drizzle ORM
Better Auth
Coolify
Cloudflare
External object storage such as Cloudflare R2
```

The database is self hosted rather than using Supabase.

---

# 3. Core Security Principles

1. Never trust data supplied by the browser.
2. Never trust client supplied user IDs, business IDs, roles, permissions, ownership fields, payment statuses, or security decisions.
3. Never rely on frontend authorization.
4. Enforce authentication and authorization on the server.
5. Isolate tenant owned data at both application and database levels.
6. Fail closed when authentication, authorization, tenant context, validation, or security checks fail.
7. Treat all user input, uploaded files, webhooks, external API responses, and third party data as untrusted.
8. Use database transactions for operations that modify multiple related records.
9. Use idempotency for critical mutation endpoints.
10. Prefer cancellation, reversal, or adjustment over destructive deletion for important business records.
11. Audit sensitive actions and financial changes.
12. Never log passwords, tokens, secrets, cookies, or unnecessary sensitive data.
13. Never commit secrets to source control.
14. Return only data the current user is authorized to see.
15. Do not expose internal implementation details through production errors.
16. Apply rate limits, request size limits, pagination limits, and query restrictions.
17. Centralize security logic in reusable infrastructure.
18. Include automated security tests for important attack paths.
19. Reassess security whenever a new feature, integration, role, endpoint, or data type is introduced.

---

# 4. Tenant Isolation

The application is multi tenant.

Every tenant owned table must contain:

```text
business_id
```

Tenant isolation must exist at two levels.

## 4.1 Application Level

Every repository and service query must be scoped to the authenticated business context.

Never use an unscoped query against tenant owned data.

The `businessId` must come from trusted server side tenant context.

It must not be trusted simply because it was supplied in:

```text
Request body
Query parameter
URL parameter
Cookie
Local storage
Client state
```

## 4.2 Database Level

PostgreSQL Row Level Security must be enabled on tenant owned tables.

The application database role must not own the protected tables.

Use separate roles:

```text
db_migrator
    Owns schema and tables
    Used for migrations only

app_user
    Used by the application
    Does not own protected tables
    Has only required privileges
```

Tenant context must be transaction scoped.

Use:

```sql
SET LOCAL app.current_business_id = '...';
```

Do not use persistent session level tenant settings with pooled database connections.

---

# 5. PostgreSQL Row Level Security

RLS must protect:

```text
SELECT
INSERT
UPDATE
DELETE
```

For updates, both the existing row and the resulting row must remain inside the tenant boundary.

Conceptually:

```sql
USING (
  business_id = current_setting('app.current_business_id', true)::uuid
)
```

and:

```sql
WITH CHECK (
  business_id = current_setting('app.current_business_id', true)::uuid
)
```

The exact implementation must account for missing tenant context and fail closed.

RLS is a second security boundary. It does not replace application authorization.

## 5.1 RLS Tests

Automated tests must prove:

```text
Business A cannot read Business B data.
Business A cannot modify Business B data.
Business A cannot delete Business B data.
Business A cannot insert data for Business B.
Business A cannot change a record's business ID.
Missing business context denies access.
```

---

# 6. Authentication

Use Better Auth or another maintained authentication system with:

```text
Secure password hashing
Secure sessions
HttpOnly cookies
Secure cookies
SameSite protection
Session expiration
Logout
Session revocation
Password reset
Email verification
Account suspension
Session invalidation after password changes
MFA or step up authentication readiness
```

Authentication and authorization are separate concerns.

Authentication cookies should use:

```text
HttpOnly
Secure
SameSite=Lax
```

Use the `__Host-` cookie prefix where practical.

---

# 7. Authentication Abuse Protection

Strict rate limiting is required for:

```text
Login
Password reset
OTP verification
MFA operations
Email verification
Invitation acceptance
Password changes
```

Authentication responses must not reveal whether an account exists.

For example:

```text
If an account exists for this email, instructions will be sent.
```

should be preferred over:

```text
No account exists for this email.
```

---

# 8. Authorization

Authorization must follow:

```text
Authenticated user
    ↓
Business membership
    ↓
Role
    ↓
Permission
    ↓
Requested action
    ↓
Resource ownership
```

Do not trust roles or permissions supplied by the browser.

A cashier must not gain access to owner functions by modifying a request.

The server must return an appropriate authorization failure such as:

```text
403 Forbidden
```

when the authenticated user lacks permission.

---

# 9. Application Roles

## Owner / Admin

May have:

```text
Full business access
Staff management
Permission management
Financial management
Inventory management
Business settings
Reports
Daily closing
Subscription management
```

Sensitive owner actions should support reauthentication or step up authentication.

## Cashier / Sales Attendant

May have:

```text
Create sales
View permitted sales
Record customer payments
View permitted customer information
Perform assigned daily sales activities
```

Must not automatically have access to:

```text
Profit margins
Cost prices
Bank balances
Supplier obligations
Staff management
Business settings
Audit administration
```

## Store / Inventory Manager

May have:

```text
View inventory
Receive stock
Record damaged stock
Record inventory adjustments
Perform stock counts
View inventory reports
```

Financial permissions should be restricted according to the business permission model.

## Accountant / Auditor

May have:

```text
Read transaction logs
View expenses
View receipts
View financial reports
View P&L
View cash flow
```

They should not silently modify records unless explicitly granted a required permission.

---

# 10. Sensitive Operations

The following operations require additional protection:

```text
Change owner access
Change permissions
Change authentication credentials
Delete a business
Reopen a closed financial day
Export sensitive financial data
Change subscription settings
Large inventory adjustments
Large expense approvals
Security setting changes
```

Where appropriate, require:

```text
Reauthentication
MFA or step up authentication
Additional confirmation
Reason capture
Strict rate limiting
Audit logging
Approval workflow
```

---

# 11. Input Validation

Every server endpoint must validate input using Zod or an equivalent schema validation system.

Validate:

```text
Types
Required fields
String lengths
Numeric ranges
Enum values
UUIDs
Dates
Money values
Quantities
Pagination
Sorting
Filtering
File metadata
Request body size
```

Frontend validation is for usability.

Server side validation is the security boundary.

Reject unexpected fields where appropriate.

Never build SQL, filters, sort clauses, redirects, or file paths directly from unvalidated input.

---

# 12. CSRF

Because authentication uses cookies, state changing requests require CSRF protection.

Protect appropriate:

```text
POST
PUT
PATCH
DELETE
```

requests using a suitable combination of:

```text
SameSite cookies
Origin validation
Host validation
Content-Type validation
CSRF tokens where required
```

A malicious external website must not be able to cause an authenticated user's browser to perform financial or administrative actions.

---

# 13. CORS

Do not use:

```http
Access-Control-Allow-Origin: *
```

for authenticated endpoints.

Only explicitly trusted origins may access APIs cross origin.

If the application and API use the same origin, avoid unnecessary CORS complexity.

---

# 14. Security Headers

Configure and verify:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Content-Security-Policy: ...
Permissions-Policy: ...
```

Consider where compatible:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

Do not blindly deploy headers that break legitimate functionality.

---

# 15. Iframe and Clickjacking Protection

The application must not be embeddable by arbitrary websites.

Use:

```http
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
```

unless a legitimate product requirement requires embedding.

Understand the distinction:

```text
frame-ancestors
    Controls who may embed this application.

frame-src
    Controls what this application may embed.
```

If a trusted integration requires iframe functionality, create a narrow documented exception.

---

# 16. Content Security Policy

Start with a restrictive CSP and expand only when a documented requirement exists.

Possible baseline:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
img-src 'self' https: data:;
font-src 'self' https: data:;
style-src 'self' 'unsafe-inline';
script-src 'self';
connect-src 'self';
```

The final CSP must reflect actual application requirements.

Avoid:

```text
unsafe-eval
```

and broad wildcards unless there is a documented reason.

Review CSP whenever introducing:

```text
Payment providers
Analytics
OAuth
CDNs
External fonts
Maps
Embedded services
Monitoring services
```

---

# 17. XSS Protection

Treat all user supplied content as untrusted.

Examples include:

```text
Business names
Product names
Customer names
Supplier names
Expense descriptions
Notes
Imported records
External API data
```

Do not render untrusted HTML directly.

Avoid `dangerouslySetInnerHTML` unless content has been safely sanitized on the server using a maintained library.

---

# 18. Rate Limiting

Rate limits must be applied by endpoint category.

## Strict

```text
Login
Password reset
OTP
MFA
Invitation acceptance
Password changes
```

## Moderate

```text
Registration
Public forms
Contact endpoints
```

## Normal authenticated

```text
Sales
Customers
Products
Expenses
Inventory
```

## Restricted

```text
Reports
Exports
Imports
Large searches
Analytics
```

## Very strict

```text
Permission changes
Business deletion
Financial day reopening
Large financial adjustments
```

Distributed rate limiting must be used when multiple application instances are deployed.

Redis may be used for distributed rate limiting.

---

# 19. Request and Query Limits

Every API endpoint must have sensible limits.

Protect against:

```text
Huge request bodies
Huge page sizes
Unbounded date ranges
Expensive sorting
Unbounded filters
Large imports
Repeated expensive reports
```

Never allow arbitrary values such as:

```text
limit=1000000
```

without server side limits.

---

# 20. Financial Transaction Integrity

A sale may affect:

```text
Sale
Sale Items
Inventory
Inventory Movements
Payment
Financial Transaction
Customer Transaction
Audit Log
```

These operations must execute inside one database transaction.

Conceptually:

```text
BEGIN

Create sale
Create sale items
Update inventory
Create inventory movements
Create payment
Create financial transaction
Create customer transaction if applicable
Create audit event

COMMIT
```

If any required operation fails:

```text
ROLLBACK
```

No partial financial operation should remain.

---

# 21. Idempotency

Critical mutation endpoints must support idempotency where repeated execution could cause financial or inventory errors.

Apply this to relevant operations such as:

```text
Sale creation
Payment creation
Expense creation
Inventory adjustments
Customer payments
Supplier payments
Webhook processing
Subscription events
```

Protect against:

```text
Double clicks
Network retries
Browser retries
Mobile retries
Payment provider retries
Webhook retries
```

---

# 22. Financial Record Deletion

Important financial and inventory records should not normally be permanently deleted.

Prefer:

```text
Cancel
Void
Reverse
Adjust
Archive
```

Examples:

```text
Cancelled sale
Reversed payment
Reversed inventory adjustment
Cancelled expense
```

The original record must remain traceable.

Every reversal must create an audit event.

---

# 23. Inventory Security

Inventory adjustments must record:

```text
Product
Previous quantity
New quantity
Difference
Reason
User
Timestamp
```

Example:

```text
Expected stock = 60
Physical count = 56
Difference = -4
```

The application should flag the discrepancy.

It must not automatically label the event as theft.

Management should be able to investigate:

```text
Who changed the stock?
What changed?
When?
Why?
What happened before the adjustment?
```

---

# 24. Daily Closing Security

Daily closing is a financial control boundary.

After a day is closed:

```text
Normal users cannot modify ordinary financial records for that day.
```

Reopening a closed day requires:

```text
Appropriate permission
Reauthentication where appropriate
Reason
Audit event
```

After reopening and making changes, the day must be reconciled again.

---

# 25. Audit Logging

Audit logs must be append oriented.

Ordinary users must not be able to:

```text
UPDATE audit logs
DELETE audit logs
```

Record where appropriate:

```text
Business
User
Action
Entity type
Entity ID
Timestamp
Previous values
New values
IP address
User agent
Request or correlation ID
Reason
```

Important events include:

```text
SALE_CREATED
SALE_CANCELLED
EXPENSE_CREATED
EXPENSE_APPROVED
INVENTORY_ADJUSTED
INVENTORY_RECEIVED
CUSTOMER_PAYMENT_RECORDED
SUPPLIER_PAYMENT_RECORDED
DAILY_CLOSING_COMPLETED
DAILY_CLOSING_REOPENED
ROLE_CHANGED
PERMISSION_CHANGED
USER_INVITED
USER_SUSPENDED
LOGIN_FAILED
PASSWORD_CHANGED
DATA_EXPORTED
```

Application logs and business audit logs remain separate.

---

# 26. Application Logging

Log events needed to detect:

```text
Authentication failures
Authorization failures
Rate limit violations
Suspicious activity
Unexpected errors
Database failures
Integration failures
```

Never log:

```text
Passwords
Session tokens
Access tokens
API keys
Payment secrets
Full cookies
Sensitive request bodies
```

Financial information should only be logged when genuinely required.

---

# 27. Error Handling

Production responses must not expose:

```text
Stack traces
SQL queries
Database credentials
Internal paths
Environment variables
Framework internals
Authentication details
```

Return controlled errors to users.

Detailed diagnostics should remain in protected server logs.

---

# 28. File Upload Security

Receipts and business documents are untrusted.

Validate:

```text
MIME type
Extension
File size
File content where practical
Filename
Storage path
```

Generate storage keys instead of trusting original filenames.

Example:

```text
receipts/{businessId}/{uuid}.pdf
```

Use private object storage where appropriate.

Uploaded files must never be executable as server code.

---

# 29. Webhooks and External Integrations

All payment and subscription webhooks must:

```text
Verify provider signatures
Validate event structure
Validate provider references
Be idempotent
Be audited
```

Never trust a client supplied payment status.

External API responses must be validated before being used.

---

# 30. Database Security

PostgreSQL must not be publicly exposed.

Port:

```text
5432
```

must not be open to the public internet.

The application should connect to PostgreSQL through the private Docker network.

The application must not use:

```text
postgres superuser
```

as its runtime database account.

Use least privilege.

---

# 31. Infrastructure and Coolify Security

Required controls include:

```text
Firewall
SSH key authentication
Restricted SSH access where practical
No unnecessary exposed ports
Regular OS updates
Regular Docker updates
Regular Coolify updates
Strong administrative credentials
2FA for administrative accounts
No unnecessary Coolify users
No public registration
Limited API tokens
```

Public ports should normally be limited to:

```text
80
443
22
```

PostgreSQL and Redis should remain internal.

---

# 32. Container Security

Production containers should:

```text
Run as non-root where practical
Use minimal images
Install only required packages
Avoid privileged mode
Avoid unnecessary Linux capabilities
Use resource limits
Keep secrets outside images
Use read-only filesystems where practical
```

Production images must not contain:

```text
.env files
Private keys
Development credentials
Source control credentials
```

---

# 33. Cloudflare

Cloudflare should provide the external edge layer for production.

Use it for appropriate:

```text
DNS
TLS
DDoS protection
Edge security
Bot protection
Rate limiting where appropriate
```

Cloudflare does not replace:

```text
Authentication
Authorization
Tenant isolation
RLS
Input validation
Application rate limiting
Database security
```

---

# 34. Secrets Management

Never commit secrets to Git.

Protect:

```text
DATABASE_URL
AUTH_SECRET
PAYMENT PROVIDER SECRET KEYS
R2 ACCESS KEYS
EMAIL PROVIDER KEYS
MONITORING TOKENS
OAUTH SECRETS
ENCRYPTION KEYS
```

Production secrets should be managed through Coolify environment variables or a dedicated secret management system.

If a secret is exposed:

```text
Revoke
Rotate
Replace
Audit usage
```

Deleting the secret from the latest commit is not sufficient.

---

# 35. Backups and Recovery

Backups must be:

```text
Automated
Offsite
Protected
Retained according to policy
Tested through restoration
```

At minimum:

```text
Daily database backup
External backup destination
Periodic restore test
```

A Docker volume is not a backup.

Document:

```text
Backup frequency
Retention
Recovery procedure
Responsible operators
```

---

# 36. Dependency Security

Use a lockfile.

Regularly inspect:

```text
npm audit
Dependabot or Renovate
Security advisories
Next.js updates
Better Auth updates
Drizzle updates
Docker base image updates
Operating system updates
```

Critical security updates must not be ignored indefinitely.

---

# 37. Security Testing

Automated and manual tests must cover:

```text
Authentication
Authorization
Tenant isolation
RLS
IDOR
CSRF
Rate limiting
Input validation
XSS
File uploads
Session invalidation
Permission changes
Transaction atomicity
Idempotency
Audit logs
Security headers
Iframe protection
Webhook verification
Sensitive response fields
```

At minimum:

```text
User A cannot read Business B data.
User A cannot modify Business B data.
User A cannot delete Business B data.
User A cannot insert data for Business B.
User A cannot change ownership fields.
User A cannot access unauthorized response fields.
```

---

# 38. Feature Security Review

Before completing every new feature, answer:

```text
Who can access this?
Which business owns this data?
How is business context derived?
What happens if the client changes the business ID?
What happens if the client changes the record ID?
Can the operation be repeated?
Can it be abused?
What sensitive fields could be exposed?
Does it require resource-level authorization?
Does it require an audit event?
Does it modify financial or critical data?
Does it require a transaction?
Does it require idempotency?
Does it require rate limiting?
Does it require reauthentication?
What happens when a security check fails?
What automated tests prove the feature is secure?
```

---

# 39. Security Infrastructure

Security logic should be centralized in reusable modules such as:

```text
src/lib/security/
    csrf.ts
    rate-limit.ts
    permissions.ts
    tenant.ts
    security-headers.ts
    request-validation.ts
    idempotency.ts
    audit.ts
    errors.ts
    file-upload-security.ts
    webhook-verification.ts
```

The exact project structure may change, but security logic must remain reusable and consistent.

---

# 40. Security Implementation Order

Security foundation must be established before major business feature development.

Phase 0:

```text
Project structure
PostgreSQL
Drizzle
Database roles
Migrations
Authentication
Secure sessions
Business tenancy
Tenant context
Roles
Permissions
Authorization
PostgreSQL RLS
Input validation
CSRF protection
CORS
Rate limiting
Security headers
Iframe protection
CSP
Audit logging
Secure errors
Transactions
Idempotency
Security logging
File upload controls
Infrastructure hardening
Cloudflare
Coolify
Backups
Security tests
```

Business modules then build on this foundation.

---

# 41. Production Security Checklist

```text
[ ] HTTPS enabled
[ ] HSTS configured
[ ] CSP configured
[ ] Iframe protection enabled
[ ] X-Content-Type-Options enabled
[ ] Referrer Policy configured
[ ] Permissions Policy configured
[ ] CORS restricted
[ ] CSRF protection implemented
[ ] Authentication rate limiting implemented
[ ] API rate limiting implemented
[ ] Secure cookies configured
[ ] Session revocation implemented
[ ] Server authorization implemented
[ ] Tenant isolation implemented
[ ] PostgreSQL RLS enabled
[ ] Cross tenant RLS tests passing
[ ] Database not publicly accessible
[ ] Application database user is not superuser
[ ] Audit logs protected
[ ] Financial records cannot be silently deleted
[ ] Critical mutations are transactional
[ ] Idempotency implemented
[ ] File uploads restricted
[ ] Uploaded files cannot execute
[ ] Request size limits configured
[ ] Pagination limits configured
[ ] Secrets removed from Git
[ ] Production secrets configured securely
[ ] Coolify 2FA enabled
[ ] VPS firewall configured
[ ] SSH hardened
[ ] Docker containers hardened
[ ] Cloudflare configured
[ ] Database backups automated
[ ] Offsite backup configured
[ ] Backup restoration tested
[ ] Dependencies checked
[ ] Security tests passing
[ ] Production error handling verified
[ ] Security headers verified
[ ] Debug mode disabled
[ ] Development credentials removed from production
```

---

# 42. Definition of Done

A feature is not complete until:

1. Authentication requirements are defined.
2. Authorization requirements are defined.
3. Tenant ownership is defined.
4. Tenant isolation is enforced.
5. Database isolation is verified where applicable.
6. Server side validation exists.
7. Rate limiting has been considered.
8. Sensitive response fields are restricted.
9. Transactions are used where required.
10. Idempotency is used where required.
11. Audit logging is used where required.
12. Errors do not expose sensitive information.
13. Security tests cover important attack paths.
14. Documentation explains security assumptions and operational requirements.

---

# 43. Primary Security Objectives

The primary objective is:

> A user, bug, compromised session, malicious request, integration, or operational mistake must not be able to access or manipulate data outside the authorized business or permission boundary.

The second objective is:

> A legitimate user must not be able to perform actions beyond their role without the system preventing, detecting, and recording the attempt.

The third objective is:

> Important business, financial, inventory, and operational changes must be traceable, reversible where appropriate, protected against accidental repetition, and recoverable after failure.
