import { loadCatalog, renderCatalog } from "@/lib/ask/catalog";
console.log(renderCatalog(loadCatalog(process.argv[2] || "catalog/store_day.yaml")));
