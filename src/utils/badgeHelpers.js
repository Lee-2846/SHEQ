export function getSignalBadgeClass(signal) {
  switch (signal) {
    case "Elevated concern":
      return "badge-signal-elevated";
    case "Needs attention":
      return "badge-signal-attention";
    case "Context note":
    default:
      return "badge-signal-context";
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case "Submitted":
      return "badge-status-submitted";
    case "Under review":
      return "badge-status-review";
    case "Community verified":
      return "badge-status-verified";
    case "Resolved":
      return "badge-status-resolved";
    default:
      return "badge-status-submitted";
  }
}
