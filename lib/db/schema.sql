-- App tables (rights and audit). Mirrors the shape bc-dashboard uses: one row per person, one audit row per action.
CREATE TABLE IF NOT EXISTS users (
  email          text PRIMARY KEY,
  password_hash  text,
  totp_secret    text,
  totp_pending   text,
  tier           text NOT NULL DEFAULT 'user',      -- admin | store_admin | user | disabled
  features       text[] NOT NULL DEFAULT '{}',      -- sales, service, finance
  stores         text[] NOT NULL DEFAULT '{}',      -- store codes this person may see
  all_stores     boolean NOT NULL DEFAULT false,
  home_store     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ask_audit (
  id     serial PRIMARY KEY,
  ts     timestamptz NOT NULL DEFAULT now(),
  actor  text NOT NULL,
  kind   text NOT NULL,                              -- ask | rights_change | sign_in
  entry  jsonb NOT NULL
);

-- Warehouse tables: the Ridgeline Auto Group DMS pack. Loaded by `npm run db:load-pack`.
CREATE TABLE IF NOT EXISTS stores (
  store_code text PRIMARY KEY, store_name text NOT NULL, brand text, city text, state text, rooftop_type text
);
CREATE TABLE IF NOT EXISTS staff (
  staff_id integer PRIMARY KEY, store_code text NOT NULL, display_name text, role text, active_from date, active_to date
);
CREATE TABLE IF NOT EXISTS sales_deals (
  deal_number integer PRIMARY KEY, store_code text NOT NULL, deal_date date NOT NULL, deal_type text, sale_type text, status text,
  new_used text, stock_number text, model_year integer, make text, model text,
  front_gross numeric, fi_gross numeric, doc_fee numeric, gap_attached integer, gap_gross numeric, vsc_attached integer, vsc_gross numeric,
  lender_type text, term_months integer, financed integer, has_trade integer, days_in_stock_at_sale integer, salesperson_id integer, fi_manager_id integer
);
CREATE TABLE IF NOT EXISTS store_day (
  store_code text NOT NULL, report_date date NOT NULL, unit_count integer, deal_count integer, new_units integer, used_units integer,
  front_gross numeric, fi_gross numeric, total_gross text, doc_fee numeric,
  PRIMARY KEY (store_code, report_date)
);
CREATE TABLE IF NOT EXISTS service_ros (
  ro_number integer PRIMARY KEY, store_code text NOT NULL, open_date date NOT NULL, close_date date, advisor_id integer, technician_id integer,
  pay_type text, ro_type text, labor_hours numeric, labor_sales numeric, parts_sales numeric
);
CREATE TABLE IF NOT EXISTS service_day (
  store_code text NOT NULL, report_date date NOT NULL, ro_count integer, labor_sales numeric, parts_sales numeric, labor_hours numeric,
  cp_labor_sales numeric, warranty_labor_sales numeric, internal_labor_sales numeric,
  PRIMARY KEY (store_code, report_date)
);
CREATE TABLE IF NOT EXISTS inventory_snapshot (
  snapshot_date date NOT NULL, store_code text NOT NULL, stock_number text NOT NULL, new_used text, model_year integer, make text, model text,
  days_in_stock integer, cost numeric, list_price numeric, price_drops integer,
  PRIMARY KEY (snapshot_date, store_code, stock_number)
);
CREATE TABLE IF NOT EXISTS gl_monthly (
  store_code text NOT NULL, month text NOT NULL, department text NOT NULL, line text NOT NULL, amount numeric,
  PRIMARY KEY (store_code, month, department, line)
);
CREATE INDEX IF NOT EXISTS sales_deals_store_date ON sales_deals (store_code, deal_date);
CREATE INDEX IF NOT EXISTS service_ros_store_close ON service_ros (store_code, close_date);
CREATE INDEX IF NOT EXISTS inventory_snapshot_store_date ON inventory_snapshot (store_code, snapshot_date);
