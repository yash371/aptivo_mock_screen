/* =====================================================================
   APTIVO — Carpool — common.js
   Shared runtime: Store, Toast, Sheet, Modal, Confirm, helpers, seed data
   No frameworks · No build step · No network calls
   ===================================================================== */

/* ---------- Constants ---------- */
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const RIDE_STATUS = {
  available: { label: "Available", class: "available" },
  requested: { label: "Requested", class: "requested" },
  confirmed: { label: "Confirmed", class: "confirmed" },
  "fully-booked": { label: "Fully Booked", class: "fully-booked" },
  completed: { label: "Completed", class: "completed" },
  cancelled: { label: "Cancelled", class: "cancelled" },
};

const BOOKING_STATUS = {
  requested: { label: "Requested", class: "requested" },
  confirmed: { label: "Confirmed", class: "confirmed" },
  rejected: { label: "Rejected", class: "cancelled" },
};

const LIMITS = {
  MAX_SEATS_PER_VEHICLE: 6,
  MIN_SEATS: 1,
  INSTRUCTIONS_MAX: 500,
  REG_PATTERN: /^[A-Z]{2}-\d{2}-[A-Z]{1,3}-\d{4}$/i,
};

/* ---------- Utilities ---------- */
function uid(prefix) {
  prefix = prefix || "id";
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

function $(sel, root) {
  return (root || document).querySelector(sel);
}
function $$(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function navigate(url) {
  window.location.href = url;
}

function goBack(fallback) {
  if (window.history.length > 1) window.history.back();
  else window.location.href = fallback || "list.html";
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map(function (w) {
      return w[0];
    })
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------- Date / time ---------- */
function formatTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ap;
}

function formatTimeStr(hhmm) {
  if (!hhmm) return "";
  const parts = hhmm.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ap;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < MIN) return "just now";
  if (diff < HOUR) return Math.floor(diff / MIN) + "m ago";
  if (diff < DAY) return Math.floor(diff / HOUR) + "h ago";
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return Math.floor(diff / DAY) + "d ago";
  return formatDate(ts);
}

function relativeDate(ts) {
  const now = new Date();
  const d = new Date(ts);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfRide = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime();
  const diffDays = Math.round((startOfRide - startOfToday) / DAY);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 6) return "In " + diffDays + " days";
  return formatDateShort(ts);
}

function todayAt(h, m) {
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}
function tomorrowAt(h, m) {
  return todayAt(h, m) + DAY;
}
function yesterdayAt(h, m) {
  return todayAt(h, m) - DAY;
}
function inDaysAt(n, h, m) {
  return todayAt(h, m) + n * DAY;
}

/* ---------- Locations & distance ---------- */
const LOCATIONS = [
  {
    id: "loc_1",
    name: "Green Valley Residency",
    area: "Baner, Pune",
    lat: 18.5606,
    lng: 73.7791,
  },
  {
    id: "loc_2",
    name: "Hinjewadi IT Park",
    area: "Hinjewadi, Pune",
    lat: 18.5913,
    lng: 73.7389,
  },
  {
    id: "loc_3",
    name: "Pune Airport",
    area: "Lohegaon, Pune",
    lat: 18.5793,
    lng: 73.9089,
  },
  {
    id: "loc_4",
    name: "Phoenix Mall",
    area: "Viman Nagar, Pune",
    lat: 18.5626,
    lng: 73.917,
  },
  {
    id: "loc_5",
    name: "Pune Railway Station",
    area: "Koregaon Park, Pune",
    lat: 18.5285,
    lng: 73.8744,
  },
  {
    id: "loc_6",
    name: "Mumbai Airport T2",
    area: "Andheri, Mumbai",
    lat: 19.0896,
    lng: 72.8656,
  },
  {
    id: "loc_7",
    name: "Koregaon Park",
    area: "Pune",
    lat: 18.5362,
    lng: 73.8936,
  },
  { id: "loc_8", name: "Baner Road", area: "Pune", lat: 18.5589, lng: 73.7903 },
];

function getLocationById(id) {
  return (
    LOCATIONS.find(function (l) {
      return l.id === id;
    }) || null
  );
}

function estimateDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function distanceForRide(pickupId, dropId) {
  const p = getLocationById(pickupId);
  const d = getLocationById(dropId);
  if (!p || !d) return null;
  return estimateDistanceKm(p.lat, p.lng, d.lat, d.lng);
}

