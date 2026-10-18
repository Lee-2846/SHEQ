import dotenv from "dotenv";
dotenv.config();

const production = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "";

if (production && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}

if (
  production &&
  process.env.IDENTITY_VERIFICATION_ENABLED === "true" &&
  !process.env.IDENTITY_PROVIDER_API_KEY
) {
  throw new Error(
    "Identity verification cannot be enabled without provider credentials."
  );
}

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://[::1]:5173",
  "http://[::1]:5174",
  "http://[::1]:5175"
];

const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((v) => v.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const clientOrigins = production
  ? configuredOrigins
  : Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  production,
  port: Number(process.env.PORT || 4000),
  clientOrigins: Object.freeze(clientOrigins),

  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret:
    jwtSecret || "development-only-secret-change-before-deploying-000000",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  bcryptRounds: Math.min(
    14,
    Math.max(10, Number(process.env.BCRYPT_ROUNDS || 12))
  ),
  identityProvider: process.env.IDENTITY_PROVIDER || "disabled",
  identityEnabled: process.env.IDENTITY_VERIFICATION_ENABLED === "true",
  identityProviderBaseUrl: process.env.IDENTITY_PROVIDER_BASE_URL || "",
  identityProviderApiKey: process.env.IDENTITY_PROVIDER_API_KEY || "",
  geoJsonImportPath: process.env.GEOJSON_IMPORT_PATH || ""
});