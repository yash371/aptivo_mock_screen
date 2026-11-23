/* ==================================================================
   APTIVO — Documents section shared runtime
   Depends on: common.css
   ================================================================== */

/* ---------- Theme (mirror of theme.ts) ---------- */
const Theme = {
  colors: {
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#1a1a1a",
    textSecondary: "#6b6b6b",
    primary: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    border: "#e0e0e0",
  },
  radius: { xs: 4, sm: 9, md: 13, lg: 17, pill: 9999 },
  space: { xs: 4, sm: 9, md: 17, lg: 26, xl: 34, xxl: 52 },
};

/* ---------- Store (localStorage backed, seeded) ---------- */
const Store = (() => {
  const K_FOLDERS = "aptivo.folders.v1";
  const K_DOCS = "aptivo.docs.v1";

  const seedFolders = [
    { id: "society", name: "Society Documents", color: "blue", shared: true },
    { id: "my", name: "My Documents", color: "green", shared: false },
    { id: "invoices", name: "Invoices", color: "orange", shared: false },
    { id: "other", name: "Other Documents", color: "purple", shared: false },
  ];

  const seedDocs = [
    {
      id: "d1",
      name: "Society Rules & Regulations",
      file: "Society_Rules.pdf",
      type: "pdf",
      size: "2.4 MB",
      date: "2026-11-20",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
    {
      id: "d2",
      name: "Society Maintenance Policy",
      file: "Maintenance_Policy.pdf",
      type: "pdf",
      size: "1.8 MB",
      date: "2026-11-18",
      folderId: "society",
      uploadedBy: "Management",
      visibility: "shared",
    },
    {
      id: "d3",
      name: "Community Meeting Notice",
      file: "Meeting_Notice.docx",
      type: "docx",
      size: "850 KB",
      date: "2026-11-15",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
    {
      id: "d4",
      name: "Parking Allocation List",
      file: "Parking_Allocation.xlsx",
      type: "xlsx",
      size: "640 KB",
      date: "2026-11-05",
      folderId: "society",
      uploadedBy: "Management",
      visibility: "shared",
    },
    {
      id: "d5",
      name: "Emergency Contact Directory",
      file: "Emergency_Contacts.pdf",
      type: "pdf",
      size: "1.1 MB",
      date: "2026-11-05",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
    {
      id: "d6",
      name: "Property Registration Certificate",
      file: "Property_Reg.pdf",
      type: "pdf",
      size: "3.1 MB",
      date: "2026-11-10",
      folderId: "my",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d7",
      name: "Society Registration Certificate",
      file: "Society_Reg.pdf",
      type: "pdf",
      size: "2.4 MB",
      date: "2026-11-20",
      folderId: "my",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d8",
      name: "Maintenance Invoice - November",
      file: "Invoice_Nov.pdf",
      type: "pdf",
      size: "1.2 MB",
      date: "2026-11-18",
      folderId: "invoices",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d9",
      name: "Annual Budget",
      file: "Annual_Budget.xlsx",
      type: "xlsx",
      size: "920 KB",
      date: "2026-10-15",
      folderId: "invoices",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d10",
      name: "Monthly Meeting Minutes",
      file: "Meeting_Minutes.docx",
      type: "docx",
      size: "850 KB",
      date: "2026-11-18",
      folderId: "other",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d11",
      name: "Building Insurance Policy",
      file: "Insurance_Policy.pdf",
      type: "pdf",
      size: "3.1 MB",
      date: "2026-11-12",
      folderId: "other",
      uploadedBy: "You",
      visibility: "private",
    },
    {
      id: "d12",
      name: "Society Event Poster",
      file: "Event_Poster.jpg",
      type: "image",
      size: "3.2 MB",
      date: "2026-11-10",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
    {
      id: "d13",
      name: "Water Tank Maintenance",
      file: "Water_Tank.pdf",
      type: "pdf",
      size: "1.5 MB",
      date: "2026-10-29",
      folderId: "society",
      uploadedBy: "Management",
      visibility: "shared",
    },
    {
      id: "d14",
      name: "Diwali Notice",
      file: "Diwali_Notice.pdf",
      type: "pdf",
      size: "650 KB",
      date: "2026-10-22",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
    {
      id: "d15",
      name: "Parking Layout",
      file: "Parking_Layout.jpg",
      type: "image",
      size: "1.8 MB",
      date: "2026-11-08",
      folderId: "society",
      uploadedBy: "Admin",
      visibility: "shared",
    },
  ];

  function read(key, seed) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  return {
    /* read */
    folders: () => read(K_FOLDERS, seedFolders),
    docs: () => read(K_DOCS, seedDocs),
    getFolder: (id) => read(K_FOLDERS, seedFolders).find((f) => f.id === id),
    getDoc: (id) => read(K_DOCS, seedDocs).find((d) => d.id === id),
    docsIn: (folderId) =>
      read(K_DOCS, seedDocs).filter((d) => d.folderId === folderId),

    /* write */
    addFolder(folder) {
      const all = read(K_FOLDERS, seedFolders);
      const created = { id: uid("f"), color: "blue", shared: false, ...folder };
      all.push(created);
      write(K_FOLDERS, all);
      return created;
    },
    addDoc(doc) {
      const all = read(K_DOCS, seedDocs);
      const created = { id: uid("d"), ...doc };
      all.push(created);
      write(K_DOCS, all);
      return created;
    },
    updateDoc(id, patch) {
      const all = read(K_DOCS, seedDocs);
      const i = all.findIndex((d) => d.id === id);
      if (i >= 0) {
        all[i] = { ...all[i], ...patch };
        write(K_DOCS, all);
      }
    },
    removeDoc(id) {
      write(
        K_DOCS,
        read(K_DOCS, seedDocs).filter((d) => d.id !== id),
      );
    },
    updateFolder(id, patch) {
      const all = read(K_FOLDERS, seedFolders);
      const i = all.findIndex((f) => f.id === id);
      if (i >= 0) {
        all[i] = { ...all[i], ...patch };
        write(K_FOLDERS, all);
      }
    },
    removeFolder(id) {
      write(
        K_FOLDERS,
        read(K_FOLDERS, seedFolders).filter((f) => f.id !== id),
      );
      write(
        K_DOCS,
        read(K_DOCS, seedDocs).filter((d) => d.folderId !== id),
      );
    },
    reset() {
      localStorage.removeItem(K_FOLDERS);
      localStorage.removeItem(K_DOCS);
    },
    uid,
  };
})();

/* ---------- Helpers ---------- */
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const M = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]} ${d.getFullYear()}`;
}
function fileMeta(type) {
  switch ((type || "").toLowerCase()) {
    case "pdf":
      return { label: "PDF", cls: "pdf" };
    case "docx":
    case "doc":
      return { label: "DOC", cls: "docx" };
    case "xlsx":
    case "xls":
      return { label: "XLS", cls: "xlsx" };
    case "image":
    case "img":
    case "jpg":
    case "png":
      return { label: "IMG", cls: "image" };
    default:
      return { label: "FILE", cls: "docx" };
  }
}

/* ---------- Toast ---------- */
function toast(message, duration = 2200) {
  const el = document.getElementById("__toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), duration);
}

/* ---------- Sheet ---------- */
const Sheet = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("open");
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  },
  closeAll() {
    document
      .querySelectorAll(".sheet-overlay.open")
      .forEach((el) => el.classList.remove("open"));
  },
};

/* auto-close: backdrop click + .sheet-close + [data-sheet-close] */
document.addEventListener("click", (e) => {
  const overlay = e.target.closest(".sheet-overlay");
  if (overlay && e.target === overlay) overlay.classList.remove("open");
  const closer = e.target.closest(".sheet-close, [data-sheet-close]");
  if (closer) {
    const ov = closer.closest(".sheet-overlay");
    if (ov) ov.classList.remove("open");
  }
});

/* ---------- Global UI (toast, confirm modal, actions sheet) ---------- */
function ensureGlobalUI() {
  if (!document.getElementById("__toast")) {
    const t = document.createElement("div");
    t.id = "__toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  if (!document.getElementById("__modal")) {
    const m = document.createElement("div");
    m.id = "__modal";
    m.className = "modal-overlay";
    m.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3 class="modal-title"></h3>
        <p class="modal-message"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost modal-cancel"></button>
          <button type="button" class="btn btn-primary modal-confirm"></button>
        </div>
      </div>`;
    document.body.appendChild(m);
  }
  if (!document.getElementById("__sheetActions")) {
    const s = document.createElement("div");
    s.id = "__sheetActions";
    s.className = "sheet-overlay";
    s.innerHTML = `
      <section class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <div class="sheet-head">
          <div>
            <h3 class="sheet-title"></h3>
            <p class="sheet-sub"></p>
          </div>
          <button type="button" class="sheet-close" aria-label="Close">×</button>
        </div>
        <div class="sheet-body"></div>
        <button type="button" class="btn btn-ghost btn-block" data-sheet-close>Cancel</button>
      </section>`;
    document.body.appendChild(s);
  }
}

const Modal = {
  confirm({
    title,
    message = "",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm,
  }) {
    const m = document.getElementById("__modal");
    if (!m) return;
    m.querySelector(".modal-title").textContent = title || "";
    const msg = m.querySelector(".modal-message");
    if (message) {
      msg.textContent = message;
      msg.hidden = false;
    } else {
      msg.hidden = true;
    }

    const cancelBtn = m.querySelector(".modal-cancel");
    const confirmBtn = m.querySelector(".modal-confirm");
    cancelBtn.textContent = cancelLabel;
    confirmBtn.textContent = confirmLabel;
    confirmBtn.className =
      "btn modal-confirm " + (danger ? "btn-danger" : "btn-primary");

    /* reset listeners */
    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.replaceWith(newCancel);
    confirmBtn.replaceWith(newConfirm);

    newCancel.addEventListener("click", () => m.classList.remove("open"));
    newConfirm.addEventListener("click", () => {
      m.classList.remove("open");
      if (typeof onConfirm === "function") setTimeout(onConfirm, 60);
    });
    m.classList.add("open");
  },
};

function openActionsSheet({ title, subtitle = "", items = [] }) {
  const sheet = document.getElementById("__sheetActions");
  if (!sheet) return;
  sheet.querySelector(".sheet-title").textContent = title || "";
  const sub = sheet.querySelector(".sheet-sub");
  if (subtitle) {
    sub.textContent = subtitle;
    sub.hidden = false;
  } else {
    sub.hidden = true;
  }

  const body = sheet.querySelector(".sheet-body");
  body.innerHTML = items
    .map(
      (it, i) => `
      <button type="button" class="sheet-action${it.danger ? " is-danger" : ""}" data-i="${i}">
        <span class="sheet-action-icon">${escapeHtml(it.icon || "")}</span>
        <span class="sheet-action-label">${escapeHtml(it.label)}</span>
        <span class="sheet-action-chevron">›</span>
      </button>`,
    )
    .join("");

  body.querySelectorAll(".sheet-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = items[Number(btn.dataset.i)];
      Sheet.close("__sheetActions");
      if (item && typeof item.onClick === "function")
        setTimeout(item.onClick, 80);
    });
  });

  Sheet.open("__sheetActions");
}

/* ---------- Bootstrap ---------- */
document.addEventListener("DOMContentLoaded", ensureGlobalUI);