/* ---------- Map SVG renderer ---------- */
function renderMapSVG(pickupId, dropId) {
  const p = getLocationById(pickupId);
  const d = getLocationById(dropId);
  if (!p || !d) return "";

  const W = 400,
    H = 180;
  const padX = 46,
    padY = 42;

  const minLat = Math.min(p.lat, d.lat);
  const maxLat = Math.max(p.lat, d.lat);
  const minLng = Math.min(p.lng, d.lng);
  const maxLng = Math.max(p.lng, d.lng);

  const dLat = maxLat - minLat || 0.01;
  const dLng = maxLng - minLng || 0.01;

  function project(loc) {
    const x = padX + ((loc.lng - minLng) / dLng) * (W - 2 * padX);
    const y = padY + ((maxLat - loc.lat) / dLat) * (H - 2 * padY);
    return { x: x, y: y };
  }

  const p1 = project(p);
  const p2 = project(d);
  const cx = (p1.x + p2.x) / 2;
  const cy = Math.min(p1.y, p2.y) - 32;

  return (
    '<svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
    "<defs>" +
    '<pattern id="aptivo-grid" width="40" height="40" patternUnits="userSpaceOnUse">' +
    '<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e4e8ee" stroke-width="1"/>' +
    "</pattern>" +
    "</defs>" +
    '<rect width="' +
    W +
    '" height="' +
    H +
    '" fill="#f3f6fb"/>' +
    '<rect width="' +
    W +
    '" height="' +
    H +
    '" fill="url(#aptivo-grid)"/>' +
    /* Stylised road hints */
    '<path d="M0,124 Q100,104 200,116 T400,104" stroke="#d4dbe4" stroke-width="7" fill="none" opacity="0.7"/>' +
    '<path d="M56,0 L56,180" stroke="#d4dbe4" stroke-width="5" fill="none" opacity="0.6"/>' +
    '<path d="M300,0 L300,180" stroke="#d4dbe4" stroke-width="5" fill="none" opacity="0.6"/>' +
    '<path d="M0,44 L400,44" stroke="#d4dbe4" stroke-width="5" fill="none" opacity="0.5"/>' +
    /* Route */
    '<path d="M' +
    p1.x +
    "," +
    p1.y +
    " Q" +
    cx +
    "," +
    cy +
    " " +
    p2.x +
    "," +
    p2.y +
    '" ' +
    'stroke="#007AFF" stroke-width="3" fill="none" stroke-dasharray="7 5" stroke-linecap="round"/>' +
    /* Pickup pin */
    '<circle cx="' +
    p1.x +
    '" cy="' +
    p1.y +
    '" r="10" fill="#34C759" stroke="white" stroke-width="2.5"/>' +
    '<circle cx="' +
    p1.x +
    '" cy="' +
    p1.y +
    '" r="3.5" fill="white"/>' +
    /* Drop pin */
    '<circle cx="' +
    p2.x +
    '" cy="' +
    p2.y +
    '" r="10" fill="#FF3B30" stroke="white" stroke-width="2.5"/>' +
    '<circle cx="' +
    p2.x +
    '" cy="' +
    p2.y +
    '" r="3.5" fill="white"/>' +
    "</svg>"
  );
}

/* ---------- Recurring formatter ---------- */
function formatRecurringRule(rec) {
  if (!rec || !rec.type || rec.type === "none") return null;
  let rule = "";

  if (rec.type === "daily") {
    rule = "Daily";
  } else if (rec.type === "weekly") {
    rule = "Weekly";
  } else if (rec.type === "selected") {
    const days = (rec.weekdays || [])
      .slice()
      .sort()
      .map(function (d) {
        return WEEKDAY_NAMES[d];
      });
    if (!days.length) rule = "Selected weekdays";
    else if (days.length === 7) rule = "Every day";
    else rule = days.join(", ");
  } else if (rec.type === "custom") {
    rule = "Custom schedule";
  } else {
    return null;
  }

  if (rec.endDate) {
    rule +=
      " · until " +
      new Date(rec.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
  }
  return rule;
}

/* ---------- Status helpers ---------- */
function statusPillHTML(status) {
  const map =
    RIDE_STATUS[status] || BOOKING_STATUS[status] || RIDE_STATUS.available;
  return '<span class="status-pill ' + map.class + '">' + map.label + "</span>";
}

/* Get the display status for a viewer on a ride (owner / booked passenger / public) */
function getRideDisplayStatus(ride, viewerId) {
  if (ride.ownerId === viewerId) {
    return RIDE_STATUS[ride.status] || RIDE_STATUS.available;
  }
  const booking = getBookingFor(ride, viewerId);
  if (booking) {
    return BOOKING_STATUS[booking.status] || BOOKING_STATUS.requested;
  }
  return RIDE_STATUS[ride.status] || RIDE_STATUS.available;
}

function getBookingFor(ride, viewerId) {
  if (!ride || !ride.passengers) return null;
  return (
    ride.passengers.find(function (p) {
      return p.userId === viewerId;
    }) || null
  );
}

function getPendingRequestCount(ride) {
  if (!ride || !ride.passengers) return 0;
  return ride.passengers.filter(function (p) {
    return p.status === "requested";
  }).length;
}

/* ---------- Seat dots ---------- */
function seatDotsHTML(available, total) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      '<span class="seat-dot' +
        (i < total - available ? " filled" : "") +
        '"></span>',
    );
  }
  return (
    '<span class="seat-row">' +
    dots.join("") +
    "<span>" +
    available +
    " of " +
    total +
    " seats</span></span>"
  );
}

