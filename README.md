<div align="center">
  <img src="assets/icon.svg" width="84" height="84" alt="WhatsApp Web Sidebar Toggle" />

  <h1>WhatsApp Web Sidebar Toggle</h1>

  <p>
    <strong>A lightweight, instant browser extension to collapse and expand the chat list sidebar on WhatsApp Web.</strong><br />
    Stay focused on your active conversation and keep your chat list private while screen sharing — with the slim left navigation rail always within reach.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Manifest-V3-00A884?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Opera-202C33?style=flat-square" alt="Chromium Browsers" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
    <img src="https://img.shields.io/badge/Privacy-100%25%20Local-success?style=flat-square" alt="100% Local" />
  </p>
</div>

---

## Overview

By default, **WhatsApp Web** keeps the conversation list sidebar permanently open, taking up 30%–40% of your viewport width. This shrinks your active chat space and exposes contact names and message previews during video calls, recordings, or screen shares.

**WhatsApp Web Sidebar Toggle** solves this cleanly and without bloat:
- Collapses **only the chat list panel** **instantly (zero laggy animations)**;
- Keeps the **slim left icon rail visible** (Chats, Status, Communities, Settings, Profile);
- Automatically expands the conversation area to **100% of the remaining screen width**.

---

## Features

- **Native-Looking UI Button**: Injects a seamless toggle button at the top of WhatsApp Web's left navigation rail (plus a quick collapse button in the chat list header), automatically adapting to **Dark** and **Light** themes.
- **Keyboard Shortcut (`Alt + B`)**: Toggle the sidebar from anywhere on WhatsApp Web — even while typing inside the message composer (safe for international `AltGr` layouts).
- **Zero-Flash State Persistence**: Remembers whether the sidebar was open or collapsed across reloads (`F5`) and browser restarts, applying the layout at `document_start` before the first paint.
- **Minimalist Popup**: Quick toggle and live status indicator right from the browser toolbar, synced in real time across tabs.
- **Smart Navigation Rail Handling**: Clicking *Status*, *Communities*, *Settings*, or *Profile* on the left icon rail while collapsed automatically reopens the sidebar panel.
- **Zero Dependencies & 100% Private**: Pure Vanilla JS + CSS, no build step required, no trackers, no external network calls, and only the minimal `storage` permission scoped to `https://web.whatsapp.com/*`.

---

## Installation

Compatible with **Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, **Vivaldi**, and other Chromium-based browsers.

1. Clone this repository (or download and extract [`dist/whatsapp-web-sidebar-toggle.zip`](dist/whatsapp-web-sidebar-toggle.zip)):
   ```bash
   git clone https://github.com/thiagocontelli/whatsapp-web-sidebar-extension.git
   ```
2. Open your browser and navigate to **`chrome://extensions`** (or `edge://extensions` / `brave://extensions`).
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the **`extension`** folder inside the project directory.
5. Open or reload **[WhatsApp Web](https://web.whatsapp.com)**.

---

## Usage

| Trigger | Action |
|---|---|
| **In-App Button** | Click the sidebar panel icon at the top of the left navigation rail |
| **Keyboard Shortcut** | Press **`Alt + B`** anytime (customizable via `chrome://extensions/shortcuts`) |
| **Toolbar Popup** | Click the extension icon in your browser toolbar to toggle the sidebar |

---

## Project Structure

```text
├── assets/
│   └── icon.svg                          # Vector project icon
├── dist/
│   └── whatsapp-web-sidebar-toggle.zip   # Ready-to-distribute extension archive
├── extension/                            # Unpacked Manifest V3 extension directory
│   ├── icons/                            # PNG icons (16, 32, 48, 128px)
│   ├── manifest.json                     # Manifest V3 configuration
│   ├── background.js                     # Service Worker (global Alt+B command & badge)
│   ├── content.css                       # Instant layout rules & dark/light theme styles
│   ├── content.js                        # Resilient DOM resolver & injected controls
│   ├── popup.html                        # Extension popup markup
│   ├── popup.css                         # Extension popup styles
│   └── popup.js                          # Real-time popup state sync
├── scripts/
│   ├── generate_icons.py                 # Icon generation utility
│   └── package_extension.py              # Builds dist/whatsapp-web-sidebar-toggle.zip
└── LICENSE                               # MIT License
```

### Building the `.zip` Package

If you make changes inside `extension/`, rebuild the distribution archive using Python 3:

```bash
python scripts/package_extension.py
```

---

## Privacy & Security

This extension runs **100% locally** inside your browser:
- **Does not** read, store, or transmit messages, contacts, or media;
- **Does not** perform any external network requests (`fetch`, `XMLHttpRequest`, or analytics);
- Stores only a single boolean preference (`sidebarCollapsed`) in `chrome.storage.local`.

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/my-improvement`)
3. Commit your changes (`git commit -m 'feat: add my improvement'`)
4. Push to the branch (`git push origin feat/my-improvement`)
5. Open a **Pull Request**

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
