export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[6-9]\d{9}$/;

export function validateEmail(value) {
  return emailRegex.test(value);
}

export function validatePhone(value) {
  return phoneRegex.test(value.replace(/\s+/g, ""));
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
