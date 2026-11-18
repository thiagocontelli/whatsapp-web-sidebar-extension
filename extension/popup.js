/**
 * Popup Controller — WhatsApp Web Sidebar Toggle
 * Synchronizes bidirectionally with chrome.storage.local and active WhatsApp Web tab(s).
 */

(() => {
  const DEFAULT_SETTINGS = {
    sidebarCollapsed: false,
  };

  const toggleBtn = document.getElementById("toggle-sidebar-btn");
  const toggleBtnLabel = document.getElementById("toggle-btn-label");
  const toggleBtnIcon = document.getElementById("toggle-btn-icon");
  const statusBadge = document.getElementById("status-badge");
  const connStatus = document.getElementById("connection-status");

  const SVG_COLLAPSE = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
      <line x1="9" y1="4" x2="9" y2="20"></line>
      <polyline points="15.5 9.5 12.5 12 15.5 14.5"></polyline>
    </svg>
  `;

  const SVG_EXPAND = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
      <line x1="9" y1="4" x2="9" y2="20"></line>
      <polyline points="13 9.5 16 12 13 14.5"></polyline>
    </svg>
  `;

  let sidebarCollapsed = false;

  async function findWhatsAppTabs() {
    const activeWa = await chrome.tabs.query({
      active: true,
      currentWindow: true,
      url: "https://web.whatsapp.com/*",
    });
    if (activeWa.length > 0) {
      return activeWa;
    }
    return chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
  }

  function renderUI(collapsed, tabCount = null) {
    sidebarCollapsed = Boolean(collapsed);

    statusBadge.textContent = sidebarCollapsed ? "Fechada" : "Aberta";
    statusBadge.setAttribute("data-collapsed", sidebarCollapsed ? "true" : "false");

    toggleBtnLabel.textContent = sidebarCollapsed ? "Mostrar conversas" : "Recolher conversas";
    toggleBtnIcon.innerHTML = sidebarCollapsed ? SVG_EXPAND : SVG_COLLAPSE;

    if (tabCount !== null) {
      connStatus.textContent =
        tabCount > 0
          ? "Conectado ao WhatsApp Web ativo"
          : "Preferência salva (abra web.whatsapp.com)";
    }
  }

  toggleBtn.addEventListener("click", async () => {
    const next = !sidebarCollapsed;
    renderUI(next);
    await chrome.storage.local.set({ sidebarCollapsed: next });

    const tabs = await findWhatsAppTabs();
    await Promise.all(
      tabs.map(async (tab) => {
        if (tab.id != null) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: "SET_COLLAPSED",
              sidebarCollapsed: next,
            });
          } catch (_) {
            // Content script will also pick up storage.onChanged
          }
        }
      })
    );
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && Object.prototype.hasOwnProperty.call(changes, "sidebarCollapsed")) {
      renderUI(Boolean(changes.sidebarCollapsed.newValue));
    }
  });

  async function init() {
    const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
    const tabs = await findWhatsAppTabs();
    renderUI(Boolean(stored.sidebarCollapsed), tabs.length);

    if (tabs.length > 0 && tabs[0].id != null) {
      try {
        const res = await chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STATE" });
        if (res?.ok && res.state) {
          renderUI(Boolean(res.state.sidebarCollapsed), tabs.length);
        }
      } catch (_) {
        // Tab still loading
      }
    }
  }

  init();
})();
