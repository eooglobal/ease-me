CREATE TYPE "public"."approval_request_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('owner', 'admin', 'finance', 'support_lead', 'support_agent', 'content', 'security', 'engineer', 'auditor', 'analyst');--> statement-breakpoint
CREATE TYPE "public"."platform_staff_status" AS ENUM('active', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('open', 'closed', 'locked');--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE 'ordered' BEFORE 'received';--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE 'partial' BEFORE 'received';--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"audience_type" varchar(50) DEFAULT 'all' NOT NULL,
	"target_audience" jsonb,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_dismissible" boolean DEFAULT true NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_key" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(150),
	"requester_id" uuid NOT NULL,
	"requester_name" varchar(150) NOT NULL,
	"requester_role" "platform_role" NOT NULL,
	"reason" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb NOT NULL,
	"status" "approval_request_status" DEFAULT 'pending' NOT NULL,
	"approver_id" uuid,
	"approver_name" varchar(150),
	"rejection_comment" text,
	"expires_at" timestamp with time zone NOT NULL,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_type" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"product_categories" jsonb NOT NULL,
	"expense_categories" jsonb NOT NULL,
	"default_tax_rate" numeric(5, 2) DEFAULT '7.50' NOT NULL,
	"units_of_measure" jsonb NOT NULL,
	"reorder_defaults" jsonb,
	"batch_tracking" boolean DEFAULT false NOT NULL,
	"expiry_tracking" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_presets_business_type_unique" UNIQUE("business_type")
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"metadata" jsonb,
	"created_by" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"snapshot_data" jsonb,
	"author_staff_id" varchar(150) NOT NULL,
	"author_staff_name" varchar(150) NOT NULL,
	"change_summary" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_name" varchar(150) NOT NULL,
	"owner_email" varchar(255) NOT NULL,
	"request_type" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'pending_preparation' NOT NULL,
	"statutory_deadline" timestamp with time zone NOT NULL,
	"download_url" text,
	"download_expires_at" timestamp with time zone,
	"retention_ends_at" timestamp with time zone,
	"approval_request_id" varchar(100),
	"completion_record" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"eligible_plans" jsonb NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "emergency_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"action_key" varchar(100) NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"notified_owner_emails" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"owner" varchar(150) NOT NULL,
	"default_state" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 0 NOT NULL,
	"review_date" timestamp with time zone NOT NULL,
	"eligible_plans" jsonb NOT NULL,
	"tenant_allowlist" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" varchar(30) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"owner_id" varchar(150) NOT NULL,
	"owner_email" varchar(255) NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"version_number" varchar(30) DEFAULT '1.0' NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"approval_request_id" varchar(100),
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_documents_document_type_unique" UNIQUE("document_type")
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"channel" varchar(30) NOT NULL,
	"name" varchar(150) NOT NULL,
	"subject" varchar(255),
	"body" text NOT NULL,
	"allowed_variables" jsonb NOT NULL,
	"active_version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_templates_template_key_unique" UNIQUE("template_key")
);
--> statement-breakpoint
CREATE TABLE "onboarding_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_key" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"completion_rule" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_steps_step_key_unique" UNIQUE("step_key")
);
--> statement-breakpoint
CREATE TABLE "platform_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid,
	"staff_email" varchar(255) NOT NULL,
	"staff_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(150),
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_name" varchar(150) NOT NULL,
	"plan_name" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NGN' NOT NULL,
	"status" varchar(30) DEFAULT 'paid' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'paystack_recurring' NOT NULL,
	"paid_at" timestamp with time zone,
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "platform_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"area" varchar(50) NOT NULL,
	"action_type" varchar(20) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "platform_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "platform_role" NOT NULL,
	"permission_key" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_name" varchar(100) DEFAULT 'Ease Me' NOT NULL,
	"support_email" varchar(255) DEFAULT 'support@easeme.ng' NOT NULL,
	"support_whatsapp" varchar(50) DEFAULT '+234 800 EASE ME' NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"default_currency" varchar(3) DEFAULT 'NGN' NOT NULL,
	"default_timezone" varchar(50) DEFAULT 'Africa/Lagos' NOT NULL,
	"date_format" varchar(30) DEFAULT 'DD/MM/YYYY' NOT NULL,
	"default_tax_rate" numeric(5, 2) DEFAULT '7.50' NOT NULL,
	"supported_countries" jsonb NOT NULL,
	"trial_length_days" integer DEFAULT 14 NOT NULL,
	"card_required_for_trial" boolean DEFAULT false NOT NULL,
	"grace_period_days" integer DEFAULT 3 NOT NULL,
	"signup_mode" varchar(30) DEFAULT 'open' NOT NULL,
	"approval_threshold_amount" numeric(12, 2) DEFAULT '20000.00' NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"maintenance_message" text DEFAULT 'Ease Me is currently undergoing scheduled platform maintenance. Services will resume shortly.',
	"maintenance_started_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"platform_role" "platform_role" NOT NULL,
	"status" "platform_staff_status" DEFAULT 'active' NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "product_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"cost_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_limit" integer DEFAULT 30 NOT NULL,
	"portal_limit" integer DEFAULT 10 NOT NULL,
	"auth_limit" integer DEFAULT 5 NOT NULL,
	"max_upload_size_mb" integer DEFAULT 10 NOT NULL,
	"permitted_file_types" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"cashier_id" text NOT NULL,
	"cashier_name" text NOT NULL,
	"register_id" varchar(50) DEFAULT 'POS-01' NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"opening_float" numeric(14, 2) DEFAULT '0' NOT NULL,
	"cash_sales" numeric(14, 2) DEFAULT '0' NOT NULL,
	"cash_payouts" numeric(14, 2) DEFAULT '0' NOT NULL,
	"cash_repayments" numeric(14, 2) DEFAULT '0' NOT NULL,
	"digital_sales" numeric(14, 2) DEFAULT '0' NOT NULL,
	"expected_cash" numeric(14, 2) DEFAULT '0' NOT NULL,
	"actual_cash" numeric(14, 2),
	"variance" numeric(14, 2),
	"status" "shift_status" DEFAULT 'open' NOT NULL,
	"variance_reason" text,
	"notes" text,
	"manager_co_sign_id" text,
	"manager_co_sign_name" text,
	"manager_co_signed_at" timestamp with time zone,
	"manager_co_sign_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_name" varchar(150) NOT NULL,
	"granted_by_owner_id" varchar(150) NOT NULL,
	"granted_by_owner_email" varchar(255) NOT NULL,
	"assigned_staff_id" varchar(150) NOT NULL,
	"assigned_staff_name" varchar(150) NOT NULL,
	"scope" varchar(50) DEFAULT 'config_read_only' NOT NULL,
	"duration_hours" integer DEFAULT 2 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"page_views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_type" varchar(20) NOT NULL,
	"author_id" varchar(150) NOT NULL,
	"author_name" varchar(150) NOT NULL,
	"author_role" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"is_internal_note" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tenant_name" varchar(150) NOT NULL,
	"owner_email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"assignee_staff_id" varchar(150),
	"assignee_staff_name" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'healthy' NOT NULL,
	"latency_ms" integer NOT NULL,
	"details" jsonb,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD COLUMN "proof_url" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "credit_limit" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "credit_terms_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "receipt_url" text;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "received_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "landed_unit_cost" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "freight_charge" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "other_fees" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "idempotency_key" varchar(100);--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "supplier_transactions" ADD COLUMN "proof_url" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "credit_terms_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "lead_time_days" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_platform_staff_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."platform_staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_platform_staff_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."platform_staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_owner_id_platform_staff_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."platform_staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_staff_id_platform_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."platform_staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_key_platform_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."platform_permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_requests_status_idx" ON "approval_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_requests_requester_idx" ON "approval_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "content_items_type_idx" ON "content_items" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "content_items_status_idx" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_versions_item_idx" ON "content_versions" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "data_requests_tenant_idx" ON "data_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "data_requests_status_idx" ON "data_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discount_codes_code_idx" ON "discount_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "feature_flags_key_idx" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "legal_acceptances_tenant_idx" ON "legal_acceptances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "legal_acceptances_owner_idx" ON "legal_acceptances" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "message_templates_key_idx" ON "message_templates" USING btree ("template_key");--> statement-breakpoint
