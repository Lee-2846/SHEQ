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

// Recognized project geographic locations with preset coordinates (Mumbai & Pune)
export const knownLocations = [
  // Mumbai Locations (Default Metro)
  { place: "Dadar West Station", city: "Mumbai", lat: 19.0178, lng: 72.8478 },
  { place: "Bandra Linking Road", city: "Mumbai", lat: 19.0596, lng: 72.8295 },
  { place: "Andheri West SV Road", city: "Mumbai", lat: 19.1197, lng: 72.8464 },
  { place: "Powai Central Market", city: "Mumbai", lat: 19.1176, lng: 72.9060 },
  { place: "Kurla West Depot", city: "Mumbai", lat: 19.0657, lng: 72.8794 },
  { place: "Lower Parel Flyover", city: "Mumbai", lat: 19.0016, lng: 72.8306 },
  { place: "Ghatkopar Station East", city: "Mumbai", lat: 19.0864, lng: 72.9081 },
  { place: "Marine Drive Promenade", city: "Mumbai", lat: 18.9438, lng: 72.8232 },
  { place: "Thane Station West", city: "Mumbai", lat: 19.1860, lng: 72.9757 },

  // Pune Locations
  { place: "Shivajinagar Bus Stop", city: "Pune", lat: 18.5308, lng: 73.8475 },
  { place: "FC Road", city: "Pune", lat: 18.5236, lng: 73.8417 },
  { place: "Swargate", city: "Pune", lat: 18.5018, lng: 73.8636 },
  { place: "Koregaon Park Lane 5", city: "Pune", lat: 18.5362, lng: 73.8958 },
  { place: "Aundh Riverside Road", city: "Pune", lat: 18.5587, lng: 73.8072 },
  { place: "Viman Nagar Central", city: "Pune", lat: 18.5679, lng: 73.9143 },
  { place: "Kothrud Depot", city: "Pune", lat: 18.5074, lng: 73.8077 },
  { place: "Baner High Street", city: "Pune", lat: 18.5590, lng: 73.7868 }
];

// Searchable geographic resolution index for quick map auto-centering
export const SEARCH_LOCATIONS = [
  // Mumbai
  { name: "Mumbai", city: "Mumbai", keywords: ["mumbai", "bombay"], center: [19.0760, 72.8777], zoom: 12 },
  { name: "Bandra", city: "Mumbai", keywords: ["bandra", "linking road", "bandra west", "bandra east"], center: [19.0596, 72.8295], zoom: 15 },
  { name: "Andheri", city: "Mumbai", keywords: ["andheri", "andheri west", "andheri east", "sv road"], center: [19.1197, 72.8464], zoom: 15 },
  { name: "Powai", city: "Mumbai", keywords: ["powai", "hiranandani", "iit", "powai lake"], center: [19.1176, 72.9060], zoom: 15 },
  { name: "Dadar", city: "Mumbai", keywords: ["dadar", "dadar west", "dadar station"], center: [19.0178, 72.8478], zoom: 15 },
  { name: "Kurla", city: "Mumbai", keywords: ["kurla", "kurla west", "kurla depot"], center: [19.0657, 72.8794], zoom: 15 },
  { name: "Lower Parel", city: "Mumbai", keywords: ["lower parel", "phoenix", "currey road"], center: [19.0016, 72.8306], zoom: 15 },
  { name: "Marine Drive", city: "Mumbai", keywords: ["marine drive", "churchgate", "nariman point"], center: [18.9438, 72.8232], zoom: 15 },
  { name: "Ghatkopar", city: "Mumbai", keywords: ["ghatkopar", "r city"], center: [19.0864, 72.9081], zoom: 15 },
  { name: "Thane", city: "Mumbai", keywords: ["thane", "thane west"], center: [19.1860, 72.9757], zoom: 14 },
  { name: "Juhu", city: "Mumbai", keywords: ["juhu", "juhu beach"], center: [19.1025, 72.8271], zoom: 15 },
  { name: "Colaba", city: "Mumbai", keywords: ["colaba", "cuffe parade"], center: [18.9067, 72.8147], zoom: 15 },

  // Pune
  { name: "Pune", city: "Pune", keywords: ["pune", "poona"], center: [18.5204, 73.8567], zoom: 12 },
  { name: "Shivajinagar", city: "Pune", keywords: ["shivajinagar", "bus stop", "shivaji nagar"], center: [18.5308, 73.8475], zoom: 15 },
  { name: "FC Road", city: "Pune", keywords: ["fc road", "fergusson", "fergusson college"], center: [18.5236, 73.8417], zoom: 15 },
  { name: "Swargate", city: "Pune", keywords: ["swargate", "swargate depot"], center: [18.5018, 73.8636], zoom: 15 },
  { name: "Koregaon Park", city: "Pune", keywords: ["koregaon park", "kp", "lane 5"], center: [18.5362, 73.8958], zoom: 15 },
  { name: "Aundh", city: "Pune", keywords: ["aundh", "riverside road"], center: [18.5587, 73.8072], zoom: 15 },
  { name: "Viman Nagar", city: "Pune", keywords: ["viman nagar", "symbiosis"], center: [18.5679, 73.9143], zoom: 15 },
  { name: "Kothrud", city: "Pune", keywords: ["kothrud", "kothrud depot"], center: [18.5074, 73.8077], zoom: 15 },
  { name: "Baner", city: "Pune", keywords: ["baner", "high street"], center: [18.5590, 73.7868], zoom: 15 },
  { name: "Hadapsar", city: "Pune", keywords: ["hadapsar", "magarpatta"], center: [18.5012, 73.9264], zoom: 15 },
  { name: "Hinjawadi", city: "Pune", keywords: ["hinjawadi", "hinjewadi"], center: [18.5913, 73.7389], zoom: 14 }
];

