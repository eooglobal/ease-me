Ease Me Super Admin Console: Redesign Specification
Version 1.0. A standalone build document for the engineering agent. It supersedes every earlier description of the Super Admin workspace, including section 6.5 and section 12 of the main requirements document. The main document still governs everything outside this console.
1. Purpose and Principle
The Super Admin console is the control room of the Ease Me business. Think of Ease Me as a shopping mall. The mall company decides who rents a unit, what rent they pay, what the signs say, when the building closes for repairs and who holds the keys. The mall company does not stand behind a shop counter and read the till roll. That boundary is the foundation of this redesign.
The console does two jobs and only two:
1. Platform control: tenants, plans, billing, settings, feature switches, integrations, health, security and compliance.
2. Content management: the text, templates and starter configurations that the platform itself supplies to tenants and their users.
A page that does neither does not belong here. There is no page builder, no blog engine and no marketing website editor anywhere in this console. If a public marketing site is needed, it is built and managed in a separate tool.
2. Hard Boundaries
• The console never shows unmasked customer personal data. Show masked values such as j***@mail.com and 0803 *** **12.
• The console never reads a tenant's individual sales, products, costs, debts, shifts or customers. Only aggregate counts and usage figures are allowed, such as products created, sales processed this month and storage used.
• No impersonation of tenant users. Support access, when needed, is granted by the tenant owner, limited in time, read only and fully logged (section 8).
• No hard deletion of tenant data from any page. Deletion happens only through the formal deletion workflow in section 9.
• Every write creates a platform audit entry holding who, what, when, previous value and new value.
• Secrets are write only. After saving, only the last four characters are ever displayed.
• Platform staff accounts are never tenant accounts. A person who is both must hold two separate identities.
3. Platform Staff Roles
The database keeps the system role super_admin for anyone who may enter this console. Inside the console, a second value called platformRole decides what each person can do. This is the production standard for a SaaS operator: separate duties, least privilege, and no single person able to change money, security and customer access alone.
Roles
• Platform Owner: accountable executive. Full access and the final approver of sensitive actions. Keep to two or three people; there must always be at least two.
• Platform Administrator: runs daily operations. Provisions and suspends tenants, manages settings, flags and content. Cannot manage staff, security policy or secrets.
• Finance Manager: owns plans, pricing, subscriptions, refunds, discount codes and invoices. No access to security, content or support conversations.
• Support Lead: manages the support queue and staff handling it. Can add tenant notes and request suspensions or extensions. Can view tenant usage summaries.
• Support Agent: answers tickets and views tenant summary pages. Can add notes. Cannot change plans, billing or settings.
• Content Editor: writes and maintains announcements, help articles, templates, onboarding steps and presets. Cannot publish legal documents without approval. No tenant or billing access.
• Security and Compliance Officer: owns security policy, secrets rotation, integrations credentials, data requests and the audit log review. Approves deletion and export requests together with the Owner.
• Platform Engineer: operates health checks, background jobs, feature flags and rate limits. Cannot see billing, tenant notes or customer related data.
• Auditor: read only access to the audit log, billing summaries, compliance records and settings. Intended for external accountants, regulators and internal review. No write access anywhere.
• Analyst: read only access to aggregate analytics and platform health. No tenant level detail beyond aggregates.
Permission matrix
Legend: W means read and write, R means read only, A means write and also approve other people's requests, Req means can request an action but cannot complete it, No means no access.
Area
Owner
Admin
Finance
Support Lead
Support Agent
Content
Security
Engineer
Auditor
Analyst
Tenant list and detail
W
W
R
W
R
No
R
R
R
R
Provision tenant
A
W
No
Req
No
No
No
No
No
No
Suspend or reactivate tenant
A
W
Req
Req
No
No
Req
No
No
No
Plans and pricing
A
R
W
No
No
No
No
No
R
R
Billing, refunds, discounts
A
R
W
No
No
No
No
No
R
R
Content (non legal)
W
W
No
R
R
W
No
No
R
No
Legal documents
A
Req
No
No
No
Req
A
No
R
No
Platform settings
A
W
No
No
No
No
R
R
R
No
Feature flags
A
W
No
No
No
No
No
W
R
No
Integrations and secrets
A
R
No
No
No
No
W
W
R
No
Rate limits and limits
A
R
No
No
No
No
W
W
R
No
Health and jobs
R
R
No
R
R
No
R
W
R
R
Support tickets
R
W
No
W
W
No
R
R
R
No
Security policy
A
R
No
No
No
No
W
No
R
No
Audit log
R
R
R
No
No
No
R
R
R
No
Compliance requests
A
R
No
No
No
No
W
No
R
No
Staff management
W
No
No
No
No
No
Req
No
R
No
Analytics
R
R
R
R
No
No
No
R
R
R
The agent must implement this as a permission table in the database, not as scattered role checks. Each permission is a key such as tenants:suspend, billing:refund or content:publish. A role is a named set of permission keys. Every server action and route handler checks the permission key, never the role name. A test must prove each cell of the matrix.
4. Sensitive Actions and Dual Control
In production, the most damaging mistakes and frauds come from one person acting alone. These actions therefore need two people: a requester and a different approver holding the approval permission.
• Suspending a paying tenant.
• Changing a plan price or deleting a plan.
• Refunds and manual credits above a threshold set in platform settings.
• Approving a data deletion request.
• Rotating or replacing any integration secret.
• Publishing a new version of legal documents.
• Turning on maintenance mode.
• Sending an announcement to all tenants.
• Changing any staff member's role.
Rules the agent must implement
• The requester and the approver must be different people. The system rejects approval by the requester.
• Requests expire after 48 hours.
• The approvals queue lives at /superadmin/approvals and shows the request, the requester, the reason and the exact change, before and after.
• Approval executes the action automatically; the approver does not repeat the work.
• Every request, approval, rejection and expiry is audited.
Emergency access. A Platform Owner may use an emergency override when no approver is reachable during a real incident. It requires a written reason, lasts 60 minutes, notifies every other Owner immediately and is highlighted in the audit log for review.
5. Console Structure and Navigation
The console must look and feel distinct from the tenant application, so that a staff member always knows which environment they are in.
• A fixed top bar reading Ease Me Platform Console, with the signed in staff member, their platform role and a sign out control.
• A left sidebar grouped into five sections. A staff member sees only the pages their role may read.
• A global search that finds tenants by business name, owner email or tenant identifier, reachable with a keyboard shortcut.
• Breadcrumbs on every page below the first level.
• An approvals badge showing pending requests for the current user.
• Light theme only, in the same Crisp Light system. Use a slate top bar and an indigo accent only on primary actions. No dark mode.
Sidebar sections and routes
Overview: /superadmin, /superadmin/analytics.
Tenants and Money: /superadmin/tenants, /superadmin/plans, /superadmin/billing, /superadmin/approvals.
Content: /superadmin/content/announcements, /superadmin/content/helpcenter, /superadmin/content/templates, /superadmin/content/legal, /superadmin/content/onboarding, /superadmin/content/presets.
Platform: /superadmin/settings, /superadmin/flags, /superadmin/integrations, /superadmin/limits.
Operations and Safety: /superadmin/health, /superadmin/support, /superadmin/security, /superadmin/audit, /superadmin/compliance, /superadmin/staff.
6. Page by Page Specification
6.1 Command Overview (/superadmin)
Answers three questions: is the platform healthy, is money coming in, and what needs attention today.
• Summary tiles: active tenants, trial tenants, tenants in grace period, suspended tenants, monthly recurring revenue, new tenants this month, tenants lost this month.
• Money panel: revenue collected this month, failed payments, renewals due in the next 7 days.
• Health strip: database, cache, storage, payment gateway, email and messaging provider, each with a status word and time of last check.
• Attention list: failed webhooks, tenants near plan limits, support tickets older than 48 hours, pending approvals, pending data requests, trials ending in 3 days. Each row links to its resolving page.
• Must not show any tenant's own sales figures.
6.2 Analytics (/superadmin/analytics)
• Growth: signups, activation rate (tenants completing at least 10 sales within 14 days of signup), trial to paid conversion.
• Revenue: monthly recurring revenue by plan, average revenue per tenant, upgrades and downgrades.
• Retention: monthly churn and cohort retention by signup month.
• Usage: platform wide sales processed per day, active cashiers, products created, storage growth.
• Segments: by business type and by region where collected.
• Each chart states the question it answers, has a date filter and exports to CSV.
6.3 Tenants (/superadmin/tenants and /superadmin/tenants/[id])
List. Search and filter by status (trial, active, grace, suspended, cancelled), plan, business type and signup date. Columns: business name, plan, status, masked owner email, user count, product count, last activity, renewal date.
Detail tabs.
• Summary: business profile, plan, status, trial end, created date, owner contact (masked).
• Usage: users, products, sales this month and storage, each against plan limits, aggregate only.
• Subscription: payment history, next renewal, failed charges, grace period extension with mandatory reason.
• Entitlements: plan limits plus any custom overrides, each with a reason and expiry date.
• Notes: internal staff notes, never visible to the tenant.
• Activity: tenant level events such as plan changes, suspensions and login failures. No transaction records.
• Danger zone: suspend, cancel, request data export, request deletion. Each asks the operator to type the business name, and those marked sensitive in section 4 become approval requests.
Provisioning. Business name, owner name and email, business type, plan, trial length and starting preset. The owner receives an invitation to set their own password. No tenant is ever created with a shared or default password.
Suspension. The tenant sees the locked page; data stays intact. The owner keeps read only access to export their data for a defined period.
6.4 Plans and Entitlements (/superadmin/plans)
• Plans: Starter, Growth, Business, Enterprise. Each has name, monthly and annual price, currency, trial length and entitlements.
• Entitlements are limits or switches, for example: maximum users, products and branches, storage, batch and expiry tracking, customer portal, advanced reports, offline mode, data export.
• Changing a plan shows how many tenants it affects. Existing tenants stay on their current terms unless staff explicitly migrate them.
• Entitlement service. One server side service that every tenant facing feature calls before acting. Limits are never enforced only in the interface. Test: a Starter tenant cannot exceed its product limit by calling the API directly.
6.5 Billing (/superadmin/billing)
• Subscription list with status, amount, next charge and gateway reference.
• Webhook log: event type, signature result, processing result, retry count and a safe replay action.
• Failed payments queue with a grace period countdown. Default grace period is 3 days and is editable in settings.
• Invoices issued by Ease Me with PDF download.
• Manual adjustments: credit, extension or discount, each with a reason, each audited, and above the threshold each becoming an approval request.
• Discount codes: code, percentage or fixed amount, plans it applies to, expiry and usage limit.
• Webhook verification uses the platform's own gateway secret key on the raw request body before any parsing. Duplicate events are processed once.
6.6 Approvals (/superadmin/approvals)
One queue implementing section 4. Tabs for Waiting for me, Requested by me, and History. Each item shows the exact change, reason, requester and expiry, with Approve and Reject actions and a required comment on rejection.
6.7 Content Management (/superadmin/content/*)
Every content type follows one lifecycle: Draft, Scheduled, Published, Archived. Nothing goes live without an explicit publish action. Every publish stores a version that can be restored. Every editor has a preview that shows exactly what the tenant will see.
• Announcements. Title, message, severity (info, warning, critical), audience (all tenants, one plan, one business type or a chosen list), start and end time, dismissible or not. Shown inside the tenant dashboard.
• Help center. Articles with title, category, body, images, search keywords and role visibility, so cashier articles never appear for customers. Shown in a help panel inside the product.
• Templates. Email (welcome, password reset, invoice, payment failed, trial ending, suspension notice); WhatsApp and SMS text (default debt reminder, statement message); default receipt and invoice layout. Only approved variables such as business name and amount are allowed. The editor rejects unknown variables and offers a test send to the operator's own address.
• Legal documents. Terms of service, privacy policy and data processing terms, each version with an effective date. Publishing needs approval (section 4). After publishing, tenant owners must accept the new version at next sign in, and the acceptance is stored with timestamp and version.
• Onboarding. The setup checklist new owners see. Each step has title, description, completion rule (a system event such as first product created) and order, editable without a code release.
• Business presets. Starter packs per business type: product categories, expense categories, default tax setting, units of measure, reorder defaults and whether batch tracking is on. Pharmacy turns batch and expiry on; supermarket does not. New tenants receive a copy, and later preset edits never change existing tenants.
6.8 Platform Settings, Flags, Integrations, Limits
Settings (/superadmin/settings). Platform name, support email and WhatsApp number, logo and favicon for emails and the login page. Regional defaults: currency, timezone, date format, default tax rate, supported countries. Trial length and whether a card is required. Grace period length. Signup mode: open, invite only or closed. Approval thresholds. Maintenance mode, which shows a maintenance page to tenants while still admitting platform staff.
Flags (/superadmin/flags). Feature switches for gradual rollout. Each flag has a key, description, owner, default state, a review date and rules by plan, tenant list or percentage. One helper function reads flags everywhere. Flags past their review date appear in the Overview attention list so they do not accumulate forever.
Integrations (/superadmin/integrations). Status and configuration for the payment gateway, object storage, cache, email provider and SMS or WhatsApp provider. Each has Test Connection and the time of the last successful call. Secret fields are write only.
Limits (/superadmin/limits). Editable rate limits for checkout (default 30 requests per minute per cashier terminal), public portal routes (default 10 requests per 10 seconds per IP) and sign in attempts. Upload size and permitted file types. Safe minimum and maximum values are enforced. Changes take effect without redeploying, and the page shows the effective values.
6.9 Operations and Safety
Health (/superadmin/health). Live checks for database connectivity and latency, cache, storage, payment gateway reachability, email delivery, queue backlog and last run time of each background job. Error rate and slow request summary for 24 hours. Storage per tenant as a ranked list. A failed check raises an item on the Overview.
Support (/superadmin/support). Ticket list with tenant, subject, priority, status, assignee and age; tickets older than 48 hours are highlighted. Ticket detail with conversation, internal notes, a link to the tenant page and canned replies from the template library. Tenants raise tickets from inside their own dashboard.
Security (/superadmin/security). Mandatory MFA for every staff account. Session length and idle timeout. Optional IP allowlist for the console. Staff login history and active sessions with remote sign out. Alerts for repeated failed sign ins, new device sign ins and webhook signature failures. Password policy and breached password rejection.
Audit (/superadmin/audit). Append only log. Filter by staff member, action, target tenant and date range. Entries cannot be edited or deleted by anyone, including a Platform Owner, enforced by database permissions. Export to CSV, and each export is itself logged.
Compliance (/superadmin/compliance). Queue of tenant data export requests with expiring secure download links. Deletion requests with a retention window, then approval under dual control, then a logged deletion job that stores a completion record. Backup status: last successful backup, retention period and date of the last restore test. Retention settings for logs and exports.
Staff (/superadmin/staff). Invite, assign platform role, deactivate and reset MFA. Role changes are approval requests. The last remaining two Platform Owners can never be deactivated or demoted. Departing staff are deactivated, never deleted, so audit history stays intact.
7. Data Model Additions
All of these are platform scoped, and none store tenant transaction data. The agent must propose the full schema for approval before writing any migration.
• Access control: platform_staff, platform_roles, platform_permissions, platform_role_permissions, approval_requests, emergency_overrides.
• Commercial: plans, plan_entitlements, tenant_entitlement_overrides, subscriptions, billing_events, discount_codes, platform_invoices.
• Configuration: platform_settings, feature_flags, feature_flag_rules, rate_limit_settings.
• Content: content_items, content_versions, message_templates, legal_documents, legal_acceptances, announcements, business_presets, onboarding_steps.
• Support: support_tickets, support_messages, tenant_notes, support_access_grants.
• Safety: platform_audit_logs (append only), data_requests, system_health_checks.
8. Consent Based Support Access
Impersonation is prohibited. When a tenant owner needs hands on help, the owner grants access from their own settings, choosing a duration of up to 24 hours. The grant gives a named support staff member read only access to that tenant's configuration screens, never customer personal data and never cost or profit figures unless the owner expressly includes them. The grant, each page viewed and the expiry are logged, the owner can revoke at any time, and the tenant sees a record of every grant.
9. Data Requests and Deletion Workflow
1. The tenant owner submits an export or closure request.
2. The request appears in compliance with a statutory clock and the owner is told the expected timeline.
3. For export, the system prepares the file, stores it with an expiring link and notifies the owner.
4. For closure, a retention window starts, during which the owner can cancel.
5. After the window, the Security and Compliance Officer and a Platform Owner approve the deletion.
6. A background job removes tenant data and stored files, and writes a completion record without any tenant content.
10. Build Sequence
Each step is built, tested and reported before the next begins.
• S1: Permission tables, platform roles, permission checks, console shell, audit log writer, approval request engine.
• S2: Command Overview with real data, tenant list and detail, provisioning, suspension, tenant notes.
• S3: Plans, entitlement service, subscriptions, webhook verification, billing pages, discount codes.
• S4: Settings, flags, integrations, limits, maintenance mode.
• S5: Content management with versions, scheduling, legal acceptance, presets and onboarding.
• S6: Support queue and consent based access, help center.
• S7: Health, security policy, compliance workflows, staff management, analytics.
11. Acceptance Tests
• Every cell of the permission matrix is enforced on the server, tested with a user of each role.
• A Super Admin request for any tenant's sales, costs, debts or customer records returns an authorisation error.
• Customer personal data appears masked everywhere in the console.
• Each write action creates exactly one audit entry with previous and new values.
• Audit rows cannot be updated or deleted, proven at database permission level.
• A requester cannot approve their own request; an expired request cannot be approved.
• A Support Agent cannot change a plan; a Content Editor cannot open billing or tenants; an Auditor cannot write anywhere.
• A tenant plan limit holds when the API is called directly.
• A webhook with an invalid signature is rejected and logged; a valid duplicate is processed once.
• Publishing legal documents forces tenant owners to accept them before continuing.
• Changing a preset does not alter existing tenants.
• Maintenance mode blocks tenants and admits staff.
• The system refuses to remove or demote the last two Platform Owners.
• A saved secret is never returned in full by any endpoint.
• A support access grant expires on time and its page views are logged.
12. What Must Not Be Built
• A page builder, blog engine or marketing website editor of any kind.
• Any view of individual tenant transactions, even for debugging.
• Impersonation of tenant users.
• Secrets displayed in full after saving.
• Content edits that go live instantly without a publish step and a version.
• Role checks scattered by role name instead of permission key.
• Two pages managing the same setting.
• Charts that answer no stated question.
• A dark theme or theme switcher.
13. Interface Standard for This Console
The rules of section 9 of the main document apply, plus these console specific rules.
• Information density is a virtue here. Staff use the console for hours, so favour well built tables with sticky headers, saved filters, keyboard navigation and bulk actions over spacious cards.
• Every destructive or sensitive action names its target and consequence in the confirmation, for example the business name and the number of users affected.
• Status is always a word plus colour. Never colour alone.
• Every list has a designed empty state, a loading skeleton that matches the final layout and a clear error state with a retry action.
• Show the staff member's role and any pending approvals at all times so they always know their authority.
• Times display in the staff member's timezone with the timezone named, while the audit log stores universal time.