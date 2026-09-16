/** Binding-only catalogs for the dashboard's own tiles. Same guard, same scope, same deny-list as the ask box. */
export interface Binding { feature: string; binding: { table: string; store_column: string; time_column: string; freshness: string }; deny_columns: string[] }
export const BINDINGS: Record<"store_day" | "service_ros" | "service_day" | "inventory_snapshot" | "sales_deals", Binding> = {
  store_day: { feature: "sales", binding: { table: "store_day", store_column: "store_code", time_column: "report_date", freshness: "nightly" }, deny_columns: [] },
  service_ros: { feature: "service", binding: { table: "service_ros", store_column: "store_code", time_column: "close_date", freshness: "nightly" }, deny_columns: [] },
  service_day: { feature: "service", binding: { table: "service_day", store_column: "store_code", time_column: "report_date", freshness: "nightly" }, deny_columns: [] },
  inventory_snapshot: { feature: "sales", binding: { table: "inventory_snapshot", store_column: "store_code", time_column: "snapshot_date", freshness: "nightly" }, deny_columns: [] },
  sales_deals: { feature: "sales", binding: { table: "sales_deals", store_column: "store_code", time_column: "deal_date", freshness: "nightly" }, deny_columns: ["salesperson_id", "fi_manager_id"] },
};
export type BindingKey = keyof typeof BINDINGS;
