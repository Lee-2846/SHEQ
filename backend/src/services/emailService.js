import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let devOtpListener = null;

/**
 * Test harness helper: attaches a listener for dev/test OTP inspection.
 * Only callable in non-production.
 */
export function __setDevOtpListener(listener) {
  if (!env.production) {
    devOtpListener = listener;
  }
}

/**
 * Returns whether a real or permitted development email provider is active.
 */
export function isEmailConfigured() {
  if (env.production) {
    return Boolean(
      (env.emailProvider === "resend" && env.resendApiKey) ||
      (env.emailProvider === "smtp" && env.smtpHost && env.smtpUser && env.smtpPass)
    );
  }
  return Boolean(
    env.emailProvider === "mock_dev" ||
    (env.emailProvider === "resend" && env.resendApiKey) ||
    (env.emailProvider === "smtp" && env.smtpHost && env.smtpUser && env.smtpPass)
  );
}

/**
 * Returns current provider status and honest diagnostic info.
 */
export function getProviderStatus() {
  const configured = isEmailConfigured();
  let notice = "Email delivery is not configured. Real verification emails cannot be sent until a provider is configured.";
  
  if (env.emailProvider === "mock_dev" && !env.production) {
    notice = "Local development mock email provider active. Codes are output to the local server console only.";
  } else if (configured) {
    notice = `Email provider configured (${env.emailProvider}).`;
  }

  return {
    configured,
    provider: env.emailProvider,
    mode: env.production ? "production" : "development",
    notice
  };
}

/**
 * Generates email HTML template for OTP verification.
 */
function buildOtpEmailHtml({ name, otp }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a2e; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #6c2f41; margin-top: 0; font-size: 22px;">SHEQ Safety Network</h2>
      <p style="font-size: 15px; line-height: 1.5;">Hello ${name},</p>
      <p style="font-size: 15px; line-height: 1.5;">Use the following 6-digit verification code to complete your SHEQ account registration:</p>
      <div style="background-color: #fdf2f4; border: 1px solid #f3d1d9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #6c2f41;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        This code is time-limited and expires in <strong>${env.otpExpiryMinutes} minutes</strong>. If you did not create a SHEQ account, you can safely disregard this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">SHEQ Safety Platform · Automated Security Verification</p>
    </div>
  `;
}

/**
 * Dispatches an OTP verification email through the configured provider adapter.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - Plaintext 6-digit OTP (transient, never stored or logged in production)
 * @param {string} [options.name] - Recipient name
 * @returns {Promise<{ delivered: boolean, provider: string, notice: string, messageId?: string }>}
 */
export async function sendOtpEmail({ to, otp, name = "Member" }) {
  if (!to || !otp) {
    throw new Error("Recipient email and OTP are required.");
  }

  const provider = env.emailProvider;

  // 1. Unconfigured / Disabled
  if (!isEmailConfigured()) {
    return {
      delivered: false,
      provider: "disabled",
      notice: "Email delivery is not configured on this server. Please configure SMTP or Resend."
    };
  }

  // 2. Development Mock Mode (Explicitly forbidden in production by env.js guard)
  if (provider === "mock_dev") {
    if (env.production) {
      throw new Error("mock_dev email provider is strictly forbidden in production.");
    }

    // Pass to automated test listener if active
    if (typeof devOtpListener === "function") {
      try {
        devOtpListener({ to, otp, name });
      } catch {
        // Ignore test listener errors
      }
    }

    // Local server console output only — never in API responses or public logs
    console.info(`[SHEQ DEV ONLY - MOCK EMAIL] Prepared OTP for ${to}: [${otp}] (Expires in ${env.otpExpiryMinutes}m)`);

    return {
      delivered: true,
      provider: "mock_dev",
      notice: "Development mock mode: verification code dispatched to local server console."
    };
  }

  // 3. Resend HTTP API Adapter
  if (provider === "resend") {
    if (!env.resendApiKey) {
      return {
        delivered: false,
        provider: "resend",
        notice: "Resend API key missing from environment configuration."
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.emailFrom,
          to: [to],
          subject: `${otp} is your SHEQ verification code`,
          html: buildOtpEmailHtml({ name, otp })
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Resend delivery failed:", data.message || response.statusText);
        let notice = `Delivery failed: ${data.message || "Provider error"}`;
        if (data.message && data.message.includes("testing emails to your own email address")) {
          notice = `Resend Free Tier constraint: Only the account owner email can receive test messages until a custom sender domain is verified at resend.com/domains. To send to arbitrary users, configure a verified domain or use standard SMTP credentials.`;
        }
        return {
          delivered: false,
          provider: "resend",
          notice
        };
      }

      return {
        delivered: true,
        provider: "resend",
        messageId: data.id,
        notice: "Verification code sent to your email address."
      };
    } catch (err) {
      console.error("Resend network error:", err.message);
      return {
        delivered: false,
        provider: "resend",
        notice: "Failed to connect to email delivery service."
      };
    }
  }

  // 4. SMTP / Nodemailer Adapter
  if (provider === "smtp") {
    if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
      return {
        delivered: false,
        provider: "smtp",
        notice: "SMTP provider requires SMTP_HOST, SMTP_USER, and SMTP_PASS."
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpPort === 465,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: env.emailFrom,
        to,
        subject: `${otp} is your SHEQ verification code`,
        html: buildOtpEmailHtml({ name, otp })
      });

      return {
        delivered: true,
        provider: "smtp",
        messageId: info.messageId,
        notice: "Verification code dispatched via SMTP."
      };
    } catch (err) {
      console.error("SMTP delivery failed:", err.message);
      return {
        delivered: false,
        provider: "smtp",
        notice: `SMTP delivery failed: ${err.message}`
      };
    }
  }

  return {
    delivered: false,
    provider: "unknown",
    notice: "Unrecognized email provider configuration."
  };
}
