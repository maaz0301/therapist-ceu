import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

/**
 * Runs a raw .sql file against DATABASE_URL using the simple query protocol
 * (so multi-statement files with dollar-quoted function bodies execute as-is).
 * Usage: tsx db/run-sql.ts db/rls.sql
 */
config({ path: ".env.local" });

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: tsx db/run-sql.ts <path-to-sql>");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");

  const sql = postgres(url, { prepare: false });
  const content = readFileSync(file, "utf8");

  try {
    await sql.unsafe(content).simple();
    console.log(`Applied ${file}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
