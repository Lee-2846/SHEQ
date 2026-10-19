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

if (production && process.env.EMAIL_PROVIDER === "mock_dev") {
  throw new Error(
    "EMAIL_PROVIDER='mock_dev' is strictly forbidden in production. Configure a real provider or leave disabled."
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
  geoJsonImportPath: process.env.GEOJSON_IMPORT_PATH || "",

  // Email Verification Provider Architecture
  emailProvider: process.env.EMAIL_PROVIDER || "disabled",
  emailFrom: process.env.EMAIL_FROM || "SHEQ Safety <no-reply@sheq.app>",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  otpSecret: process.env.OTP_SECRET || jwtSecret || "sheq-otp-salt-server-secret-2026",
  otpExpiryMinutes: Math.min(60, Math.max(3, Number(process.env.OTP_EXPIRY_MINUTES || 10))),
  otpMaxAttempts: Math.min(10, Math.max(1, Number(process.env.OTP_MAX_ATTEMPTS || 5))),
  otpResendCooldownSeconds: Math.min(300, Math.max(15, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60))),

  // Phone / SMS Provider Architecture
  smsProvider: process.env.SMS_PROVIDER || "disabled",
  smsSenderId: process.env.SMS_SENDER_ID || "SHEQSF",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  smsApiKey: process.env.SMS_API_KEY || "",
  smsApiUrl: process.env.SMS_API_URL || "",

  // Official WhatsApp Business Cloud API Architecture
  whatsappToken: process.env.WHATSAPP_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",

  // Secure Document Vault Storage (Restricted path outside public static web root)
  documentsStoragePath: process.env.DOCUMENTS_STORAGE_PATH || ""
});