CREATE INDEX "platform_audit_logs_staff_idx" ON "platform_audit_logs" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "platform_audit_logs_created_idx" ON "platform_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_invoices_tenant_idx" ON "platform_invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "platform_invoices_status_idx" ON "platform_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_permissions_area_idx" ON "platform_permissions" USING btree ("area");--> statement-breakpoint
CREATE INDEX "platform_role_permissions_role_idx" ON "platform_role_permissions" USING btree ("role");--> statement-breakpoint
CREATE INDEX "platform_staff_email_idx" ON "platform_staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "platform_staff_role_idx" ON "platform_staff" USING btree ("platform_role");--> statement-breakpoint
CREATE INDEX "product_batches_business_id_idx" ON "product_batches" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "product_batches_product_id_idx" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_batches_expiry_date_idx" ON "product_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "shift_sessions_business_idx" ON "shift_sessions" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "shift_sessions_cashier_idx" ON "shift_sessions" USING btree ("business_id","cashier_id");--> statement-breakpoint
CREATE INDEX "shift_sessions_status_idx" ON "shift_sessions" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "support_access_grants_tenant_idx" ON "support_access_grants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "support_access_grants_staff_idx" ON "support_access_grants" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "support_access_grants_status_idx" ON "support_access_grants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_idx" ON "support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_tickets_tenant_idx" ON "support_tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "support_tickets_created_idx" ON "support_tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_health_checks_service_idx" ON "system_health_checks" USING btree ("service_name");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_business_idempotency_idx" ON "sales" USING btree ("business_id","idempotency_key");