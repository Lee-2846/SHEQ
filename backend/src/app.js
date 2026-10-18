import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import reportsRouter from "./routes/reports.js";
import placesRouter from "./routes/places.js";
import hotspotsRouter from "./routes/hotspots.js";
import escalationsRouter from "./routes/escalations.js";
import analyticsRouter from "./routes/analytics.js";
import infrastructureRouter from "./routes/infrastructure.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();
app.disable("x-powered-by");
const normalizeOrigin = (url) => (url ? url.replace(/\/+$/, "") : "");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const clean = normalizeOrigin(origin);
      if (env.clientOrigins.some((o) => normalizeOrigin(o) === clean)) {
        return callback(null, true);
      }
      if (
        !env.production &&
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(clean)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
app.get("/", (req, res) => res.json({ service: "SHEQ API", version: "1.0.0", health: "/api/health" }));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/places", placesRouter);
app.use("/api/hotspots", hotspotsRouter);
app.use("/api/escalations", escalationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/infrastructure", infrastructureRouter);
app.use(notFound);
app.use(errorHandler);
export default app;
