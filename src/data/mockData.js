export const categories = [
  "All",
  "Harassment",
  "Stalking",
  "Theft",
  "Suspicious Activity",
  "Unsafe Transport",
  "Poor Lighting",
  "Broken CCTV",
  "Unsafe / Isolated Area",
  "Infrastructure Concern"
];

// Recognized project geographic locations with preset coordinates
export const knownLocations = [
  { place: "Shivajinagar Bus Stop", city: "Pune", lat: 18.5308, lng: 73.8475 },
  { place: "FC Road", city: "Pune", lat: 18.5236, lng: 73.8417 },
  { place: "Swargate", city: "Pune", lat: 18.5018, lng: 73.8636 },
  { place: "Koregaon Park Lane 5", city: "Pune", lat: 18.5362, lng: 73.8958 },
  { place: "Aundh Riverside Road", city: "Pune", lat: 18.5587, lng: 73.8072 },
  { place: "Viman Nagar Central", city: "Pune", lat: 18.5679, lng: 73.9143 },
  { place: "Kothrud Depot", city: "Pune", lat: 18.5074, lng: 73.8077 },
  { place: "Baner High Street", city: "Pune", lat: 18.5590, lng: 73.7868 },
  { place: "Hadapsar Gadital", city: "Pune", lat: 18.5012, lng: 73.9264 }
];

export const reports = [
  {
    id: 1,
    category: "Poor Lighting",
    place: "Shivajinagar Bus Stop",
    city: "Pune",
    date: "Today",
    time: "8:40 PM",
    signal: "Elevated concern",
    confirmations: 14,
    disputes: 1,
    description: "A stretch beside the bus stop has very low visibility after 8 PM.",
    lat: 18.5308,
    lng: 73.8475,
    status: "Verified",
    anonymous: false,
    authorName: "Ananya S.",
    comments: [
      { id: 101, author: "Meera P.", text: "Streetlights here have been malfunctioning for over a week.", time: "1 hr ago" },
      { id: 102, author: "Rhea K.", text: "Best to wait inside the main depot area after dark.", time: "30 min ago" }
    ],
    disputeNotes: [
      { id: 201, reason: "Inaccurate timing", details: "Lights usually turn on by 9 PM when depot staff arrives.", time: "2 hrs ago" }
    ]
  },
  {
    id: 2,
    category: "Harassment",
    place: "FC Road",
    city: "Pune",
    date: "Yesterday",
    time: "7:15 PM",
    signal: "Needs attention",
    confirmations: 9,
    disputes: 0,
    description: "Multiple community members reported repeated unwanted approaches near the lane.",
    lat: 18.5236,
    lng: 73.8417,
    status: "Under Review",
    anonymous: true,
    authorName: "SHEQ Member",
    comments: [
      { id: 103, author: "Pooja D.", text: "Experienced something similar near the cafe corner yesterday evening.", time: "Yesterday" }
    ],
    disputeNotes: []
  },
  {
    id: 3,
    category: "Unsafe Transport",
    place: "Swargate",
    city: "Pune",
    date: "Sep 4",
    time: "10:10 PM",
    signal: "Elevated concern",
    confirmations: 18,
    disputes: 2,
    description: "Users reported difficulty finding reliable transport late at night.",
    lat: 18.5018,
    lng: 73.8636,
    status: "Verified",
    anonymous: false,
    authorName: "Tanvi M.",
    comments: [
      { id: 104, author: "Neha S.", text: "Auto rickshaw stands are often deserted past 10 PM.", time: "Sep 5" }
    ],
    disputeNotes: [
      { id: 202, reason: "Alternative exists", details: "Night buses are running from the inner depot platform.", time: "Sep 5" }
    ]
  },
  {
    id: 4,
    category: "Suspicious Activity",
    place: "Koregaon Park Lane 5",
    city: "Pune",
    date: "Sep 3",
    time: "9:05 PM",
    signal: "Needs attention",
    confirmations: 6,
    disputes: 1,
    description: "A community report flagged repeated suspicious activity around the quieter end of the lane.",
    lat: 18.5362,
    lng: 73.8958,
    status: "Under Review",
    anonymous: true,
    authorName: "SHEQ Member",
    comments: [],
    disputeNotes: []
  },
  {
    id: 5,
    category: "Unsafe / Isolated Area",
    place: "Aundh Riverside Road",
    city: "Pune",
    date: "Sep 2",
    time: "6:30 PM",
    signal: "Context note",
    confirmations: 4,
    disputes: 0,
    description: "Low footfall and limited lighting were reported along this stretch.",
    lat: 18.5587,
    lng: 73.8072,
    status: "Resolved",
    anonymous: false,
    authorName: "Isha G.",
    comments: [
      { id: 105, author: "City Council", text: "New solar lighting fixtures installed by local ward.", time: "Sep 3" }
    ],
    disputeNotes: []
  }
];

