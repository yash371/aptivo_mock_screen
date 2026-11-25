/* =====================================================================
   APTIVO — Message to Guard — common.js
   Shared runtime: Store, Toast, Sheet, Modal, Confirm, helpers, seed data
   No frameworks · No build step · No network calls
   ===================================================================== */

/* ---------- Time constants ---------- */
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/* ---------- Theme (reserved, tokens live in CSS) ---------- */
const Theme = {
  init() {
    /* CSS handles theming */
  },
};

/* ---------- DOM / string utilities ---------- */
function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

function $(sel, root = document) {
  return root.querySelector(sel);
}
function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function navigate(url) {
  window.location.href = url;
}

function goBack(fallback = "list.html") {
  if (window.history.length > 1) window.history.back();
  else window.location.href = fallback;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m],
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------- Time formatters ---------- */
function formatTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ap;
}

function formatDate(ts) {
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
  if (diff < HOUR) return Math.floor(diff / MIN) + "m";
  if (diff < DAY) return Math.floor(diff / HOUR) + "h";
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return Math.floor(diff / DAY) + "d";
  return formatDate(ts);
}

function dayDividerLabel(ts) {
  const now = new Date();
  const d = new Date(ts);
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = (today - day) / DAY;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/* ---------- Conversation / message status maps ---------- */
const CONV_STATUS = {
  active: { label: "Active", chipClass: "primary" },
  resolved: { label: "Resolved", chipClass: "success" },
  closed: { label: "Closed", chipClass: "" },
};

const MSG_STATUS = {
  sent: { label: "Sent", ticks: "✓" },
  delivered: { label: "Delivered", ticks: "✓✓" },
  read: { label: "Read", ticks: "✓✓" },
};

function convStatusChip(status) {
  const s = CONV_STATUS[status] || CONV_STATUS.active;
  return `<span class="chip ${s.chipClass}">${s.label}</span>`;
}

function msgStatusHTML(status) {
  const s = MSG_STATUS[status] || MSG_STATUS.sent;
  return `<span class="msg-status ${status}"><span class="ticks">${s.ticks}</span><span>${s.label}</span></span>`;
}

/* ---------- Validation / limits ---------- */
const LIMITS = {
  MESSAGE_MAX: 1000,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  FILE_MAX_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/zip",
  ],
};

function validateMessageText(text) {
  const t = (text || "").trim();
  if (!t) return { valid: false, error: "Message cannot be empty" };
  if (t.length > LIMITS.MESSAGE_MAX) {
    return {
      valid: false,
      error: "Message exceeds " + LIMITS.MESSAGE_MAX + " characters",
      length: t.length,
    };
  }
  return { valid: true, length: t.length };
}

function validateAttachment(file) {
  if (!file) return { valid: false, error: "No file selected" };
  const isImage = file.type && file.type.startsWith("image/");
  if (isImage) {
    if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type))
      return { valid: false, error: "Unsupported image type" };
    if (file.size > LIMITS.IMAGE_MAX_BYTES)
      return { valid: false, error: "Image too large (max 5 MB)" };
  } else {
    if (!LIMITS.ALLOWED_FILE_TYPES.includes(file.type))
      return { valid: false, error: "Unsupported file type" };
    if (file.size > LIMITS.FILE_MAX_BYTES)
      return { valid: false, error: "File too large (max 10 MB)" };
  }
  return { valid: true };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

/* =====================================================================
   STORE — localStorage-backed data layer, auto-seeded on first load
   ===================================================================== */
