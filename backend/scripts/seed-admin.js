import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";

const adminEmail = (process.env.ADMIN_EMAIL || "admin@sheq.app").toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecure123!";
const adminName = process.env.ADMIN_NAME || "SHEQ Lead Administrator";

try {
  await connectDatabase(env.mongoUri);
  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`Promoted existing user ${adminEmail} to admin role in database.`);
    } else {
      console.log(`Admin account ${adminEmail} already exists in database.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, env.bcryptRounds);
    const user = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      verificationStatus: "unverified"
    });
    console.log(`Created authorized administrator: ${user.email} (id: ${user._id}) in database.`);
  }
} catch (err) {
  console.error("Failed to seed admin:", err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
