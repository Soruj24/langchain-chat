/**
 * Creates the first administrator from environment variables.
 *
 * There are no hardcoded credentials anywhere in the app. Run this once on a
 * trusted machine, with the secrets supplied through the environment:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' ADMIN_NAME='Your name' \
 *     npm run seed:admin
 *
 * The script is safe to re-run:
 * - a missing account is created;
 * - an existing account with the same email is promoted to an active admin
 *   (its password is never overwritten);
 * - an existing active admin is left untouched.
 */
import dotenv from "dotenv";

// Load the same files Next.js uses, in the same order.
dotenv.config({ path: [".env.local", ".env"] });

import { z } from "zod";

import { hashPassword } from "../lib/auth/password";
import { connectDB } from "../lib/db/connect";
import { ensureSettings } from "../lib/db/settings";
import { User } from "../lib/db/models/user";
import { emailSchema, nameSchema, passwordSchema } from "../lib/validation";

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI is required (add it to client/.env.local)."),
  ADMIN_EMAIL: emailSchema,
  ADMIN_PASSWORD: passwordSchema,
  ADMIN_NAME: nameSchema.default("Administrator"),
});

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    fail(`Invalid admin seed configuration:\n\n${details}`);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGODB_URI } = parsed.data;

  const db = await connectDB();
  console.log(`Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/[^@]+@/, "//***@")}`);

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (!existing) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      isActive: true,
      sessionVersion: 0,
    });

    console.log(`✔ Created admin account: ${ADMIN_EMAIL}`);
  } else if (existing.role !== "admin" || !existing.isActive) {
    existing.role = "admin";
    existing.isActive = true;
    // Invalidate any sessions issued before the privilege change.
    existing.sessionVersion = (existing.sessionVersion ?? 0) + 1;
    await existing.save();

    console.log(`✔ Promoted existing account to active admin: ${ADMIN_EMAIL}`);
    console.log("  Its existing password was not changed.");
  } else {
    console.log(`✔ Admin account already exists: ${ADMIN_EMAIL}`);
    console.log("  Nothing was changed; the existing password still works.");
  }

  await ensureSettings();
  console.log("✔ Default AI and system settings are present.");

  await db.disconnect();
  console.log("\nDone. Sign in with the email and password you supplied.\n");
}

main().catch((error) => {
  console.error("\n✖ Admin seed failed:", error);
  process.exit(1);
});