const Store = (function () {
  const K = {
    guards: "aptivo_mg_guards",
    conversations: "aptivo_mg_conversations",
    messages: "aptivo_mg_messages",
    version: "aptivo_mg_version",
  };
  const VERSION = "1.0.0";

  const RESIDENT = { id: "res_1", name: "Priya Sharma", unit: "B-402" };
  const PRIMARY_GUARD = "g1";

  function read(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function svgImage(text, bg) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="400" height="300" fill="' +
      bg +
      '"/>' +
      '<text x="50%" y="50%" font-family="-apple-system,sans-serif" font-size="22" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">' +
      text +
      "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function seed() {
    const now = Date.now();

    const guards = [
      {
        id: "g1",
        name: "Ramesh Kumar",
        gate: "Gate A",
        onDuty: true,
        phone: "+91 98765 43210",
      },
      {
        id: "g2",
        name: "Suresh Yadav",
        gate: "Gate B",
        onDuty: true,
        phone: "+91 98765 43211",
      },
      {
        id: "g3",
        name: "Vikram Singh",
        gate: "Gate C",
        onDuty: false,
        phone: "+91 98765 43212",
      },
      {
        id: "g4",
        name: "Mahesh Patil",
        gate: "Main Gate",
        onDuty: true,
        phone: "+91 98765 43213",
      },
    ];

    const conversations = [
      {
        id: "c1",
        residentId: RESIDENT.id,
        residentName: RESIDENT.name,
        residentUnit: RESIDENT.unit,
        guardId: "g1",
        guardName: "Ramesh Kumar",
        recipientType: "assigned",
        recipientLabel: "Ramesh Kumar · Gate A",
        status: "active",
        createdAt: now - 2 * HOUR,
        updatedAt: now - HOUR - 48 * MIN,
        unreadForResident: 1,
        unreadForGuard: 0,
      },

      {
        id: "c2",
        residentId: RESIDENT.id,
        residentName: RESIDENT.name,
        residentUnit: RESIDENT.unit,
        guardId: "g1",
        guardName: "Ramesh Kumar",
        recipientType: "assigned",
        recipientLabel: "Ramesh Kumar · Gate A",
        status: "resolved",
        createdAt: now - 2 * DAY,
        updatedAt: now - 2 * DAY + 30 * MIN,
        unreadForResident: 0,
        unreadForGuard: 0,
      },

      {
        id: "c3",
        residentId: RESIDENT.id,
        residentName: RESIDENT.name,
        residentUnit: RESIDENT.unit,
        guardId: null,
        guardName: "All On-Duty Guards",
        recipientType: "all",
        recipientLabel: "All On-Duty Guards",
        status: "closed",
        createdAt: now - 5 * DAY,
        updatedAt: now - 5 * DAY + 20 * MIN,
        unreadForResident: 0,
        unreadForGuard: 0,
      },

      {
        id: "c4",
        residentId: "res_2",
        residentName: "Rahul Mehta",
        residentUnit: "A-101",
        guardId: "g1",
        guardName: "Ramesh Kumar",
        recipientType: "assigned",
        recipientLabel: "Ramesh Kumar · Gate A",
        status: "active",
        createdAt: now - 15 * MIN,
        updatedAt: now - 8 * MIN,
        unreadForResident: 0,
        unreadForGuard: 2,
      },

      {
        id: "c5",
        residentId: "res_3",
        residentName: "Anita Desai",
        residentUnit: "C-303",
        guardId: "g2",
        guardName: "Suresh Yadav",
        recipientType: "assigned",
        recipientLabel: "Suresh Yadav · Gate B",
        status: "active",
        createdAt: now - 40 * MIN,
        updatedAt: now - 35 * MIN,
        unreadForResident: 0,
        unreadForGuard: 1,
      },

      {
        id: "c6",
        residentId: RESIDENT.id,
        residentName: RESIDENT.name,
        residentUnit: RESIDENT.unit,
        guardId: "g3",
        guardName: "Vikram Singh",
        recipientType: "selected",
        recipientLabel: "Vikram Singh · Gate C",
        status: "active",
        createdAt: now - HOUR,
        updatedAt: now - HOUR,
        unreadForResident: 0,
        unreadForGuard: 0,
      },
    ];

    const messages = [
      /* c1 — suspicious activity */
      {
        id: "m_c1_1",
        conversationId: "c1",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "Hi, there's a suspicious person near the parking area.",
        attachments: [],
        status: "read",
        createdAt: now - 2 * HOUR,
      },
      {
        id: "m_c1_2",
        conversationId: "c1",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "Thank you for informing, ma'am. I'll check right away.",
        attachments: [],
        status: "read",
        createdAt: now - HOUR - 55 * MIN,
      },
      {
        id: "m_c1_3",
        conversationId: "c1",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "He's near the B-wing visitor parking, next to the white sedan.",
        attachments: [
          {
            type: "image",
            url: svgImage("Parking Area", "#007AFF"),
            name: "parking-area.jpg",
            size: "245 KB",
          },
        ],
        status: "read",
        createdAt: now - HOUR - 50 * MIN,
      },
      {
        id: "m_c1_4",
        conversationId: "c1",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "I'm on my way. Will update you shortly.",
        attachments: [],
        status: "delivered",
        createdAt: now - HOUR - 48 * MIN,
      },

      /* c2 — wrong package delivery (resolved) */
      {
        id: "m_c2_1",
        conversationId: "c2",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "A package was delivered to the wrong flat yesterday. Could you please check?",
        attachments: [],
        status: "read",
        createdAt: now - 2 * DAY,
      },
      {
        id: "m_c2_2",
        conversationId: "c2",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "I've noted it, ma'am. I'll coordinate with the delivery team and get it redirected.",
        attachments: [],
        status: "read",
        createdAt: now - 2 * DAY + 8 * MIN,
      },
      {
        id: "m_c2_3",
        conversationId: "c2",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "Thank you so much!",
        attachments: [],
        status: "read",
        createdAt: now - 2 * DAY + 15 * MIN,
      },
      {
        id: "m_c2_4",
        conversationId: "c2",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "Package delivered to correct flat this morning. Marking this as resolved.",
        attachments: [],
        status: "read",
        createdAt: now - 2 * DAY + 30 * MIN,
      },

      /* c3 — burst pipe (closed) */
      {
        id: "m_c3_1",
        conversationId: "c3",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "URGENT: Water pipe burst in basement parking. Please help!",
        attachments: [],
        status: "read",
        createdAt: now - 5 * DAY,
      },
      {
        id: "m_c3_2",
        conversationId: "c3",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "Alerting all guards and maintenance team now.",
        attachments: [],
        status: "read",
        createdAt: now - 5 * DAY + 3 * MIN,
      },
      {
        id: "m_c3_3",
        conversationId: "c3",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "Maintenance has been notified. Issue being handled. You can move your car if needed.",
        attachments: [],
        status: "read",
        createdAt: now - 5 * DAY + 15 * MIN,
      },
      {
        id: "m_c3_4",
        conversationId: "c3",
        senderType: "guard",
        senderName: "Ramesh Kumar",
        text: "Issue has been fixed. Closing this conversation.",
        attachments: [],
        status: "read",
        createdAt: now - 5 * DAY + 20 * MIN,
      },

      /* c4 — Rahul Mehta, blocked parking */
      {
        id: "m_c4_1",
        conversationId: "c4",
        senderType: "resident",
        senderName: "Rahul Mehta",
        text: "There's a car blocking my parking spot in basement 1.",
        attachments: [],
        status: "delivered",
        createdAt: now - 15 * MIN,
      },
      {
        id: "m_c4_2",
        conversationId: "c4",
        senderType: "resident",
        senderName: "Rahul Mehta",
        text: "Here's the picture.",
        attachments: [
          {
            type: "image",
            url: svgImage("Blocked Parking", "#FF9500"),
            name: "blocked-parking.jpg",
            size: "312 KB",
          },
        ],
        status: "delivered",
        createdAt: now - 8 * MIN,
      },

      /* c5 — Anita Desai, visitor verification */
      {
        id: "m_c5_1",
        conversationId: "c5",
        senderType: "resident",
        senderName: "Anita Desai",
        text: "A visitor at Gate B says they don't have an appointment but wants to enter. Please verify.",
        attachments: [],
        status: "delivered",
        createdAt: now - 40 * MIN,
      },
      {
        id: "m_c5_2",
        conversationId: "c5",
        senderType: "resident",
        senderName: "Anita Desai",
        text: "Visitor name: Mr. Kapoor, claims to visit flat C-303.",
        attachments: [],
        status: "delivered",
        createdAt: now - 35 * MIN,
      },

      /* c6 — Priya to Vikram, stuck barricade */
      {
        id: "m_c6_1",
        conversationId: "c6",
        senderType: "resident",
        senderName: "Priya Sharma",
        text: "The gate barricade at Gate C seems stuck. Vehicles are not able to pass.",
        attachments: [],
        status: "sent",
        createdAt: now - HOUR,
      },
    ];

    write(K.guards, guards);
    write(K.conversations, conversations);
    write(K.messages, messages);
  }

  function init() {
    if (localStorage.getItem(K.version) !== VERSION) {
      seed();
      localStorage.setItem(K.version, VERSION);
    }
  }

  /* ----- Guards ----- */
  function getGuards() {
    return read(K.guards);
  }
  function getGuard(id) {
    return getGuards().find((g) => g.id === id) || null;
  }
  function getAssignedGuard() {
    return getGuard("g1");
  }
  function getOnDutyGuards() {
    return getGuards().filter((g) => g.onDuty);
  }

  /* ----- Conversations ----- */
  function getAllConversations() {
    return read(K.conversations);
  }
  function getConversation(id) {
    return getAllConversations().find((c) => c.id === id) || null;
  }
  function saveConversations(l) {
    write(K.conversations, l);
  }

  function getConversationsForResident(residentId) {
    return getAllConversations()
      .filter((c) => c.residentId === residentId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  function getConversationsForGuard(guardId) {
    return getAllConversations()
      .filter((c) => c.guardId === guardId || c.recipientType === "all")
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function updateConversation(id, patch) {
    const list = getAllConversations();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    list[idx] = Object.assign({}, list[idx], patch, { updatedAt: Date.now() });
    saveConversations(list);
    return list[idx];
  }

  /* ----- Messages ----- */
  function getAllMessages() {
    return read(K.messages);
  }
  function saveMessages(l) {
    write(K.messages, l);
  }

  function getMessages(convId) {
    return getAllMessages()
      .filter((m) => m.conversationId === convId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  function getLastMessage(convId) {
    const msgs = getMessages(convId);
    return msgs[msgs.length - 1] || null;
  }

  /* ----- Mutations ----- */
  function createConversation(guardId, recipientType, recipientLabel) {
    const guard = guardId ? getGuard(guardId) : null;
    const conv = {
      id: uid("c"),
      residentId: RESIDENT.id,
      residentName: RESIDENT.name,
      residentUnit: RESIDENT.unit,
      guardId: guardId || null,
      guardName: guard ? guard.name : "All On-Duty Guards",
      recipientType: recipientType,
      recipientLabel: recipientLabel,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadForResident: 0,
      unreadForGuard: 0,
    };
    const list = getAllConversations();
    list.unshift(conv);
    saveConversations(list);
    return conv;
  }

  function sendMessage(convId, payload) {
    const msg = {
      id: uid("m"),
      conversationId: convId,
      senderType: payload.senderType,
      senderName: payload.senderName,
      text: payload.text || "",
      attachments: payload.attachments || [],
      status: "sent",
      createdAt: Date.now(),
    };
    const all = getAllMessages();
    all.push(msg);
    saveMessages(all);

    /* increment recipient unread */
    const conv = getConversation(convId);
    if (conv) {
      const patch = { updatedAt: msg.createdAt };
      if (payload.senderType === "resident") {
        patch.unreadForGuard = (conv.unreadForGuard || 0) + 1;
      } else if (payload.senderType === "guard") {
        patch.unreadForResident = (conv.unreadForResident || 0) + 1;
      }
      updateConversation(convId, patch);
    }

    /* simulate delivery receipt shortly after */
    setTimeout(function () {
      const cur = getMessages(convId).find((m) => m.id === msg.id);
      if (cur && cur.status === "sent")
        updateMessageStatus(convId, msg.id, "delivered");
    }, 1200);

    return msg;
  }

  function updateMessageStatus(convId, msgId, status) {
    const all = getAllMessages();
    const idx = all.findIndex(
      (m) => m.id === msgId && m.conversationId === convId,
    );
    if (idx < 0) return null;
    all[idx].status = status;
    saveMessages(all);
    return all[idx];
  }

  function markConversationRead(convId, forRole) {
    if (forRole !== "resident" && forRole !== "guard") return;
    const conv = getConversation(convId);
    if (!conv) return;

    const patch = {};
    if (forRole === "resident") patch.unreadForResident = 0;
    if (forRole === "guard") patch.unreadForGuard = 0;

    const all = getAllMessages();
    let changed = false;
    all.forEach(function (m) {
      if (
        m.conversationId === convId &&
        m.senderType !== forRole &&
        m.status !== "read"
      ) {
        m.status = "read";
        changed = true;
      }
    });
    if (changed) saveMessages(all);
    updateConversation(convId, patch);
  }

  function setConversationStatus(convId, status) {
    return updateConversation(convId, { status: status });
  }
  function reopenConversation(convId) {
    return updateConversation(convId, { status: "active" });
  }

  /* ----- Aggregates ----- */
  function getUnreadCountForResident() {
    return getConversationsForResident(RESIDENT.id).reduce(function (s, c) {
      return s + (c.unreadForResident || 0);
    }, 0);
  }
  function getUnreadCountForGuard(guardId) {
    return getConversationsForGuard(guardId).reduce(function (s, c) {
      return s + (c.unreadForGuard || 0);
    }, 0);
  }

  /* ----- Demo helper: simulate an inbound resident message ----- */
  function simulateIncomingForGuard(guardId) {
    guardId = guardId || PRIMARY_GUARD;
    const pool = getConversationsForGuard(guardId).filter(
      (c) => c.status === "active",
    );
    if (!pool.length) return null;
    const conv = pool[Math.floor(Math.random() * pool.length)];
    const samples = [
      "Hi, could you please check the main gate?",
      "There seems to be an issue near the lobby.",
      "Please send someone to B-wing quickly.",
      "Is the visitor parking full? Need to park my car.",
    ];
    const msg = sendMessage(conv.id, {
      senderType: "resident",
      senderName: conv.residentName,
      text: samples[Math.floor(Math.random() * samples.length)],
      attachments: [],
    });
    return { conversation: conv, message: msg };
  }

  return {
    RESIDENT: RESIDENT,
    PRIMARY_GUARD: PRIMARY_GUARD,
    init: init,
    getGuards: getGuards,
    getGuard: getGuard,
    getAssignedGuard: getAssignedGuard,
    getOnDutyGuards: getOnDutyGuards,
    getAllConversations: getAllConversations,
    getConversation: getConversation,
    getConversationsForResident: getConversationsForResident,
    getConversationsForGuard: getConversationsForGuard,
    updateConversation: updateConversation,
    getMessages: getMessages,
    getLastMessage: getLastMessage,
    createConversation: createConversation,
    sendMessage: sendMessage,
    updateMessageStatus: updateMessageStatus,
    markConversationRead: markConversationRead,
    setConversationStatus: setConversationStatus,
    reopenConversation: reopenConversation,
    getUnreadCountForResident: getUnreadCountForResident,
    getUnreadCountForGuard: getUnreadCountForGuard,
    simulateIncomingForGuard: simulateIncomingForGuard,
    svgImage: svgImage,
  };
})();

/* Auto-seed on first load */
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
   SHEET (bottom sheet)
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
   CONFIRM (thin wrapper over Modal)
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
   CHAT RENDERING HELPERS
   ===================================================================== */
function isOutgoing(msg, myRole) {
  if (myRole === "admin") return msg.senderType === "guard";
  return msg.senderType === myRole;
}

function attachmentHTML(a) {
  if (!a) return "";
  if (a.type === "image") {
    return (
      '<div class="image-tile" data-attach-url="' +
      escapeHtml(a.url) +
      '" data-attach-name="' +
      escapeHtml(a.name) +
      '">' +
      '<img src="' +
      escapeHtml(a.url) +
      '" alt="' +
      escapeHtml(a.name) +
      '" loading="lazy" />' +
      '<span class="img-label">' +
      escapeHtml(a.name) +
      "</span>" +
      "</div>"
    );
  }
  return (
    '<div class="attachment-tile">' +
    '<span class="attachment-icon">📄</span>' +
    '<span class="attachment-meta">' +
    '<span class="attachment-name">' +
    escapeHtml(a.name) +
    "</span>" +
    '<span class="attachment-size">' +
    escapeHtml(a.size || "File") +
    "</span>" +
    "</span>" +
    "</div>"
  );
}

function renderMessageBubble(m, myRole) {
  const outgoing = isOutgoing(m, myRole);
  const statusHTML = outgoing ? msgStatusHTML(m.status) : "";
  const attachHTML = (m.attachments || []).map(attachmentHTML).join("");

  return (
    '<div class="msg-row ' +
    (outgoing ? "outgoing" : "incoming") +
    '">' +
    '<div class="bubble ' +
    (outgoing ? "outgoing" : "incoming") +
    '">' +
    (m.text ? "<div>" + escapeHtml(m.text) + "</div>" : "") +
    attachHTML +
    '<div class="msg-time">' +
    "<span>" +
    formatTime(m.createdAt) +
    "</span>" +
    statusHTML +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function renderChatMessages(messages, myRole) {
  let html = "";
  let lastDay = null;
  messages.forEach(function (m) {
    const day = dayDividerLabel(m.createdAt);
    if (day !== lastDay) {
      html += '<div class="date-divider">' + day + "</div>";
      lastDay = day;
    }
    html += renderMessageBubble(m, myRole);
  });
  return html;
}

/* Delegated click for image tiles → preview sheet */
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

/* =====================================================================
   SMALL UI HELPERS
   ===================================================================== */
function avatarHTML(name, opts) {
  opts = opts || {};
  const cls =
    "avatar" +
    (opts.size ? " " + opts.size : "") +
    (opts.role ? " " + opts.role : "");
  return '<div class="' + cls + '">' + getInitials(name) + "</div>";
}

/* Role switch links — used in the header of every screen */
function roleLinks(currentRole, convId) {
  const enc = convId ? encodeURIComponent(convId) : "";
  const hrefs = {
    resident: convId ? "chat.html?id=" + enc : "list.html",
    guard: convId ? "guard-chat.html?id=" + enc : "guard-inbox.html",
    admin: convId ? "admin-chat.html?id=" + enc : "admin-monitor.html",
  };
  const labels = { resident: "Resident", guard: "Guard", admin: "Admin" };
  const out = [];
  ["resident", "guard"].forEach(function (role) {
    if (role === currentRole) return;
    out.push(
      '<a class="role-switch" href="' +
        hrefs[role] +
        '" title="Switch to ' +
        labels[role] +
        ' view">' +
        labels[role] +
        "</a>",
    );
  });
  return out.join("");
}
