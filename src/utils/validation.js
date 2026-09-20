export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9]{10}$/;
export const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export function validateEmail(value) {
  if (!value || typeof value !== "string") return false;
  return emailRegex.test(value.trim());
}

export function validatePhone(value) {
  if (!value || typeof value !== "string") return false;
  const digitsOnly = value.replace(/\D/g, "");
  return phoneRegex.test(digitsOnly);
}

export function cleanPhoneInput(value) {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, 10);
}

export function validatePassword(value) {
  if (!value) {
    return {
      isValid: false,
      hasMinLength: false,
      hasSpecialChar: false,
      message: "Password is required."
    };
  }

  const hasMinLength = value.length >= 6;
  const hasSpecialChar = specialCharRegex.test(value);
  const isValid = hasMinLength && hasSpecialChar;

  let message = "";
  if (!hasMinLength && !hasSpecialChar) {
    message = "Must be at least 6 characters and include a special character.";
  } else if (!hasMinLength) {
    message = "Password must be at least 6 characters.";
  } else if (!hasSpecialChar) {
    message = "Password must include at least one special character (!@#$%^&*...).";
  }

  return {
    isValid,
    hasMinLength,
    hasSpecialChar,
    message
  };
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!password) {
    return { isValid: true, message: "" };
  }
  if (!confirmPassword) {
    return { isValid: false, message: "Please confirm your password." };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: "Passwords do not match." };
  }
  return { isValid: true, message: "" };
}

export function validateReport(data) {
  const errors = {};
  if (!data.category) {
    errors.category = "Please choose a category.";
  }
  if (!data.place || !data.place.trim()) {
    errors.place = "Please specify a location or area.";
  } else if (!data.lat || !data.lng || isNaN(data.lat) || isNaN(data.lng)) {
    errors.place = "Please select a recognized location with valid coordinates from the list before submitting.";
  }
  if (!data.description || data.description.trim().length < 15) {
    errors.description = "Please provide at least 15 characters of context.";
  }
  return errors;
}

export function validateDispute(data) {
  const errors = {};
  if (!data.reason || !data.reason.trim()) {
    errors.reason = "Please select a dispute reason.";
  }
  if (!data.details || data.details.trim().length < 10) {
    errors.details = "Please explain the inaccuracy with at least 10 characters.";
  }
  return errors;
}