export const reports = [
  // Mumbai Reports
  {
    id: 1,
    category: "Poor Lighting",
    place: "Dadar West Station",
    city: "Mumbai",
    date: "Today",
    time: "8:40 PM",
    signal: "Elevated concern",
    confirmations: 16,
    disputes: 1,
    description: "Pedestrian subway and outer skywalk connection has three flickering lamps causing low visibility after 8 PM.",
    lat: 19.0178,
    lng: 72.8478,
    status: "Verified",
    anonymous: false,
    authorName: "Ananya S.",
    comments: [
      { id: 101, author: "Meera P.", text: "Streetlights here have been malfunctioning for over a week.", time: "1 hr ago" },
      { id: 102, author: "Rhea K.", text: "Best to take the main road exit towards flower market after dark.", time: "30 min ago" }
    ],
    disputeNotes: [
      { id: 201, reason: "Inaccurate timing", details: "Lights usually turn on by 9 PM when railway staff operates manual switch.", time: "2 hrs ago" }
    ]
  },
  {
    id: 2,
    category: "Harassment",
    place: "Bandra Linking Road",
    city: "Mumbai",
    date: "Yesterday",
    time: "7:15 PM",
    signal: "Needs attention",
    confirmations: 12,
    disputes: 0,
    description: "Multiple community members reported repeated unwanted catcalling and persistent following near the corner lane.",
    lat: 19.0596,
    lng: 72.8295,
    status: "Under Review",
    anonymous: true,
    authorName: "SHEQ Member",
    comments: [
      { id: 103, author: "Pooja D.", text: "Experienced something similar near the shoe market lane yesterday evening.", time: "Yesterday" }
    ],
    disputeNotes: []
  },
  {
    id: 3,
    category: "Unsafe Transport",
    place: "Kurla West Depot",
    city: "Mumbai",
    date: "Sep 4",
    time: "10:10 PM",
    signal: "Elevated concern",
    confirmations: 19,
    disputes: 2,
    description: "Commuters flagged unlit auto stand stretch and erratic shared transit refusing rides to isolated destinations.",
    lat: 19.0657,
    lng: 72.8794,
    status: "Verified",
    anonymous: false,
    authorName: "Tanvi M.",
    comments: [
      { id: 104, author: "Neha S.", text: "Auto rickshaw drivers refuse standard meter past 10 PM on this side.", time: "Sep 5" }
    ],
    disputeNotes: [
      { id: 202, reason: "Alternative exists", details: "BEST feeder buses are running till 11:30 PM from platform 2.", time: "Sep 5" }
    ]
  },
  {
    id: 4,
    category: "Suspicious Activity",
    place: "Andheri West SV Road",
    city: "Mumbai",
    date: "Sep 3",
    time: "9:05 PM",
    signal: "Needs attention",
    confirmations: 8,
    disputes: 0,
    description: "Community report flagged deserted commercial stretch with idling vehicles and poor pavement illumination.",
    lat: 19.1197,
    lng: 72.8464,
    status: "Under Review",
    anonymous: true,
    authorName: "SHEQ Member",
    comments: [],
    disputeNotes: []
  },
  {
    id: 5,
    category: "Unsafe / Isolated Area",
    place: "Lower Parel Flyover",
    city: "Mumbai",
    date: "Sep 2",
    time: "6:30 PM",
    signal: "Context note",
    confirmations: 5,
    disputes: 0,
    description: "Under-bridge pedestrian crossover has low pedestrian footfall and inactive CCTV cameras.",
    lat: 19.0016,
    lng: 72.8306,
    status: "Resolved",
    anonymous: false,
    authorName: "Isha G.",
    comments: [
      { id: 105, author: "Municipal Liaison", text: "New high-mast LED fixture activated by BMC ward G/South.", time: "Sep 3" }
    ],
    disputeNotes: []
  },

  // Pune Reports
  {
    id: 6,
    category: "Poor Lighting",
    place: "Shivajinagar Bus Stop",
    city: "Pune",
    date: "Sep 1",
    time: "9:00 PM",
    signal: "Elevated concern",
    confirmations: 14,
    disputes: 1,
    description: "A stretch beside the bus stop has very low visibility after 8 PM.",
    lat: 18.5308,
    lng: 73.8475,
    status: "Verified",
    anonymous: false,
    authorName: "Priyanka N.",
    comments: [],
    disputeNotes: []
  },
  {
    id: 7,
    category: "Harassment",
    place: "FC Road",
    city: "Pune",
    date: "Aug 30",
    time: "8:20 PM",
    signal: "Needs attention",
    confirmations: 11,
    disputes: 0,
    description: "Crowded stretch with recurring complaints near the quieter side alley.",
    lat: 18.5236,
    lng: 73.8417,
    status: "Verified",
    anonymous: true,
    authorName: "SHEQ Member",
    comments: [],
    disputeNotes: []
  }
];