/* =====================================================================
   STORE — localStorage-backed data layer, auto-seeded on first load
   ===================================================================== */
const Store = (function () {
  const VERSION = "1.0.0";
  const K = {
    version: "aptivo_carpool_version",
    members: "aptivo_carpool_members",
    communities: "aptivo_carpool_communities",
    vehicles: "aptivo_carpool_vehicles",
    rides: "aptivo_carpool_rides",
    chats: "aptivo_carpool_chats",
  };

  const CURRENT_USER_ID = "res_1";
  const CURRENT_COMMUNITY_ID = "com_1";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback || [];
    } catch (e) {
      return fallback || [];
    }
  }
  function write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function seed() {
    const members = [
      {
        id: "res_1",
        name: "Priya Sharma",
        unit: "B-402",
        communityId: "com_1",
        verified: true,
      },
      {
        id: "res_2",
        name: "Rahul Mehta",
        unit: "A-101",
        communityId: "com_1",
        verified: true,
      },
      {
        id: "res_3",
        name: "Anita Desai",
        unit: "C-303",
        communityId: "com_1",
        verified: true,
      },
      {
        id: "res_4",
        name: "Vikram Joshi",
        unit: "B-201",
        communityId: "com_1",
        verified: true,
      },
      {
        id: "res_5",
        name: "Meera Nair",
        unit: "D-105",
        communityId: "com_1",
        verified: true,
      },
      {
        id: "res_ext_1",
        name: "Arjun Kapoor",
        unit: "P-201",
        communityId: "com_2",
        verified: true,
      },
      {
        id: "res_ext_2",
        name: "Sneha Iyer",
        unit: "S-105",
        communityId: "com_3",
        verified: true,
      },
    ];

    const communities = [
      { id: "com_1", name: "Green Valley Residency" },
      { id: "com_2", name: "Palm Grove Society" },
      { id: "com_3", name: "Sunrise Heights" },
      { id: "com_4", name: "Lake View Apartments" },
    ];

    const vehicles = [
      {
        id: "v_1",
        ownerId: "res_1",
        type: "Sedan",
        model: "Honda City",
        reg: "MH-12-AB-1234",
        seats: 4,
      },
      {
        id: "v_2",
        ownerId: "res_1",
        type: "Hatchback",
        model: "Maruti Swift",
        reg: "MH-12-CD-5678",
        seats: 4,
      },
    ];

    const rides = [
      /* ---- WITHIN COMMUNITY ---- */
      {
        id: "r_1",
        scope: "within",
        ownerId: "res_1",
        ownerName: "Priya Sharma",
        ownerUnit: "B-402",
        ownerCommunityId: "com_1",
        pickup: "loc_1",
        drop: "loc_3",
        date: tomorrowAt(0, 0),
        departureTime: "08:00",
        totalSeats: 4,
        availableSeats: 3,
        vehicleType: "Sedan",
        vehicleReg: "MH-12-AB-1234",
        contribution: "₹300",
        instructions:
          "Please be at the main gate by 7:50 AM. No smoking in the car.",
        recurring: null,
        status: "available",
        createdAt: Date.now() - 6 * HOUR,
        passengers: [
          {
            userId: "res_2",
            name: "Rahul Mehta",
            unit: "A-101",
            status: "requested",
            note: "Would like to join. Can meet at main gate.",
            requestedAt: Date.now() - 2 * HOUR,
          },
        ],
      },
      {
        id: "r_2",
        scope: "within",
        ownerId: "res_3",
        ownerName: "Anita Desai",
        ownerUnit: "C-303",
        ownerCommunityId: "com_1",
        pickup: "loc_1",
        drop: "loc_4",
        date: tomorrowAt(0, 0),
        departureTime: "17:00",
        totalSeats: 3,
        availableSeats: 2,
        vehicleType: "Hatchback",
        vehicleReg: "MH-12-EF-9012",
        contribution: "₹150",
        instructions: "Return trip around 9 PM. Flexible ±15 min.",
        recurring: null,
        status: "available",
        createdAt: Date.now() - 12 * HOUR,
        passengers: [
          {
            userId: "res_1",
            name: "Priya Sharma",
            unit: "B-402",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 8 * HOUR,
          },
        ],
      },
      {
        id: "r_3",
        scope: "within",
        ownerId: "res_4",
        ownerName: "Vikram Joshi",
        ownerUnit: "B-201",
        ownerCommunityId: "com_1",
        pickup: "loc_1",
        drop: "loc_2",
        date: tomorrowAt(0, 0),
        departureTime: "09:00",
        totalSeats: 3,
        availableSeats: 0,
        vehicleType: "Sedan",
        vehicleReg: "MH-12-GH-3456",
        contribution: "₹80",
        instructions: "Daily office ride. Carpoolers must be punctual.",
        recurring: {
          type: "selected",
          weekdays: [1, 2, 3, 4, 5],
          endDate: inDaysAt(30, 0, 0),
        },
        status: "fully-booked",
        createdAt: Date.now() - 2 * DAY,
        passengers: [
          {
            userId: "res_2",
            name: "Rahul Mehta",
            unit: "A-101",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 36 * HOUR,
          },
          {
            userId: "res_3",
            name: "Anita Desai",
            unit: "C-303",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 36 * HOUR,
          },
          {
            userId: "res_5",
            name: "Meera Nair",
            unit: "D-105",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 30 * HOUR,
          },
        ],
      },
      {
        id: "r_4",
        scope: "within",
        ownerId: "res_5",
        ownerName: "Meera Nair",
        ownerUnit: "D-105",
        ownerCommunityId: "com_1",
        pickup: "loc_1",
        drop: "loc_5",
        date: yesterdayAt(0, 0),
        departureTime: "07:00",
        totalSeats: 4,
        availableSeats: 0,
        vehicleType: "Sedan",
        vehicleReg: "MH-12-IJ-7890",
        contribution: "₹100",
        instructions: "Early morning station drop.",
        recurring: null,
        status: "completed",
        createdAt: Date.now() - 3 * DAY,
        passengers: [
          {
            userId: "res_1",
            name: "Priya Sharma",
            unit: "B-402",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 2.5 * DAY,
          },
          {
            userId: "res_3",
            name: "Anita Desai",
            unit: "C-303",
            status: "confirmed",
            note: "",
            requestedAt: Date.now() - 2.5 * DAY,
          },
        ],
      },
      {
        id: "r_5",
        scope: "within",
        ownerId: "res_2",
        ownerName: "Rahul Mehta",
        ownerUnit: "A-101",
        ownerCommunityId: "com_1",
        pickup: "loc_1",
        drop: "loc_4",
        date: tomorrowAt(0, 0),
        departureTime: "18:30",
        totalSeats: 3,
        availableSeats: 3,
        vehicleType: "Hatchback",
        vehicleReg: "MH-12-KL-2345",
        contribution: "₹120",
        instructions: "Cancelled due to vehicle service.",
        recurring: null,
        status: "cancelled",
        createdAt: Date.now() - DAY,
        passengers: [],
      },

      /* ---- BETWEEN COMMUNITIES ---- */
      {
        id: "r_6",
        scope: "between",
        ownerId: "res_ext_1",
        ownerName: "Arjun Kapoor",
        ownerUnit: "P-201",
        ownerCommunityId: "com_2",
        ownerCommunityName: "Palm Grove Society",
        pickup: "loc_1",
        drop: "loc_6",
        date: tomorrowAt(0, 0),
        departureTime: "06:30",
        totalSeats: 4,
        availableSeats: 3,
        vehicleType: "SUV",
        vehicleReg: "MH-14-MN-6789",
        contribution: "₹450",
        instructions: "Driving to Mumbai Airport T2. One suitcase per person.",
        recurring: null,
        status: "available",
        createdAt: Date.now() - 8 * HOUR,
        passengers: [],
      },
      {
        id: "r_7",
        scope: "between",
        ownerId: "res_ext_2",
        ownerName: "Sneha Iyer",
        ownerUnit: "S-105",
        ownerCommunityId: "com_3",
        ownerCommunityName: "Sunrise Heights",
        pickup: "loc_1",
        drop: "loc_3",
        date: inDaysAt(2, 0, 0),
        departureTime: "10:00",
        totalSeats: 3,
        availableSeats: 2,
        vehicleType: "Sedan",
        vehicleReg: "MH-12-OP-1122",
        contribution: "₹350",
        instructions:
          "Weekday airport run from Baner. Can also pick up from Aundh.",
        recurring: { type: "selected", weekdays: [1, 3, 5], endDate: null },
        status: "available",
        createdAt: Date.now() - 20 * HOUR,
        passengers: [
          {
            userId: "res_1",
            name: "Priya Sharma",
            unit: "B-402",
            status: "requested",
            note: "Will have one medium suitcase.",
            requestedAt: Date.now() - 2 * HOUR,
          },
        ],
      },
    ];

    const chats = [
      {
        id: "chat_r1_res_2",
        rideId: "r_1",
        ownerId: "res_1",
        passengerId: "res_2",
        messages: [
          {
            id: "cm_1",
            fromId: "res_2",
            text: "Hi Priya, is the pickup flexible? Could meet at the main gate instead of B-wing?",
            createdAt: Date.now() - 105 * MIN,
          },
          {
            id: "cm_2",
            fromId: "res_1",
            text: "Main gate works great for me. Let’s plan for 8 AM sharp.",
            createdAt: Date.now() - 95 * MIN,
          },
          {
            id: "cm_3",
            fromId: "res_2",
            text: "Perfect, thanks!",
            createdAt: Date.now() - 90 * MIN,
          },
        ],
      },
    ];

    write(K.members, members);
    write(K.communities, communities);
    write(K.vehicles, vehicles);
    write(K.rides, rides);
    write(K.chats, chats);
  }

  function init() {
    if (localStorage.getItem(K.version) !== VERSION) {
      seed();
      localStorage.setItem(K.version, VERSION);
    }
  }

  /* ----- Members / communities ----- */
  function getMembers() {
    return read(K.members, []);
  }
  function getMember(id) {
    return (
      getMembers().find(function (m) {
        return m.id === id;
      }) || null
    );
  }
  function getCurrentUser() {
    return getMember(CURRENT_USER_ID);
  }

  function getCommunities() {
    return read(K.communities, []);
  }
  function getCommunity(id) {
    return (
      getCommunities().find(function (c) {
        return c.id === id;
      }) || null
    );
  }
  function getCurrentCommunity() {
    return getCommunity(CURRENT_COMMUNITY_ID);
  }

  /* ----- Vehicles ----- */
  function getVehicles(ownerId) {
    const all = read(K.vehicles, []);
    return ownerId
      ? all.filter(function (v) {
          return v.ownerId === ownerId;
        })
      : all;
  }
  function saveVehicle(payload) {
    const all = read(K.vehicles, []);
    const v = {
      id: uid("v"),
      ownerId: CURRENT_USER_ID,
      type: payload.type || "Sedan",
      model: payload.model || "",
      reg: payload.reg,
      seats: payload.seats || 4,
    };
    all.push(v);
    write(K.vehicles, all);
    return v;
  }

  /* ----- Rides ----- */
  function getAllRides() {
    return read(K.rides, []);
  }
  function saveRides(list) {
    write(K.rides, list);
  }
  function getRide(id) {
    return (
      getAllRides().find(function (r) {
        return r.id === id;
      }) || null
    );
  }

  function getRidesByScope(scope) {
    return getAllRides()
      .filter(function (r) {
        return r.scope === scope;
      })
      .sort(function (a, b) {
        const aKey = a.date + a.departureTime;
        const bKey = b.date + b.departureTime;
        return aKey < bKey ? -1 : 1;
      });
  }

  function getRidesOwnedBy(userId, scope) {
    return getAllRides()
      .filter(function (r) {
        return r.ownerId === userId && (!scope || r.scope === scope);
      })
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });
  }

  function getRidesBookedBy(userId, scope) {
    return getAllRides()
      .filter(function (r) {
        if (scope && r.scope !== scope) return false;
        return (
          r.passengers &&
          r.passengers.some(function (p) {
            return p.userId === userId;
          })
        );
      })
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });
  }

  function createRide(payload) {
    const rides = getAllRides();
    const ride = {
      id: uid("r"),
      scope: payload.scope || "within",
      ownerId: CURRENT_USER_ID,
      ownerName: getCurrentUser().name,
      ownerUnit: getCurrentUser().unit,
      ownerCommunityId: CURRENT_COMMUNITY_ID,
      ownerCommunityName: getCurrentCommunity().name,
      pickup: payload.pickup,
      drop: payload.drop,
      date: payload.date,
      departureTime: payload.departureTime,
      totalSeats: payload.totalSeats,
      availableSeats: payload.totalSeats,
      vehicleType: payload.vehicleType,
      vehicleReg: payload.vehicleReg,
      contribution: payload.contribution || "",
      instructions: payload.instructions || "",
      recurring: payload.recurring || null,
      status: "available",
      createdAt: Date.now(),
      passengers: [],
    };
    rides.push(ride);
    saveRides(rides);
    return ride;
  }

  function updateRide(id, patch) {
    const rides = getAllRides();
    const idx = rides.findIndex(function (r) {
      return r.id === id;
    });
    if (idx < 0) return null;
    rides[idx] = Object.assign({}, rides[idx], patch);
    saveRides(rides);
    return rides[idx];
  }

  function cancelRide(id) {
    return updateRide(id, { status: "cancelled" });
  }

  function completeRide(id) {
    return updateRide(id, { status: "completed" });
  }

  /* ----- Join requests ----- */
  function requestToJoin(rideId, payload) {
    const rides = getAllRides();
    const ride = rides.find(function (r) {
      return r.id === rideId;
    });
    if (!ride) return null;

    const user = getCurrentUser();
    if (!ride.passengers) ride.passengers = [];

    const existing = ride.passengers.find(function (p) {
      return p.userId === user.id;
    });
    if (existing) return { error: "You already have a request on this ride" };

    if (ride.availableSeats <= 0) return { error: "This ride is fully booked" };

    ride.passengers.push({
      userId: user.id,
      name: user.name,
      unit: user.unit,
      status: "requested",
      note: payload.note || "",
      requestedAt: Date.now(),
    });
    saveRides(rides);

    /* Seed chat if not present so the passenger can immediately message the owner */
    seedChatIfMissing(rideId, user.id);

    return { ride: ride };
  }

  function respondToRequest(rideId, passengerId, decision) {
    const rides = getAllRides();
    const ride = rides.find(function (r) {
      return r.id === rideId;
    });
    if (!ride) return null;

    const p = (ride.passengers || []).find(function (p) {
      return p.userId === passengerId;
    });
    if (!p) return null;

    if (decision === "accept") {
      if (ride.availableSeats <= 0) return { error: "No seats available" };
      p.status = "confirmed";
      ride.availableSeats = Math.max(0, ride.availableSeats - 1);
      if (ride.availableSeats === 0) ride.status = "fully-booked";
    } else if (decision === "reject") {
      p.status = "rejected";
    }

    saveRides(rides);
    return { ride: ride, passenger: p };
  }

  /* ----- Chat ----- */
  function getChats() {
    return read(K.chats, []);
  }
  function saveChats(list) {
    write(K.chats, list);
  }

  function getChat(rideId, passengerId) {
    return (
      getChats().find(function (c) {
        return c.rideId === rideId && c.passengerId === passengerId;
      }) || null
    );
  }

  function seedChatIfMissing(rideId, passengerId) {
    const existing = getChat(rideId, passengerId);
    if (existing) return existing;
    const all = getChats();
    const chat = {
      id: uid("chat"),
      rideId: rideId,
      ownerId: (getRide(rideId) || {}).ownerId,
      passengerId: passengerId,
      messages: [],
    };
    all.push(chat);
    saveChats(all);
    return chat;
  }

  function sendChatMessage(rideId, passengerId, fromId, text) {
    const all = getChats();
    let chat = all.find(function (c) {
      return c.rideId === rideId && c.passengerId === passengerId;
    });
    if (!chat) {
      chat = {
        id: uid("chat"),
        rideId: rideId,
        ownerId: (getRide(rideId) || {}).ownerId,
        passengerId: passengerId,
        messages: [],
      };
      all.push(chat);
    }
    const msg = {
      id: uid("cm"),
      fromId: fromId,
      text: text,
      createdAt: Date.now(),
    };
    chat.messages.push(msg);
    saveChats(all);
    return msg;
  }

  /* ----- Public API ----- */
  return {
    CURRENT_USER_ID: CURRENT_USER_ID,
    CURRENT_COMMUNITY_ID: CURRENT_COMMUNITY_ID,

    init: init,
    getMembers: getMembers,
    getMember: getMember,
    getCurrentUser: getCurrentUser,
    getCommunities: getCommunities,
    getCommunity: getCommunity,
    getCurrentCommunity: getCurrentCommunity,

    getVehicles: getVehicles,
    saveVehicle: saveVehicle,

    getAllRides: getAllRides,
    getRide: getRide,
    getRidesByScope: getRidesByScope,
    getRidesOwnedBy: getRidesOwnedBy,
    getRidesBookedBy: getRidesBookedBy,
    createRide: createRide,
    updateRide: updateRide,
    cancelRide: cancelRide,
    completeRide: completeRide,

    requestToJoin: requestToJoin,
    respondToRequest: respondToRequest,

    getChat: getChat,
    seedChatIfMissing: seedChatIfMissing,
    sendChatMessage: sendChatMessage,
  };
})();

