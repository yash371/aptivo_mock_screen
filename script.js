const treeRoot = document.getElementById("tree-root");
const previewContent = document.getElementById("preview-content");
const searchInput = document.getElementById("tree-search");
const itemCount = document.getElementById("item-count");
const expandAllButton = document.getElementById("expand-all");

let projectData = null;
let selectedId = null;
let expandedIds = new Set();

function makeId() {
  return `node-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeNodes(nodes, parentPath = []) {
  return (nodes || []).map((node) => {
    const normalized = { ...node };
    normalized.id = normalized.id || makeId();
    normalized.type =
      normalized.type ||
      (Array.isArray(normalized.children) ? "folder" : "link");
    normalized.path = [...parentPath, normalized.title || "Untitled"];
    if (normalized.type === "folder") {
      normalized.children = normalizeNodes(
        normalized.children || [],
        normalized.path,
      );
    }
    return normalized;
  });
}

function flatten(nodes) {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flatten(node.children) : []),
  ]);
}

function countItems(nodes) {
  return flatten(nodes).length;
}

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function folderContainsMatch(node, query) {
  if (node.title.toLowerCase().includes(query)) return true;
  return (node.children || []).some((child) =>
    folderContainsMatch(child, query),
  );
}

function renderTree(nodes, query = "") {
  const list = document.createElement("ul");
  list.className = "tree-list";

  nodes.forEach((node) => {
    if (query && !folderContainsMatch(node, query)) return;

    const item = document.createElement("li");
    item.className = "tree-item";
    const isFolder = node.type === "folder";
    const isOpen = expandedIds.has(node.id) || Boolean(query);
    const row = document.createElement("button");
    row.type = "button";
    row.className = `tree-row${selectedId === node.id ? " selected" : ""}${isOpen ? " open" : ""}`;
    row.setAttribute(
      "aria-label",
      `${isFolder ? "Folder" : "Open screen"}: ${node.title}`,
    );

    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = isFolder ? "›" : "";
    const icon = document.createElement("span");
    icon.className = "node-icon";
    icon.textContent = isFolder ? (isOpen ? "📂" : "📁") : "↗";
    const title = document.createElement("span");
    title.className = "node-title";
    title.textContent = node.title;
    const type = document.createElement("span");
    type.className = "node-type";
    type.textContent = isFolder ? "FOLDER" : "LINK";

    row.append(chevron, icon, title, type);
    row.addEventListener("click", () => {
      selectedId = node.id;
      if (isFolder) {
        if (expandedIds.has(node.id)) expandedIds.delete(node.id);
        else expandedIds.add(node.id);
      } else if (node.href) {
        // Replace href values in data.json with your real screen URLs.
        window.open(node.href, "_blank", "noopener,noreferrer");
      }
      render();
      showDetails(node);
    });
    item.appendChild(row);

    if (isFolder && node.children.length && (isOpen || query)) {
      item.appendChild(renderTree(node.children, query));
    }
    list.appendChild(item);
  });

  return list;
}

function showDetails(node) {
  const isFolder = node.type === "folder";
  const path = node.path.join(" / ");
  const children = node.children || [];
  previewContent.className = "preview-content detail-view";
  previewContent.replaceChildren();

  const breadcrumb = document.createElement("div");
  breadcrumb.className = "detail-breadcrumb";
  breadcrumb.textContent = path;

  const heading = document.createElement("div");
  heading.className = "detail-heading";
  const largeIcon = document.createElement("div");
  largeIcon.className = "large-icon";
  largeIcon.textContent = isFolder ? "📁" : "↗";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = node.title;
  const subtitle = document.createElement("small");
  subtitle.textContent = isFolder
    ? "Folder / Navigation group"
    : "Screen / External destination";
  titleWrap.append(title, subtitle);
  heading.append(largeIcon, titleWrap);

  const description = document.createElement("p");
  description.className = "detail-description";
  description.textContent =
    node.description ||
    (isFolder
      ? "This folder groups related screens or additional folders. You can nest more folders inside it without a fixed depth limit."
      : "This item is configured as a link. Update its href in data.json to point to the required mock screen.");

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  const chip1 = document.createElement("span");
  chip1.className = "meta-chip";
  chip1.textContent = isFolder
    ? `${children.length} direct child item(s)`
    : "Link destination";
  const chip2 = document.createElement("span");
  chip2.className = "meta-chip";
  chip2.textContent = `Path: ${node.path.length} level(s)`;
  meta.append(chip1, chip2);

  previewContent.append(breadcrumb, heading, description, meta);

  if (!isFolder) {
    const destination = document.createElement("p");
    destination.className = "detail-description";
    destination.textContent = `Configured href: ${node.href || "(not configured)"}`;
    previewContent.appendChild(destination);
    if (node.href) {
      const link = document.createElement("a");
      link.className = "open-link";
      link.href = node.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open screen ↗";
      previewContent.appendChild(link);
    }
  } else if (children.length) {
    const childSection = document.createElement("div");
    childSection.className = "child-list";
    const childTitle = document.createElement("h3");
    childTitle.textContent = "Inside this folder";
    childSection.appendChild(childTitle);
    children.forEach((child) => {
      const button = document.createElement("button");
      button.className = "child-chip";
      button.type = "button";
      button.textContent = `${child.type === "folder" ? "📁" : "↗"} ${child.title}`;
      button.addEventListener("click", () => {
        selectedId = child.id;
        if (child.type === "folder") expandedIds.add(child.id);
        render();
        showDetails(child);
      });
      childSection.appendChild(button);
    });
    previewContent.appendChild(childSection);
  }
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  treeRoot.replaceChildren();
  const tree = renderTree(projectData.children, query);
  if (!tree.children.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = query
      ? "No matching folders or screens found."
      : "No items have been added yet.";
    treeRoot.appendChild(empty);
  } else {
    treeRoot.appendChild(tree);
  }
  itemCount.textContent = countItems(projectData.children);
}

async function init() {
  try {
    const dataUrl = new URL("data.json", window.location.href);
    const response = await fetch(dataUrl);
    if (!response.ok)
      throw new Error(`Could not load data.json (${response.status})`);
    const rawData = await response.json();
    projectData = {
      title: rawData.title || "Aptivo Mock Screen Plan",
      children: normalizeNodes(rawData.children || []),
    };
    treeRoot.replaceChildren();
    render();
  } catch (error) {
    treeRoot.innerHTML = `<div class="empty-state">Unable to load <code>data.json</code>.<br/>Run this project with a local web server.</div>`;
    console.error(error);
  }
}

searchInput.addEventListener("input", render);
expandAllButton.addEventListener("click", () => {
  const allFolders = flatten(projectData.children).filter(
    (node) => node.type === "folder",
  );
  const allExpanded = allFolders.every((node) => expandedIds.has(node.id));
  expandedIds = allExpanded
    ? new Set()
    : new Set(allFolders.map((node) => node.id));
  render();
  expandAllButton.textContent = allExpanded ? "Expand all" : "Collapse all";
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
});

init();
