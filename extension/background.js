/**
 * Background Service Worker (Manifest V3)
 * Coordinates global keyboard command (Alt+B), action badge state, and multi-tab sync.
 */

const DEFAULT_SETTINGS = {
  sidebarCollapsed: false,
};

async function getSettings() {
  return chrome.storage.local.get(DEFAULT_SETTINGS);
}

async function updateBadge(collapsed) {
  try {
    await chrome.action.setBadgeText({ text: collapsed ? "ON" : "" });
    if (collapsed) {
      await chrome.action.setBadgeBackgroundColor({ color: "#00A884" });
    }
  } catch (_) {
    // Ignore badge errors in minimal environments
  }
}

async function findWhatsAppTabs() {
  const activeTabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
    url: "https://web.whatsapp.com/*",
  });
  if (activeTabs.length > 0) {
    return activeTabs;
  }
  return chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await getSettings();
  await chrome.storage.local.set({
    sidebarCollapsed: Boolean(current.sidebarCollapsed),
  });
  await updateBadge(Boolean(current.sidebarCollapsed));
});

chrome.runtime.onStartup.addListener(async () => {
  const current = await getSettings();
  await updateBadge(Boolean(current.sidebarCollapsed));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.sidebarCollapsed) {
    updateBadge(Boolean(changes.sidebarCollapsed.newValue));
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-sidebar") {
    return;
  }

  const tabs = await findWhatsAppTabs();
  if (tabs.length > 0 && tabs[0].id != null) {
    try {
      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: "TOGGLE_SIDEBAR",
        source: "command",
      });
      if (response && response.ok) {
        return;
      }
    } catch (_) {
      // Content script might still be initializing; fall back to storage flip
    }
  }

  const current = await getSettings();
  const nextCollapsed = !Boolean(current.sidebarCollapsed);
  await chrome.storage.local.set({ sidebarCollapsed: nextCollapsed });
});
