import "dotenv/config";
import { bootstrapFirstHr } from "../services/auth/auth.service.js";
import { prisma } from "../lib/prisma.js";

async function seed() {
  try {
    console.log("🌱 Starting database seed...\n");

    // Check if HR already exists
    const existingHr = await prisma.hr.findFirst();
    if (existingHr) {
      console.log("⚠️  HR user already exists. Seed skipped.");
      console.log("   If you need to create a new HR user, use the createHr API endpoint.");
      return;
    }

    // Get required values from environment variables
    const {
      SEED_HR_EMAIL,
      SEED_HR_PASSWORD,
      SEED_HR_FIRST_NAME,
      SEED_HR_LAST_NAME,
      SEED_HR_AGE,
      SEED_HR_PHONE,
      SEED_HR_GENDER,
      SEED_HR_DEPARTMENT_NAME,
    } = process.env;

    // Validate required environment variables
    if (
      !SEED_HR_EMAIL ||
      !SEED_HR_PASSWORD ||
      !SEED_HR_FIRST_NAME ||
      !SEED_HR_LAST_NAME ||
      !SEED_HR_AGE ||
      !SEED_HR_PHONE ||
      !SEED_HR_GENDER ||
      !SEED_HR_DEPARTMENT_NAME
    ) {
      console.error("❌ Missing required environment variables for seed:");
      console.error("   Required variables:");
      console.error("   - SEED_HR_EMAIL");
      console.error("   - SEED_HR_PASSWORD");
      console.error("   - SEED_HR_FIRST_NAME");
      console.error("   - SEED_HR_LAST_NAME");
      console.error("   - SEED_HR_AGE");
      console.error("   - SEED_HR_PHONE");
      console.error("   - SEED_HR_GENDER");
      console.error("   - SEED_HR_DEPARTMENT_NAME");
      console.error("\n   Add these to your .env.development.local file");
      process.exit(1);
    }

    console.log("📝 Creating first HR user and department...");
    console.log(`   Email: ${SEED_HR_EMAIL}`);
    console.log(`   Department: ${SEED_HR_DEPARTMENT_NAME}\n`);

    const result = await bootstrapFirstHr({
      email: SEED_HR_EMAIL,
      password: SEED_HR_PASSWORD,
      firstName: SEED_HR_FIRST_NAME,
      lastName: SEED_HR_LAST_NAME,
      age: parseInt(SEED_HR_AGE, 10),
      phoneNumber: SEED_HR_PHONE,
      gender: SEED_HR_GENDER,
      departmentName: SEED_HR_DEPARTMENT_NAME,
      admin: true,
    });

    console.log("✅ Seed completed successfully!");
    console.log(`   ${result.message}`);
    console.log(`   User ID: ${result.user.UserId}`);
    console.log(`   Email: ${result.user.Email}`);
    console.log("\n⚠️  Note: The HR user needs to verify their email before logging in.");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