export const alerts = [
  {
    id: 1,
    level: "Community update",
    title: "New reports around Shivajinagar",
    body: "Three reports were confirmed in the last 24 hours.",
    time: "18 min ago",
    place: "Shivajinagar Bus Stop"
  },
  {
    id: 2,
    level: "Awareness",
    title: "Late-evening transport signal",
    body: "Community reports show increased concern around Swargate after 9 PM.",
    time: "2 hrs ago",
    place: "Swargate"
  },
  {
    id: 3,
    level: "Resolved",
    title: "Lighting issue updated",
    body: "A previously reported dark stretch on Aundh Riverside Road has been resolved.",
    time: "Yesterday",
    place: "Aundh Riverside Road"
  }
];

export const savedPlaces = [
  { id: "place-1", type: "Home", name: "Home", address: "Shivajinagar, Pune", lat: 18.5308, lng: 73.8475 },
  { id: "place-2", type: "College", name: "Fergusson College Campus", address: "FC Road, Pune", lat: 18.5236, lng: 73.8417 },
  { id: "place-3", type: "Work", name: "Tech Park Koregaon", address: "Koregaon Park, Pune", lat: 18.5362, lng: 73.8958 }
];

export const initialContacts = {
  primary: {
    name: "Aarti Sharma",
    phone: "+91 98765 43210",
    relationship: "Sister (Family)"
  },
  trusted: [
    { id: 1, name: "Pooja Deshmukh", phone: "+91 98230 11223", role: "Friend" },
    { id: 2, name: "Dr. Sunita K.", phone: "+91 94220 55667", role: "Neighbor" }
  ],
  locationSharingEnabled: true,
  autoSmsOnSOS: true
};

export const initialHotspots = [
  {
    id: "hotspot-1",
    place: "Shivajinagar Bus Stop",
    city: "Pune",
    lat: 18.5308,
    lng: 73.8475,
    active: true,
    designatedDate: "Sep 1, 2026",
    reason: "High concentration of poor lighting & transport concerns",
    supportingReportsCount: 14,
    adminNotes: "Ward office notified regarding street lighting repair."
  },
  {
    id: "hotspot-2",
    place: "Swargate",
    city: "Pune",
    lat: 18.5018,
    lng: 73.8636,
    active: true,
    designatedDate: "Aug 28, 2026",
    reason: "Late night transport connectivity signals",
    supportingReportsCount: 18,
    adminNotes: "Identified for recurring late night awareness."
  }
];

export const initialIssues = [
  {
    id: "issue-101",
    title: "Dark stretch lighting defect",
    area: "Shivajinagar Bus Stop",
    category: "Poor Lighting",
    severity: "Medium",
    status: "In Progress",
    createdDate: "Today",
    adminNotes: "Internal ticket logged to track municipal lighting restoration."
  },
  {
    id: "issue-102",
    title: "Aundh Riverside road illumination",
    area: "Aundh Riverside Road",
    category: "Unsafe / Isolated Area",
    severity: "Low",
    status: "Resolved",
    createdDate: "Sep 2",
    adminNotes: "Lighting fixtures verified installed."
  }
];

export const initialEscalations = [
  {
    id: "esc-501",
    title: "FC Road Repeated Harassment Cluster",
    area: "FC Road",
    supportingReportsCount: 9,
    severity: "High",
    potentialAuthority: "Local Police Station / Women Safety Patrol",
    createdDate: "Yesterday",
    adminNotes: "Escalation record prepared for community patrol liaison.",
    disclaimer: "Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."
  }
];
