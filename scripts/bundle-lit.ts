import { build, context } from "esbuild";
import { resolve } from "node:path";

const entry = resolve(process.cwd(), "src/components/search-results.ts");
const outdir = resolve(process.cwd(), "public");

const config = {
  entryPoints: [entry],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  outfile: resolve(outdir, "search-results.js"),
  plugins: []
};

async function main() {
  const ctx = await context(config);
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Lit component bundled: public/search-results.js");
}

main().catch((err) => {
  console.error("Bundle failed:", err);
  process.exit(1);
});
