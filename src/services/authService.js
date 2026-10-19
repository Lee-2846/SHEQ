import { apiRequest } from "./api";

/**
 * Initiates user registration by validating details and triggering OTP creation.
 */
export async function initiateSignup(data) {
  const email = data.email || (data.identifier?.includes("@") ? data.identifier : undefined);
  const phone = data.phone || (!data.identifier?.includes("@") ? data.identifier : undefined);

  return await apiRequest("/auth/signup/initiate", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email,
      phone,
      password: data.password
    })
  });
}

/**
 * Validates the user's OTP code. Account is only created upon successful verification.
 */
export async function verifySignupOtp({ email, phone, otp }) {
  const result = await apiRequest("/auth/signup/verify", {
    method: "POST",
    body: JSON.stringify({
      email: email || undefined,
      phone: phone || undefined,
      otp
    })
  });

  return {
    ...result.user,
    token: result.token,
    notice: result.notice
  };
}

/**
 * Resends a fresh OTP code subject to cooldown.
 */
export async function resendSignupOtp({ email, phone }) {
  return await apiRequest("/auth/signup/resend-otp", {
    method: "POST",
    body: JSON.stringify({
      email: email || undefined,
      phone: phone || undefined
    })
  });
}

/**
 * Dedicated phone verification for existing accounts.
 */
export async function initiatePhoneVerification(phone) {
  return await apiRequest("/auth/phone/initiate", {
    method: "POST",
    body: JSON.stringify({ phone })
  });
}

export async function verifyPhoneVerification(phone, otp) {
  return await apiRequest("/auth/phone/verify", {
    method: "POST",
    body: JSON.stringify({ phone, otp })
  });
}

export async function getSmsStatus() {
  try {
    return await apiRequest("/auth/phone/status");
  } catch {
    return {
      configured: false,
      provider: "disabled",
      notice: "SMS diagnostics unavailable."
    };
  }
}

/**
 * Authenticates an existing registered user.
 */
export async function login(credentials) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: credentials.identifier || credentials.email || credentials.emailOrPhone,
      password: credentials.password
    })
  });

  return {
    ...result.user,
    token: result.token
  };
}

/**
 * Fetches honest email delivery configuration status from backend.
 */
export async function getEmailStatus() {
  try {
    return await apiRequest("/auth/email/status");
  } catch {
    return {
      configured: false,
      provider: "disabled",
      notice: "Backend server offline or email diagnostics unavailable."
    };
  }
}
