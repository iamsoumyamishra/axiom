# Browser Extension Architecture

## Overview

The Axiom browser extension provides the primary interface for saving resources. It is responsible for lightweight data collection only — all heavy processing happens on the backend.

### Manifest V3

The extension uses Manifest V3 with a service worker for background processing.

---

## Architecture

```
extension/src/
├── background/
│   ├── index.ts              # Service worker entry point
│   ├── context-menu.ts       # Right-click context menu setup
│   ├── messaging.ts          # Runtime message handling (content ↔ background)
│   └── api-client.ts         # Backend API communication
├── content/
│   ├── index.ts              # Content script entry
│   ├── extractor.ts          # Page data extraction (meta, readability)
│   └── screenshot.ts         # Screenshot capture via canvas
├── popup/
│   ├── App.tsx               # Popup UI (React)
│   ├── components/
│   │   ├── SaveButton.tsx
│   │   ├── StatusIndicator.tsx
│   │   └── QuickActions.tsx
│   └── index.html
├── options/
│   ├── App.tsx               # Options page
│   ├── components/
│   │   ├── ApiKeyForm.tsx
│   │   ├── Preferences.tsx
│   │   └── AccountInfo.tsx
│   └── index.html
├── shared/
│   ├── types.ts              # Shared extension types
│   ├── constants.ts          # Storage keys, defaults
│   └── storage.ts            # chrome.storage wrapper
└── manifest.json
```

---

## Data Collection

When the user triggers "Analyze & Save", the extension collects:

| Field | Source | Notes |
|-------|--------|-------|
| URL | `window.location.href` | Current page URL |
| Title | `document.title` | Page title |
| Selected Text | `window.getSelection()` | Only if user selected text |
| Raw HTML | `document.documentElement.outerHTML` | Stripped of scripts/styles |
| Readability | Mozilla Readability | Lightweight extraction |
| Meta Tags | `document.querySelectorAll('meta')` | OG, Twitter, standard meta |
| Favicon | `link[rel=icon]` | Fallback to `/favicon.ico` |
| Screenshot | `html2canvas` or `tabCapture` | Visual snapshot |
| Author | meta[author], OG meta | If available |
| Publish Date | meta[date], article:published_time | If available |

**Key principle:** Extension does lightweight extraction. Full Readability + Turndown conversion happens on the server.

---

## Context Menu Actions

### "Analyze & Save"
Full pipeline: collect data → send to API → show confirmation.

### "Quick Save"
Minimal pipeline: URL + title only. No AI analysis.

### "Save to Project"
Saves with a specific project context.

### "Save without AI"
Saves URL only, skips AI pipeline entirely.

---

## API Communication

```
Extension                  Backend
   │                         │
   │── POST /auth/login ────►│  (first time only)
   │◄── tokens ─────────────│
   │                         │
   │── POST /ingestion/save ─►│
   │   { url, title, html,   │
   │     screenshot, meta }   │
   │◄── 202 { jobId } ──────│
   │                         │
   │── WebSocket connect ────►│  (or polling via GET)
   │◄── job:completed ──────│
```

### Token Storage
- Access token: `chrome.storage.local`
- Refresh on 401 responses
- Automatically retry with refreshed token

---

## Permissions

Required permissions in `manifest.json`:

```json
{
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab",
    "scripting",
    "notifications"
  ],
  "host_permissions": [
    "http://localhost:4000/*",
    "https://api.axiom.app/*"
  ]
}
```

- `contextMenus` — Right-click menu
- `storage` — Token + preference storage
- `activeTab` — Access current tab URL/content
- `scripting` — Content script injection
- `notifications` — Save confirmation notifications

---

## Security Considerations

1. **Never collect** from private/incognito tabs without permission
2. **Tokens stored** in `chrome.storage.local` (sandboxed)
3. **No third-party cookies** — API uses Bearer tokens
4. **Content script isolation** — Cannot access other extensions
5. **HTTPS only** in production
