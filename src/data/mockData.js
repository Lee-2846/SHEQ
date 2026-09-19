export const reports = [
  { id: 1, category: "Poor Lighting", place: "Shivajinagar Bus Stop", city: "Pune", date: "Today", time: "8:40 PM", signal: "Elevated concern", confirmations: 14, disputes: 1, description: "A stretch beside the bus stop has very low visibility after 8 PM.", lat: 18.5308, lng: 73.8475, status: "Community verified" },
  { id: 2, category: "Harassment", place: "FC Road", city: "Pune", date: "Yesterday", time: "7:15 PM", signal: "Needs attention", confirmations: 9, disputes: 0, description: "Multiple community members reported repeated unwanted approaches near the lane.", lat: 18.5236, lng: 73.8417, status: "Under review" },
  { id: 3, category: "Unsafe Transport", place: "Swargate", city: "Pune", date: "Sep 4", time: "10:10 PM", signal: "Elevated concern", confirmations: 18, disputes: 2, description: "Users reported difficulty finding reliable transport late at night.", lat: 18.5018, lng: 73.8636, status: "Community verified" },
  { id: 4, category: "Suspicious Activity", place: "Koregaon Park Lane 5", city: "Pune", date: "Sep 3", time: "9:05 PM", signal: "Needs attention", confirmations: 6, disputes: 1, description: "A community report flagged repeated suspicious activity around the quieter end of the lane.", lat: 18.5362, lng: 73.8958, status: "Under review" },
  { id: 5, category: "Unsafe / Isolated Area", place: "Aundh Riverside Road", city: "Pune", date: "Sep 2", time: "6:30 PM", signal: "Context note", confirmations: 4, disputes: 0, description: "Low footfall and limited lighting were reported along this stretch.", lat: 18.5587, lng: 73.8072, status: "Resolved" }
];

export const alerts = [
  { id: 1, level: "Community update", title: "New reports around Shivajinagar", body: "Three reports were confirmed in the last 24 hours.", time: "18 min ago" },
  { id: 2, level: "Awareness", title: "Late-evening transport signal", body: "Community reports show increased concern around Swargate after 9 PM.", time: "2 hrs ago" },
  { id: 3, level: "Resolved", title: "Lighting issue updated", body: "A previously reported dark stretch has been marked as improved by the community.", time: "Yesterday" }
];

export const categories = [
  "All", "Harassment", "Stalking", "Theft", "Suspicious Activity",
  "Unsafe Transport", "Poor Lighting", "Broken CCTV", "Unsafe / Isolated Area"
];

export const stats = {
  reports: 1284,
  verified: 78,
  areas: 42,
  community: 3160
};
