/**
 * WhatsApp Web Sidebar Toggle — Content Script (run_at: document_start)
 *
 * Responsibilities:
 * 1. Synchronous 0ms Zero-FOUC bootstrap via localStorage mirror + chrome.storage.local reconciliation.
 * 2. Multi-strategy LCA DOM resolution (independent of obfuscated StyleX class names).
 * 3. Native-styled toggle buttons in Navigation Rail and #side header.
 * 4. Alt+B keyboard shortcut (capture phase, ABNT2 AltGr safe, Mac Option+B safe, deduplicated with chrome.commands).
 * 5. Smart interaction with Navigation Rail tabs (Status, Communities, Settings, Profile, Chats) when collapsed.
 */

(() => {
  if (window.__WA_SIDEBAR_TOGGLE_LOADED__) {
    return;
  }
  window.__WA_SIDEBAR_TOGGLE_LOADED__ = true;

  const DEFAULT_SETTINGS = {
    sidebarCollapsed: false,
  };

  const CACHE_KEY = "wa_sidebar_ext_cache";

  let sidebarCollapsed = false;
  let rafScheduled = false;
  let lastKeyboardSource = null;
  let lastKeyboardTime = 0;

  function t(key, fallback) {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.id && chrome.i18n?.getMessage) {
        const msg = chrome.i18n.getMessage(key);
        if (msg) {
          return msg;
        }
      }
    } catch (_) {
      // Fallback safely if extension context was invalidated
    }
    return fallback;
  }

  const ICON_COLLAPSE_SVG = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
      <line x1="9" y1="4" x2="9" y2="20"></line>
      <polyline points="15.5 9.5 12.5 12 15.5 14.5"></polyline>
    </svg>
  `;

  const ICON_EXPAND_SVG = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5"></rect>
      <line x1="9" y1="4" x2="9" y2="20"></line>
      <polyline points="13 9.5 16 12 13 14.5"></polyline>
    </svg>
  `;

  // ---------------------------------------------------------------------------
  // 1. Zero-FOUC State Application & Persistence
  // ---------------------------------------------------------------------------

  function writeLocalCache(collapsed) {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ sidebarCollapsed: Boolean(collapsed) })
      );
    } catch (_) {
      // Ignore storage quota or restricted context errors
    }
  }

  function applyRootAttributes() {
    const root = document.documentElement;
    if (!root) {
      return;
    }
    root.setAttribute("data-wa-sidebar-collapsed", sidebarCollapsed ? "true" : "false");
    updateInjectedControlsState();
  }

  function setSidebarCollapsed(nextCollapsed, persist = true) {
    const prev = sidebarCollapsed;
    sidebarCollapsed = Boolean(nextCollapsed);

    writeLocalCache(sidebarCollapsed);
    applyRootAttributes();

    if (prev && !sidebarCollapsed) {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }

    if (persist) {
      try {
        if (typeof chrome !== "undefined" && chrome.runtime?.id && chrome.storage?.local) {
          chrome.storage.local.set({ sidebarCollapsed });
        }
      } catch (_) {
        // Gracefully survive Extension Context Invalidated if reloaded without page refresh
      }
    }

    return sidebarCollapsed;
  }

  // Synchronous 0ms bootstrap from localStorage BEFORE first browser paint
  try {
    const rawCache = window.localStorage.getItem(CACHE_KEY);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (parsed && typeof parsed === "object") {
        sidebarCollapsed = Boolean(parsed.sidebarCollapsed);
      }
    }
  } catch (_) {
    // Ignore corrupted cache
  }
  applyRootAttributes();

  // Reconcile asynchronously with chrome.storage.local (source of truth)
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.id && chrome.storage?.local) {
      chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
        try {
          if (!chrome.runtime?.lastError && stored) {
            setSidebarCollapsed(Boolean(stored.sidebarCollapsed), false);
          }
        } catch (_) {}
      });

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && Object.prototype.hasOwnProperty.call(changes, "sidebarCollapsed")) {
          setSidebarCollapsed(Boolean(changes.sidebarCollapsed.newValue), false);
        }
      });
    }
  } catch (_) {
    // Ignore invalidated context errors
  }

  // ---------------------------------------------------------------------------
  // 2. Resilient Lowest-Common-Ancestor (LCA) WhatsApp Web DOM Resolver
  // ---------------------------------------------------------------------------

  function findLowestCommonAncestor(elA, elB, stopAt) {
    if (!elA || !elB) {
      return null;
    }
    const ancestorsA = new Set();
    let cur = elA;
    while (cur && cur !== stopAt) {
      ancestorsA.add(cur);
      cur = cur.parentElement;
    }
    cur = elB;
    while (cur && cur !== stopAt) {
      if (ancestorsA.has(cur)) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return null;
  }

  function findDirectChildContaining(parent, descendant) {
    if (!parent || !descendant) {
      return null;
    }
    let cur = descendant;
    while (cur.parentElement && cur.parentElement !== parent) {
      cur = cur.parentElement;
    }
    return cur.parentElement === parent ? cur : null;
  }

  function findNavRailHeader(app) {
    const explicitNav = app.querySelector('[data-js-navbar="true"], nav[aria-label]');
    if (explicitNav && !explicitNav.closest("#side") && !explicitNav.closest("#main")) {
      return explicitNav.tagName === "HEADER"
        ? explicitNav
        : explicitNav.querySelector("header") || explicitNav;
    }

    const headers = app.querySelectorAll("header");
    for (const h of headers) {
      if (h.closest("#side") || h.closest("#main")) {
        continue;
      }
      const rect = h.getBoundingClientRect();
      if (rect.width >= 32 && rect.width <= 110 && rect.height >= 180 && rect.left <= 80) {
        return h;
      }
      if (
        h.querySelector(
          '[aria-label="Conversas"], [aria-label="Chats"], [aria-label="Status"], [aria-label="Estados"], [aria-label="Configurações"], [aria-label="Configuración"], [aria-label="Ajustes"], [aria-label="Settings"], [data-icon*="chat"], [data-icon*="settings"]'
        )
      ) {
        return h;
      }
    }
    return null;
  }

  function resolveLayoutRoot(app, side, main, navHeader) {
    const classic = app.querySelector(".two, .three");
    if (classic && (!side || classic.contains(side))) {
      return classic;
    }

    if (side && main) {
      const lca = findLowestCommonAncestor(side, main, app);
      if (lca) {
        return lca;
      }
    }

    if (side) {
      let branch = side;
      let parent = side.parentElement;
      while (parent && parent !== app) {
        const cs = window.getComputedStyle(parent);
        const isHorizontalRow =
          (cs.display === "flex" && cs.flexDirection.startsWith("row")) ||
          cs.display === "grid";
        if (isHorizontalRow && parent.children.length >= 2) {
          const hasRightPaneSibling = Array.from(parent.children).some((sib) => {
            if (sib === branch || (navHeader && sib.contains(navHeader))) {
              return false;
            }
            const sibCs = window.getComputedStyle(sib);
            return sibCs.display !== "none" && (parseFloat(sibCs.flexGrow) > 0 || sib.clientWidth > 180);
          });
          if (hasRightPaneSibling) {
            return parent;
          }
        }
        branch = parent;
        parent = parent.parentElement;
      }
    }

    if (navHeader) {
      let cur = navHeader.parentElement;
      while (cur && cur !== app) {
        const cs = window.getComputedStyle(cur);
        if (cs.display === "flex" && cs.flexDirection.startsWith("row") && cur.children.length >= 2) {
          return cur;
        }
        cur = cur.parentElement;
      }
    }

    return null;
  }

  function tagLayoutElements() {
    const app = document.getElementById("app");
    if (!app) {
      return null;
    }

    const side = document.getElementById("side");
    const main = document.getElementById("main");
    const navHeader = findNavRailHeader(app);
    const layoutRoot = resolveLayoutRoot(app, side, main, navHeader);

    if (!layoutRoot) {
      return null;
    }

    layoutRoot.setAttribute("data-wa-layout-root", "true");

    let navRailCol = findDirectChildContaining(layoutRoot, navHeader);
    if (!navRailCol && navHeader) {
      const outerLca = findLowestCommonAncestor(navHeader, layoutRoot, app);
      navRailCol = findDirectChildContaining(outerLca, navHeader);
    }
    if (navRailCol) {
      navRailCol.setAttribute("data-wa-nav-rail", "true");
    }

    const sideCol = findDirectChildContaining(layoutRoot, side);
    let mainCol = findDirectChildContaining(layoutRoot, main);

    const children = Array.from(layoutRoot.children);

    if (!mainCol) {
      const sideIdx = sideCol ? children.indexOf(sideCol) : -1;
      const navIdxTemp = navRailCol && navRailCol.parentElement === layoutRoot ? children.indexOf(navRailCol) : -1;
      const minAfterIdx = Math.max(sideIdx, navIdxTemp);

      for (let i = minAfterIdx + 1; i < children.length; i++) {
        const child = children[i];
        if (child === navRailCol || child === sideCol) {
          continue;
        }
        const cs = window.getComputedStyle(child);
        if (cs.display !== "none" && parseFloat(cs.flexGrow) > 0) {
          mainCol = child;
          break;
        }
      }

      if (!mainCol) {
        for (let i = minAfterIdx + 1; i < children.length; i++) {
          const child = children[i];
          if (child === navRailCol || child === sideCol) {
            continue;
          }
          const cs = window.getComputedStyle(child);
          if (cs.display === "none" || cs.position === "fixed") {
            continue;
          }
          if (child.querySelector('[tabindex="-1"]') || child.clientHeight > 120) {
            mainCol = child;
            break;
          }
        }
      }
    }

    const navIdx = navRailCol && navRailCol.parentElement === layoutRoot ? children.indexOf(navRailCol) : -1;
    const mainIdx = mainCol ? children.indexOf(mainCol) : children.length;

    children.forEach((child, idx) => {
      child.removeAttribute("data-wa-side-col");
      child.removeAttribute("data-wa-drawer-col");
      child.removeAttribute("data-wa-main-col");

      if (child === navRailCol) {
        return;
      }
      if (child === mainCol) {
        child.setAttribute("data-wa-main-col", "true");
        return;
      }
      if (child === sideCol) {
        child.setAttribute("data-wa-side-col", "true");
        return;
      }
      if (idx > navIdx && idx < mainIdx) {
        const cs = window.getComputedStyle(child);
        const isFlexibleMain = cs.display !== "none" && parseFloat(cs.flexGrow) > 0;
        const isTopButterbar =
          cs.position === "fixed" ||
          (child.clientHeight > 0 && child.clientHeight < 72);
        if (!isTopButterbar && !isFlexibleMain) {
          child.setAttribute("data-wa-drawer-col", "true");
        }
      }
    });

    return { layoutRoot, navRailCol, navHeader, side, sideCol, mainCol };
  }

  // ---------------------------------------------------------------------------
  // 3. UI Controls Injection & State Sync
  // ---------------------------------------------------------------------------

  function toggleSidebar(source = "button") {
    if (source === "command" || source === "keydown") {
      const now = Date.now();
      if (
        lastKeyboardSource &&
        lastKeyboardSource !== source &&
        now - lastKeyboardTime < 120
      ) {
        return sidebarCollapsed;
      }
      lastKeyboardSource = source;
      lastKeyboardTime = now;
    }
    return setSidebarCollapsed(!sidebarCollapsed, true);
  }

  function updateInjectedControlsState() {
    const railBtn = document.getElementById("wa-ext-rail-toggle");
    if (railBtn) {
      const isExpanded = !sidebarCollapsed;
      const label = isExpanded
        ? t("tooltipCollapseRail", "Collapse chat sidebar (Alt+B)")
        : t("tooltipShowRail", "Show chat sidebar (Alt+B)");
      railBtn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      railBtn.setAttribute("aria-label", label);
      railBtn.setAttribute("title", label);
      const nextIcon = isExpanded ? ICON_COLLAPSE_SVG : ICON_EXPAND_SVG;
      if (railBtn.dataset.iconState !== (isExpanded ? "open" : "closed")) {
        railBtn.innerHTML = nextIcon;
        railBtn.dataset.iconState = isExpanded ? "open" : "closed";
      }
    }
  }

  function ensureInjectedControls(resolved) {
    if (!document.body) {
      return;
    }

    // 1. Primary Toggle Button inside Left Navigation Rail
    if (resolved?.navHeader && !document.getElementById("wa-ext-rail-toggle")) {
      const wrap = document.createElement("div");
      wrap.className = "wa-ext-rail-btn-wrap";

      const btn = document.createElement("button");
      btn.id = "wa-ext-rail-toggle";
      btn.type = "button";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar("button");
      });

      wrap.appendChild(btn);
      const firstGroup = resolved.navHeader.firstElementChild;
      if (firstGroup && firstGroup.tagName === "DIV") {
        firstGroup.insertBefore(wrap, firstGroup.firstChild);
      } else {
        resolved.navHeader.insertBefore(wrap, resolved.navHeader.firstChild);
      }
    }

    // 2. Secondary Collapse Button inside #side Header
    if (resolved?.side && !document.getElementById("wa-ext-side-collapse")) {
      const sideHeader =
        resolved.side.querySelector("header") ||
        resolved.side.firstElementChild;
      if (sideHeader) {
        const sideBtn = document.createElement("button");
        sideBtn.id = "wa-ext-side-collapse";
        sideBtn.type = "button";
        const collapseTip = t("tooltipCollapseSide", "Collapse sidebar (Alt+B)");
        sideBtn.setAttribute("aria-label", collapseTip);
        sideBtn.setAttribute("title", collapseTip);
        sideBtn.innerHTML = ICON_COLLAPSE_SVG;
        sideBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSidebarCollapsed(true, true);
        });

        const actionGroup = sideHeader.querySelector('[data-wa-side-actions="true"]') || sideHeader;
        actionGroup.appendChild(sideBtn);
      }
    }

    updateInjectedControlsState();
  }

  function syncDom() {
    const resolved = tagLayoutElements();
    ensureInjectedControls(resolved);
  }

  function scheduleSyncDom() {
    if (rafScheduled) {
      return;
    }
    rafScheduled = true;
    window.requestAnimationFrame(() => {
      rafScheduled = false;
      syncDom();
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Event Listeners (Keyboard Alt+B & Nav Rail Smart Expand)
  // ---------------------------------------------------------------------------

  window.addEventListener(
    "keydown",
    (e) => {
      const isKeyB =
        e.code === "KeyB" ||
        (typeof e.key === "string" && e.key.toLowerCase() === "b");
      if (
        isKeyB &&
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.repeat
      ) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar("keydown");
      }
    },
    true
  );

  document.addEventListener(
    "click",
    (e) => {
      if (e.button !== 0 || !sidebarCollapsed) {
        return;
      }
      const target = e.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("#wa-ext-rail-toggle, #wa-ext-side-collapse")) {
        return;
      }

      // Clicking native buttons in the thin Nav Rail while collapsed auto-expands the sidebar
      const inNavRail = target.closest('[data-wa-nav-rail="true"]');
      if (inNavRail) {
        const railInteractive = target.closest(
          'button, [role="button"], [data-navbar-item="true"], [aria-label]'
        );
        if (railInteractive) {
          setSidebarCollapsed(false, true);
        }
      }
    },
    true
  );

  window.addEventListener("resize", scheduleSyncDom, { passive: true });

  // ---------------------------------------------------------------------------
  // 5. Runtime Messaging (Popup <-> Content Script <-> Service Worker)
  // ---------------------------------------------------------------------------

  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message.type !== "string") {
        return false;
      }

      if (message.type === "GET_STATE") {
        syncDom();
        sendResponse({
          ok: true,
          state: { sidebarCollapsed },
          hasWhatsAppDom: Boolean(
            document.getElementById("side") ||
              document.querySelector('[data-wa-layout-root="true"]')
          ),
        });
        return false;
      }

      if (message.type === "TOGGLE_SIDEBAR") {
        toggleSidebar(message.source || "popup");
        sendResponse({ ok: true, state: { sidebarCollapsed } });
        return false;
      }

      if (message.type === "SET_COLLAPSED") {
        setSidebarCollapsed(Boolean(message.sidebarCollapsed), true);
        sendResponse({ ok: true, state: { sidebarCollapsed } });
        return false;
      }

      return false;
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Lightweight SPA MutationObserver (ignores message bubble churn in #main)
  // ---------------------------------------------------------------------------

  function startObserver() {
    const root = document.documentElement;
    if (!root) {
      return;
    }
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const target = m.target;
        if (
          target instanceof Element &&
          target.closest("#main") &&
          target.id !== "main"
        ) {
          continue;
        }
        scheduleSyncDom();
        break;
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    scheduleSyncDom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncDom, { once: true });
  }
  startObserver();
})();
