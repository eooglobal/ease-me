-- PostgreSQL Row-Level Security (RLS) Policies for Multi-Tenant Isolation
-- Enforces that transactions must have app.current_business_id set, or access is denied.

-- Helper function to get current transaction business_id safely
CREATE OR REPLACE FUNCTION current_business_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_business_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro to enable RLS and create tenant policies on a table
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'roles',
    'business_members',
    'product_categories',
    'products',
    'customers',
    'suppliers',
    'inventory_movements',
    'inventory_counts',
    'sales',
    'purchases',
    'payments',
    'expense_categories',
    'expenses',
    'customer_transactions',
    'supplier_transactions',
    'financial_transactions',
    'daily_closings',
    'audit_logs',
    'notifications',
    'attachments',
    'subscriptions',
    'subscription_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Drop existing policy if any
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
    
    -- Create comprehensive tenant isolation policy
    EXECUTE format(
      'CREATE POLICY tenant_isolation_policy ON %I
       FOR ALL
       USING (business_id = current_business_id())
       WITH CHECK (business_id = current_business_id());',
      tbl
    );
  END LOOP;
END $$;