export const alerts = [
  {
    id: 1,
    level: "Community update",
    title: "New verified signals around Dadar West",
    body: "Multiple reports were confirmed near Dadar subway in the last 24 hours.",
    time: "18 min ago",
    place: "Dadar West Station"
  },
  {
    id: 2,
    level: "Awareness",
    title: "Late-evening transit signal at Kurla Depot",
    body: "Community reports show increased caution requested around Kurla West after 9:30 PM.",
    time: "2 hrs ago",
    place: "Kurla West Depot"
  },
  {
    id: 3,
    level: "Resolved",
    title: "Lighting issue updated at Lower Parel",
    body: "A previously reported dark stretch under Lower Parel flyover has been resolved with new fixtures.",
    time: "Yesterday",
    place: "Lower Parel Flyover"
  }
];

export const savedPlaces = [
  { id: "place-1", type: "Home", name: "Home", address: "Dadar West, Mumbai", lat: 19.0178, lng: 72.8478 },
  { id: "place-2", type: "College", name: "Bandra Campus", address: "Linking Road, Mumbai", lat: 19.0596, lng: 72.8295 },
  { id: "place-3", type: "Work", name: "Lower Parel Tech Hub", address: "Lower Parel, Mumbai", lat: 19.0016, lng: 72.8306 }
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
    place: "Dadar West Station",
    city: "Mumbai",
    lat: 19.0178,
    lng: 72.8478,
    active: true,
    designatedDate: "Sep 1, 2026",
    reason: "High concentration of poor lighting & pedestrian congestion concerns",
    supportingReportsCount: 16,
    adminNotes: "Railway station authority and municipal ward notified."
  },
  {
    id: "hotspot-2",
    place: "Kurla West Depot",
    city: "Mumbai",
    lat: 19.0657,
    lng: 72.8794,
    active: true,
    designatedDate: "Aug 28, 2026",
    reason: "Late night transit connectivity and auto refusal signals",
    supportingReportsCount: 19,
    adminNotes: "Identified for recurring late-night community alerts."
  }
];

export const initialIssues = [
  {
    id: "issue-101",
    title: "Dadar West subway illumination defect",
    area: "Dadar West Station",
    category: "Poor Lighting",
    severity: "Medium",
    status: "In Progress",
    createdDate: "Today",
    adminNotes: "Internal ticket logged to track municipal lighting restoration."
  },
  {
    id: "issue-102",
    title: "Lower Parel under-bridge lighting fixture",
    area: "Lower Parel Flyover",
    category: "Unsafe / Isolated Area",
    severity: "Low",
    status: "Resolved",
    createdDate: "Sep 2",
    adminNotes: "Lighting fixtures verified installed and operational."
  }
];

export const initialEscalations = [
  {
    id: "esc-501",
    title: "Bandra Linking Road Repeated Harassment Cluster",
    area: "Bandra Linking Road",
    supportingReportsCount: 12,
    severity: "High",
    potentialAuthority: "Local Police Station / Women Safety Mobile Patrol",
    createdDate: "Yesterday",
    adminNotes: "Escalation record prepared for community patrol liaison.",
    disclaimer: "Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."
  }
];
