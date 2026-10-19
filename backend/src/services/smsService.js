import { env } from "../config/env.js";

let devSmsListener = null;

/**
 * Test harness helper: attaches a listener for dev/test SMS inspection.
 * Only callable in non-production.
 */
export function __setDevSmsListener(listener) {
  if (!env.production) {
    devSmsListener = listener;
  }
}

/**
 * Validates and normalizes phone numbers to standard E.164 format.
 * Accepts:
 * - 10-digit Indian numbers (e.g. "9876543210" -> "+919876543210")
 * - 12-digit Indian numbers with country code without plus (e.g. "919876543210" -> "+919876543210")
 * - International numbers starting with "+" followed by 7-15 digits
 *
 * @param {string} phone
 * @returns {{ isValid: boolean, normalized: string, error?: string }}
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, normalized: "", error: "Phone number is required." };
  }

  const clean = phone.replace(/[\s\-\(\)\.]/g, "").trim();

  // International format with leading '+'
  if (clean.startsWith("+")) {
    const digitsOnly = clean.slice(1);
    if (/^\d{8,15}$/.test(digitsOnly)) {
      return { isValid: true, normalized: clean };
    }
    return { isValid: false, normalized: "", error: "Invalid international phone number format. Must be + followed by 8-15 digits." };
  }

  // Indian 10-digit mobile (starting with 6, 7, 8, or 9)
  if (/^[6-9]\d{9}$/.test(clean)) {
    return { isValid: true, normalized: `+91${clean}` };
  }

  // 12-digit format with 91 prefix
  if (/^91[6-9]\d{9}$/.test(clean)) {
    return { isValid: true, normalized: `+${clean}` };
  }

  // Standard generic digit length
  if (/^\d{8,15}$/.test(clean)) {
    return { isValid: true, normalized: `+${clean}` };
  }

  return { isValid: false, normalized: "", error: "Invalid phone number. Please enter a valid 10-digit mobile or international format with country code." };
}

/**
 * Returns whether an active SMS provider is configured.
 */
export function isSmsConfigured() {
  if (env.production) {
    if (env.smsProvider === "twilio") {
      return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber);
    }
    if (env.smsProvider === "fast2sms" || env.smsProvider === "custom_http") {
      return Boolean(env.smsApiKey && env.smsApiUrl);
    }
    return false;
  }

  if (env.smsProvider === "mock_dev") {
    return true;
  }

  if (env.smsProvider === "twilio") {
    return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber);
  }
  if (env.smsProvider === "fast2sms" || env.smsProvider === "custom_http") {
    return Boolean(env.smsApiKey && env.smsApiUrl);
  }

  return false;
}

/**
 * Returns diagnostic details about SMS provider readiness.
 */
export function getSmsProviderStatus() {
  const configured = isSmsConfigured();
  let notice = "SMS delivery is not configured on this server. Automated SMS cannot be dispatched until a provider is configured.";

  if (env.smsProvider === "mock_dev" && !env.production) {
    notice = "Local development mock SMS provider active. Messages are output to server console.";
  } else if (configured) {
    notice = `SMS provider configured (${env.smsProvider}).`;
  }

  return {
    configured,
    provider: env.smsProvider,
    mode: env.production ? "production" : "development",
    notice,
    requiredEnvVars: [
      "SMS_PROVIDER ('twilio' | 'fast2sms' | 'custom_http' | 'mock_dev')",
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (if Twilio)",
      "SMS_API_KEY, SMS_API_URL (if Fast2SMS / Custom HTTP)"
    ]
  };
}

/**
 * Dispatches an SMS message through the configured provider adapter.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number in E.164 format
 * @param {string} options.message - Text message content
 * @returns {Promise<{ delivered: boolean, provider: string, notice: string, messageId?: string }>}
 */
export async function sendSms({ to, message }) {
  if (!to || !message) {
    throw new Error("Recipient phone and message text are required.");
  }

  const { isValid, normalized, error } = normalizePhoneNumber(to);
  if (!isValid) {
    return { delivered: false, provider: env.smsProvider, notice: error || "Invalid recipient phone number." };
  }

  const provider = env.smsProvider;

  // 1. Unconfigured / Disabled
  if (!isSmsConfigured()) {
    return {
      delivered: false,
      provider: "disabled",
      notice: "SMS provider is not configured. Telephony credentials (Twilio or SMS Gateway) required."
    };
  }

  // 2. Development Mock Mode
  if (provider === "mock_dev") {
    if (env.production) {
      throw new Error("mock_dev SMS provider is strictly forbidden in production.");
    }

    if (typeof devSmsListener === "function") {
      try {
        devSmsListener({ to: normalized, message });
      } catch {
        // Ignore listener error
      }
    }

    console.info(`[SHEQ DEV ONLY - MOCK SMS] Dispatched to ${normalized}: "${message}"`);
    return {
      delivered: true,
      provider: "mock_dev",
      notice: "Development mock mode: SMS output to local server console."
    };
  }

  // 3. Twilio SMS REST API Adapter
  if (provider === "twilio") {
    if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioPhoneNumber) {
      return {
        delivered: false,
        provider: "twilio",
        notice: "Twilio credentials missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER)."
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`;
      const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", normalized);
      params.append("From", env.twilioPhoneNumber);
      params.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Twilio SMS delivery failed:", data.message || response.statusText);
        return {
          delivered: false,
          provider: "twilio",
          notice: `Twilio delivery failed: ${data.message || response.statusText}`
        };
      }

      return {
        delivered: true,
        provider: "twilio",
        messageId: data.sid,
        notice: "SMS delivered successfully via Twilio."
      };
    } catch (err) {
      console.error("Twilio network error:", err.message);
      return {
        delivered: false,
        provider: "twilio",
        notice: "Failed to connect to Twilio SMS gateway."
      };
    }
  }

  // 4. Fast2SMS / Custom HTTP SMS Gateway Adapter
  if (provider === "fast2sms" || provider === "custom_http") {
    if (!env.smsApiKey || !env.smsApiUrl) {
      return {
        delivered: false,
        provider,
        notice: "SMS API Key or URL missing."
      };
    }

    try {
      const response = await fetch(env.smsApiUrl, {
        method: "POST",
        headers: {
          "authorization": env.smsApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "v3",
          sender_id: env.smsSenderId,
          message,
          language: "english",
          flash: 0,
          numbers: normalized.replace("+", "")
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || (data.return === false)) {
        return {
          delivered: false,
          provider,
          notice: `SMS gateway error: ${data.message || "Failed to dispatch"}`
        };
      }

      return {
        delivered: true,
        provider,
        messageId: data.request_id || "ok",
        notice: "SMS dispatched successfully."
      };
    } catch (err) {
      return {
        delivered: false,
        provider,
        notice: `SMS gateway network error: ${err.message}`
      };
    }
  }

  return {
    delivered: false,
    provider: "unknown",
    notice: "Unrecognized SMS provider configuration."
  };
}

/**
 * Dispatches an OTP verification SMS.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.name] - User name
 */
export async function sendOtpSms({ to, otp, name = "Member" }) {
  const message = `SHEQ Safety: Your verification code is ${otp}. Valid for ${env.otpExpiryMinutes} minutes. Never share this code with anyone.`;
  return sendSms({ to, message });
}
