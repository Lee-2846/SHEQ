import app from "./app.js";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

await connectDatabase(env.mongoUri);
const server = app.listen(env.port, () => console.log(`SHEQ API listening on http://localhost:${env.port} (${env.nodeEnv}).`));

async function shutdown(signal) {
  console.log(`${signal} received; closing server.`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
