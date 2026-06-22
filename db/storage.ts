import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates the public `listing-images` Storage bucket (idempotent).
 * Run once: npm run db:storage
 */
config({ path: ".env.local" });

const BUCKET = "listing-images";

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: existing } = await admin.storage.getBucket(BUCKET);
  if (existing) {
    console.log(`Bucket "${BUCKET}" already exists.`);
    return;
  }

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (error) throw error;
  console.log(`Created public bucket "${BUCKET}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