Store.init();

/* =====================================================================
   TOAST
   ===================================================================== */
function toast(message, type, duration) {
  type = type || "default";
  duration = duration || 2600;

  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  el.className = "toast" + (type !== "default" ? " " + type : "");
  el.textContent = message;
  container.appendChild(el);

  setTimeout(function () {
    el.style.transition = "opacity 0.2s, transform 0.2s";
    el.style.opacity = "0";
    el.style.transform = "translateY(-10px)";
    setTimeout(function () {
      el.remove();
    }, 220);
  }, duration);
}

/* =====================================================================
   SHEET
   ===================================================================== */
const Sheet = (function () {
  let backdrop = null;
  let sheet = null;
  let onCloseCb = null;

  function ensureDOM() {
    if (backdrop) return;
    backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.addEventListener("click", close);
    sheet = document.createElement("div");
    sheet.className = "sheet";
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
  }

  function open(opts) {
    opts = opts || {};
    ensureDOM();
    onCloseCb = opts.onClose || null;

    let html = '<div class="sheet-handle"></div>';
    if (opts.title)
      html += '<h3 class="sheet-title">' + escapeHtml(opts.title) + "</h3>";
    if (opts.content) html += opts.content;

    const options = opts.options || [];
    if (options.length) {
      html += options
        .map(function (opt, i) {
          return (
            '<button class="sheet-option' +
            (opt.danger ? " danger" : "") +
            '" data-idx="' +
            i +
            '">' +
            (opt.icon
              ? '<span class="sheet-option-icon">' + opt.icon + "</span>"
              : "") +
            '<span class="sheet-option-body">' +
            '<span class="sheet-option-title">' +
            escapeHtml(opt.label) +
            "</span>" +
            (opt.description
              ? '<span class="sheet-option-desc">' +
                escapeHtml(opt.description) +
                "</span>"
              : "") +
            "</span>" +
            "</button>"
          );
        })
        .join("");
    }

    if (opts.showCancel !== false) {
      html += '<button class="sheet-cancel">Cancel</button>';
    }
    sheet.innerHTML = html;

    $$(".sheet-option", sheet).forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = parseInt(btn.dataset.idx, 10);
        const opt = options[idx];
        close();
        if (opts.onSelect) opts.onSelect(opt, idx);
      });
    });
    const cancelBtn = $(".sheet-cancel", sheet);
    if (cancelBtn) cancelBtn.addEventListener("click", close);

    requestAnimationFrame(function () {
      backdrop.classList.add("open");
      sheet.classList.add("open");
    });
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove("open");
    sheet.classList.remove("open");
    if (onCloseCb) {
      const cb = onCloseCb;
      onCloseCb = null;
      cb();
    }
  }

  return { open: open, close: close };
})();

