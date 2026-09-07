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
  if (!data.category) errors.category = "Choose a category.";
  if (!data.place.trim()) errors.place = "Add a location.";
  if (!data.description.trim() || data.description.trim().length < 15) {
    errors.description = "Please add at least 15 characters.";
  }
  return errors;
}
