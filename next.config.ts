import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev otherwise appends its own block to this project's CLAUDE.md on every start, which
  // makes the tree dirty and drifts the kit's own instructions from what shipped.
  agentRules: false,
  // PGlite (the in-process Postgres used for tests and local runs) loads its own WASM; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The pack and catalog files are read from disk at request time on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./catalog/**", "./data/pack/manifest.json", "./data/pack/stores.csv", "./lib/ask/*.md", "./docs/**"],
  },
};

export default nextConfig;