/* =====================================================================
   MODAL
   ===================================================================== */
const Modal = (function () {
  let backdrop = null;
  let modal = null;
  let onCloseCb = null;

  function ensureDOM() {
    if (backdrop) return;
    backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    modal = document.createElement("div");
    modal.className = "modal";
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });
  }

  function open(opts) {
    opts = opts || {};
    ensureDOM();
    onCloseCb = opts.onClose || null;

    const actions = opts.actions || [];
    modal.innerHTML =
      (opts.title
        ? '<h3 class="modal-title">' + escapeHtml(opts.title) + "</h3>"
        : "") +
      (opts.body
        ? '<p class="modal-body">' + escapeHtml(opts.body) + "</p>"
        : "") +
      '<div class="modal-actions">' +
      actions
        .map(function (a, i) {
          return (
            '<button class="btn ' +
            (a.style || "btn-secondary") +
            '" data-idx="' +
            i +
            '">' +
            escapeHtml(a.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>";

    $$(".modal-actions .btn", modal).forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = parseInt(btn.dataset.idx, 10);
        const action = actions[idx];
        close();
        if (action && action.onClick) action.onClick();
      });
    });

    requestAnimationFrame(function () {
      backdrop.classList.add("open");
    });
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove("open");
    if (onCloseCb) {
      const cb = onCloseCb;
      onCloseCb = null;
      cb();
    }
  }

  return { open: open, close: close };
})();

