import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";

const rl = readline.createInterface({ input, output });
try {
  await connectDatabase(env.mongoUri);
  const name = (await rl.question("Admin display name: ")).trim();
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const password = await rl.question("Admin password (10+ characters): ");
  if (!name || !email.includes("@") || password.length < 10) throw new Error("Invalid name/email or password too short.");
  if (await User.exists({ email })) throw new Error("An account with this email already exists.");
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, env.bcryptRounds), role: "admin", verificationStatus: "unverified" });
  console.log(`Admin created: ${user.email}. Store credentials securely and enable MFA/monitoring before production.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await disconnectDatabase().catch(() => {});
}
