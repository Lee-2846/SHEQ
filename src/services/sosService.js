import { apiRequest } from "./api";

/**
 * Fetches server-side SMS and WhatsApp provider availability.
 */
export async function getSosStatus() {
  return await apiRequest("/escalations/sos-status");
}

/**
 * Dispatches real emergency alerts to trusted contacts via backend providers.
 */
export async function dispatchSosAlert({ coordinates, isStale, contacts }) {
  return await apiRequest("/escalations/sos-alert", {
    method: "POST",
    body: JSON.stringify({
      coordinates,
      isStale,
      contacts
    })
  });
}