/* =====================================================================
   CONFIRM
   ===================================================================== */
const Confirm = {
  show: function (opts) {
    opts = opts || {};
    Modal.open({
      title: opts.title || "Are you sure?",
      body: opts.body || "",
      actions: [
        {
          label: opts.cancelLabel || "Cancel",
          style: "btn-secondary",
          onClick: opts.onCancel,
        },
        {
          label: opts.confirmLabel || "Confirm",
          style: opts.danger ? "btn-danger" : "btn-primary",
          onClick: opts.onConfirm,
        },
      ],
    });
  },
};

/* =====================================================================
   RENDER HELPERS
   ===================================================================== */
function avatarHTML(name, opts) {
  opts = opts || {};
  const cls =
    "avatar" +
    (opts.size ? " " + opts.size : "") +
    (opts.role ? " " + opts.role : "");
  return '<div class="' + cls + '">' + getInitials(name) + "</div>";
}

/* Reusable ride card */
function renderRideCard(ride, opts) {
  opts = opts || {};
  const viewerId = opts.viewerId || Store.CURRENT_USER_ID;
  const showCommunity = opts.showCommunity || false;

  const pickup = getLocationById(ride.pickup);
  const drop = getLocationById(ride.drop);
  const dist = distanceForRide(ride.pickup, ride.drop);
  const status = getRideDisplayStatus(ride, viewerId);
  const booking = getBookingFor(ride, viewerId);
  const isOwner = ride.ownerId === viewerId;
  const pending = isOwner ? getPendingRequestCount(ride) : 0;

  const recurringLabel = formatRecurringRule(ride.recurring);

  return (
    '<button type="button" class="ride-card" data-id="' +
    escapeHtml(ride.id) +
    '">' +
    /* Top: owner mini + status pill */
    '<div class="ride-card-top">' +
    '<div class="ride-owner-mini">' +
    avatarHTML(ride.ownerName, { size: "sm", role: "driver" }) +
    '<div class="flex-1">' +
    '<div class="owner-name">' +
    escapeHtml(ride.ownerName) +
    (isOwner ? " · You" : "") +
    "</div>" +
    '<div class="owner-meta">' +
    "<span>" +
    escapeHtml(ride.ownerUnit) +
    "</span>" +
    (showCommunity && ride.ownerCommunityName
      ? '<span class="community-badge">' +
        escapeHtml(ride.ownerCommunityName) +
        "</span>"
      : '<span class="verified-chip">Verified</span>') +
    "</div>" +
    "</div>" +
    "</div>" +
    statusPillHTML(status.class) +
    "</div>" +
    /* Route */
    '<div class="ride-route">' +
    '<div class="route-pins">' +
    '<span class="route-pin-dot"></span>' +
    '<span class="route-pin-line"></span>' +
    '<span class="route-pin-dot end"></span>' +
    "</div>" +
    '<div class="route-points">' +
    '<div class="route-point">' +
    '<div class="rp-label">Pickup</div>' +
    escapeHtml(pickup ? pickup.name : ride.pickup) +
    "</div>" +
    '<div class="route-point">' +
    '<div class="rp-label">Drop</div>' +
    escapeHtml(drop ? drop.name : ride.drop) +
    "</div>" +
    "</div>" +
    "</div>" +
    /* Meta row */
    '<div class="ride-meta-row">' +
    '<span class="ride-meta"><strong>' +
    relativeDate(ride.date) +
    "</strong> · " +
    formatTimeStr(ride.departureTime) +
    "</span>" +
    (dist != null ? '<span class="ride-meta">~' + dist + " km</span>" : "") +
    (ride.contribution
      ? '<span class="ride-meta cost">' +
        escapeHtml(ride.contribution) +
        "</span>"
      : '<span class="ride-meta">Free</span>') +
    "</div>" +
    /* Seat row + recurring */
    '<div class="row gap-sm wrap" style="align-items:center;">' +
    seatDotsHTML(ride.availableSeats, ride.totalSeats) +
    (recurringLabel
      ? '<span class="recurring-chip">' + escapeHtml(recurringLabel) + "</span>"
      : "") +
    "</div>" +
    /* Pending requests badge for owner */
    (pending > 0
      ? '<div class="row gap-xs" style="margin-top:2px;">' +
        '<span class="chip warning">' +
        pending +
        " pending request" +
        (pending > 1 ? "s" : "") +
        "</span>" +
        "</div>"
      : "") +
    /* Booking note when viewer has one */
    (booking && booking.status !== "rejected" && !isOwner
      ? '<div class="row gap-xs" style="margin-top:2px;">' +
        '<span class="chip primary">Your request · ' +
        BOOKING_STATUS[booking.status].label +
        "</span>" +
        "</div>"
      : "") +
    "</button>"
  );
}

/* =====================================================================
   RIDE FORM VALIDATION
   ===================================================================== */
function validateRideForm(form) {
  const errors = {};

  if (!form.pickup) errors.pickup = "Select a pickup location";
  if (!form.drop) errors.drop = "Select a drop location";
  if (form.pickup && form.drop && form.pickup === form.drop) {
    errors.drop = "Drop must be different from pickup";
  }

  if (!form.date) errors.date = "Select a travel date";
  else if (form.date < todayAt(0, 0) - DAY) {
    errors.date = "Date must be today or later";
  }

  if (!form.departureTime) errors.departureTime = "Select a departure time";

  if (!form.totalSeats || form.totalSeats < LIMITS.MIN_SEATS) {
    errors.totalSeats = "At least 1 seat required";
  } else if (form.totalSeats > LIMITS.MAX_SEATS_PER_VEHICLE) {
    errors.totalSeats =
      "Max " + LIMITS.MAX_SEATS_PER_VEHICLE + " seats per ride";
  }

  if (!form.vehicleType) errors.vehicleType = "Select a vehicle type";
  if (!form.vehicleReg) errors.vehicleReg = "Vehicle registration is required";
  else if (!LIMITS.REG_PATTERN.test(form.vehicleReg)) {
    errors.vehicleReg = "Format: MH-12-AB-1234";
  }

  if (form.instructions && form.instructions.length > LIMITS.INSTRUCTIONS_MAX) {
    errors.instructions = "Max " + LIMITS.INSTRUCTIONS_MAX + " characters";
  }

  /* Recurring validation */
  if (form.recurring && form.recurring.type === "selected") {
    if (!form.recurring.weekdays || form.recurring.weekdays.length === 0) {
      errors.recurring = "Select at least one weekday";
    }
  }
  if (form.recurring && form.recurring.endDate) {
    if (form.recurring.endDate < form.date) {
      errors.recurring = "End date must be after the ride date";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: errors,
  };
}

/* =====================================================================
   Global image-tile click → preview (unchanged pattern)
   ===================================================================== */
document.addEventListener("click", function (e) {
  const tile =
    e.target.closest && e.target.closest(".image-tile[data-attach-url]");
  if (!tile) return;
  Sheet.open({
    title: tile.dataset.attachName || "Attachment",
    content:
      '<img src="' +
      tile.dataset.attachUrl +
      '" alt="" style="width:100%;border-radius:13px;display:block;" />',
    showCancel: true,
  });
});
