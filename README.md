<div align="center">

# Org Viewer - Chrome Extension

**A modern, clean, and secure in-browser Org-mode (`.org`) document previewer for Google Chrome.**

[English](README.md) | [简体中文](README_zh.md)

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Zero-Telemetry-brightgreen.svg?style=flat-square" alt="Zero Telemetry" />
  <img src="https://img.shields.io/badge/Offline-100%25-success.svg?style=flat-square" alt="100% Offline" />
  <img src="https://img.shields.io/badge/TypeScript-7.0-blue.svg?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Chrome-120%2B-orange.svg?style=flat-square" alt="Chrome 120+" />
</p>

</div>

---

## 📖 Table of Contents

- [💡 Why Org Viewer?](#-why-org-viewer)
- [🚀 Beginner Quick-Start Guide (Step-by-Step)](#-beginner-quick-start-guide-step-by-step)
  - [Step 1: Install the Extension in Chrome](#step-1-install-the-extension-in-chrome)
  - [Step 2: Enable "Allow access to file URLs" (Crucial!)](#step-2-enable-allow-access-to-file-urls-crucial)
  - [Step 3: Three Ways to Preview Your Notes](#step-3-three-ways-to-preview-your-notes)
  - [Toolbar Overview](#toolbar-overview)
- [✨ Features & Comprehensive Syntax Support](#-features--comprehensive-syntax-support)
  - [1. GitHub-Inspired Typography & Responsive Reading Container](#1-github-inspired-typography--responsive-reading-container)
  - [2. Headings & Tree-Based Interactive Folding](#2-headings--tree-based-interactive-folding)
  - [3. Dynamic Outline Table of Contents (TOC)](#3-dynamic-outline-table-of-contents-toc)
  - [4. Full Org-mode Core Syntax Coverage](#4-full-org-mode-core-syntax-coverage)
  - [5. Syntax Highlighting & LaTeX Math Rendering](#5-syntax-highlighting--latex-math-rendering)
  - [6. Light/Dark Themes & Print/PDF Export](#6-lightdark-themes--printpdf-export)
- [🛡️ Architecture & Security Model](#️-architecture--security-model)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🛠️ Developer Guide (Build & Test)](#️-developer-guide-build--test)
- [❓ Frequently Asked Questions (FAQ)](#-frequently-asked-questions-faq)
- [📄 License](#-license)

---

## 💡 Why Org Viewer?

**Org-mode** is the celebrated, rigorous plain-text system for note-taking, project planning, and authoring originated in GNU Emacs. Today, with tools like **Logseq**, **Doom Emacs**, and modern plain-text knowledge graphs, millions of notes are stored in `.org` files.

However, viewing `.org` notes outside Emacs has always been painful:
1. **Cumbersome Export Steps**: Previously, you had to launch Emacs and run `C-c C-e h h` to export to HTML, or configure complex external command-line tools like Pandoc.
2. **Lack of Instant In-Browser Preview**: When you double-click or drag a `.org` file into Chrome, the browser defaults to treating it as unstyled raw text.
3. **Privacy Concerns with Cloud Converters**: Online file conversion websites require uploading your notes to third-party servers, posing privacy risks for personal and corporate notes.

**Org Viewer** completely eliminates these friction points. It is a completely offline, zero-telemetry Chrome extension that intercepts `.org` files and renders them in-place into responsive, beautifully styled web documents with zero configuration required.

---

## 🚀 Beginner Quick-Start Guide (Step-by-Step)

### Step 1: Install the Extension in Chrome

1. Open Google Chrome and type `chrome://extensions/` in the address bar, then press Enter.
2. In the top-right corner, toggle **Developer mode** to ON.
3. In the top-left corner, click **Load unpacked**.
4. In the folder picker dialog, select the project root directory (the folder containing `manifest.json`).
5. **Org Viewer** will now appear in your extensions list!

---

### Step 2: Enable "Allow access to file URLs" (Crucial!)

> ⚠️ **Important for Beginners**: For security reasons, Chromium browsers disable local `file:///` access by default for all extensions. You must manually grant this permission once to view local `.org` files directly in your browser.

1. On the `chrome://extensions/` page, find the **Org Viewer** card and click **Details**.
2. Scroll down until you see the **"Allow access to file URLs"** toggle.
3. Switch the toggle to **ON** (turns blue).
4. You are all set! The extension status will now show green: `Enabled (local file:///*.org files will be rendered)`.

---

### Step 3: Three Ways to Preview Your Notes

#### Option A: Double-Click Local `.org` Files
- Associate your local `.org` files with Google Chrome as the default application.
- Double-click any `.org` note, and Chrome will automatically open and render it in-place!

#### Option B: Drag and Drop into Any Tab
- Open any blank tab in Chrome and drag your `.org` file directly into the browser window. The file will instantly render into a formatted article.

#### Option C: Use the Standalone Extension Viewer
- Click the **Org Viewer** icon in your Chrome toolbar.
- A clean standalone workspace will open, where you can:
  - **Drag and drop** a file into the dotted drop zone;
  - Click **"Choose File"** to browse your computer;
  - Click **"Load Sample"** to instantly test all formatting features;
  - **Paste raw Org text** directly into the textarea and click "Render Org Text".

---

### Toolbar Overview

A sticky top toolbar is provided on every rendered page with one-click actions:

| Action Button | Description |
| :--- | :--- |
| **Open File** | Returns to the drop/paste workspace in standalone viewer mode. |
| **Raw Source** | Instantly toggles between the rendered document and raw Org-mode plain text. |
| **Outline** | Shows or hides the floating left-hand Table of Contents sidebar. |
| **Collapse All** | Collapses all document sections at once; click again to expand all. |
| **Theme** | Cycles between System Theme → Light Theme → Dark Theme. |
| **Print Document** | A4/Letter-optimized print layout. Automatically strips toolbars and expands all sections for clean PDF export. |

---

## ✨ Features & Comprehensive Syntax Support

### 1. GitHub-Inspired Typography & Responsive Reading Container
- **Carefully Selected Font Stack**: System-native, high-legibility sans-serif fonts for prose (SF Pro, Segoe UI, Noto Sans) paired with crisp monospaced fonts for code.
- **Reading-Optimized Dimensions**: Body text is constrained to an optimal reading width of `860px` with responsive padding, keeping the Table of Contents sidebar from ever overlapping article text on any screen size.

### 2. Headings & Tree-Based Interactive Folding
- Full support for `* Heading 1` down to `****** Heading 6`.
- Each heading features an interactive chevron icon. Clicking the heading or icon smoothly folds and unfolds that section and all nested sub-sections.
- **Session State Persistence**: Your fold states and scroll position are automatically stored per URL via `sessionStorage`. Refreshing the page smoothly restores your exact view.

### 3. Dynamic Outline Table of Contents (TOC)
- Automatically parses all document headings and generates a hierarchical outline in the sidebar.
- **Scroll-Spy Tracking**: As you scroll through the article, the corresponding section in the sidebar highlights dynamically.
- **Smooth Navigation**: Clicking any outline entry smoothly scrolls to that section. If the target section is folded, it automatically unfolds so content is immediately visible.

### 4. Full Org-mode Core Syntax Coverage

#### ✅ Task State Workflow & Custom `#+TODO:`
- Built-in support for `TODO`, `NEXT`, `STARTED`, `WAITING`, `DONE`, and `CANCELLED` keywords with distinct, high-contrast badge colors.
- **Custom Sequences**: Automatically scans `#+TODO:` and `#+SEQ_TODO:` headers (e.g., `#+TODO: TODO FEEDBACK | RESOLVED CLOSED`). States before `|` are rendered as active badges; states after `|` are rendered as completed badges.

#### ✅ Priorities and Tags
- Priority flags: `[#A]`, `[#B]`, `[#C]` rendered as high-contrast purple badges.
- Tags: Trailing headline tags like `:work:project:urgent:` are parsed and displayed as neat rounded pill badges.

#### ✅ Properties Drawers
- `:PROPERTIES: ... :END:` and `:LOGBOOK: ... :END:` blocks are rendered as modern expandable detail panels, keeping your notes clean while keeping metadata accessible.

#### ✅ Timestamps and Planning Lines
- `SCHEDULED: <2026-10-24 Sat>` and `DEADLINE: <2026-10-28 Wed>` rendered as distinct planning badges.
- Active `<2026-10-24>` and inactive `[2026-10-24]` timestamps are styled with subtle monospaced backgrounds.

#### ✅ Structured Tables
- Parses standard Org tables (`| Cell | ... |` and `|---+---|` divider lines).
- Generates semantic HTML `<table>` elements with styled `<thead>` headers and zebra-striped rows.

#### ✅ Interactive Checklists & Nested Lists
- Checked `[X]`, unchecked `[ ]`, and partial `[-]` items render as styled checkboxes.
- Full support for ordered lists, unordered lists, and description lists (`term :: definition`).

#### ✅ Bidirectional Footnotes
- Inline references like `[fn:1]` link directly to the footnote definition.
- Footnotes at the bottom include return backlink arrows (`↩︎`) to jump straight back to the reading position.

### 5. Syntax Highlighting & LaTeX Math Rendering
- **Source Code Blocks**: Native support for `#+BEGIN_SRC` with a built-in tokenizing engine covering:
  - `javascript` / `typescript`
  - `python`
  - `elisp` (Emacs Lisp)
  - `bash` / `sh` / `shell`
  - `rust`
  - `go`
  - `sql` / `json`
- **Mathematical Typography**: Inline math `$E=mc^2$`, `\(...\)`, and block formulas `\[...\]` styled with Cambria Math and modern serif typography.

### 6. Light/Dark Themes & Print/PDF Export
- **Dark Theme**: Eye-friendly dark palette (`#0d1117`) with customized code block, badge, and table borders.
- **Light Theme**: Clean GitHub-style white paper styling.
- **Print / PDF Export**: Press `Ctrl + P` or click "Print Document" to generate clean, professional documents with all navigation elements automatically hidden.

---

## 🛡️ Architecture & Security Model

### Two-Stage Lightweight Injection (Near-Zero Overhead)
1. **Ultralight Detector (`content/detector.js`, <5KB)**:
   The detector script runs on idle and only checks file extensions and MIME headers. It consumes negligible memory and zero CPU on non-Org pages.
2. **On-Demand Dynamic Injection (`content/renderer.js`)**:
   Only after confirming the target is an Org document does the background service worker dynamically inject the complete, self-contained rendering bundle via `chrome.scripting`.

### Strict Security Model (Zero XSS Risk)
- All generated HTML is sanitized through a strict whitelist filter in [sanitize.ts](src/parser/sanitize.ts).
- Dangerous elements such as `<script>`, `<iframe>`, `<object>`, `<embed>`, and `<form>` are completely stripped.
- All inline `on*` event handlers (`onload`, `onerror`, `onclick`) are eliminated.
- Protocol verification: Links only allow `http:`, `https:`, `mailto:`, `file:`, relative paths, and hash anchors. All `javascript:` and unsafe protocols are blocked.

### 100% Offline & Private
- Org Viewer contains **zero network egress code**.
- All styles, vector icons, fonts, and syntax definitions are bundled locally inside the extension. It works seamlessly in airplane mode or air-gapped environments.

---

## 📂 Project Directory Structure

```
chrome_extension/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── package.json               # Package metadata and build scripts
├── tsconfig.json              # TypeScript configuration
├── build.js                   # Automated build, bundling & ZIP packaging script
├── run-tests.js               # Test suite runner
├── icons/                     # 16px, 48px, 128px high-resolution icons
├── _locales/                  # Internationalization resources
│   ├── en/messages.json       # English locale definitions
│   └── zh_CN/messages.json    # Simplified Chinese locale definitions
├── src/
│   ├── background/
│   │   └── index.ts           # Background Service Worker (dynamic injection & permissions)
│   ├── content/
│   │   ├── detector.ts        # <5KB ultralight page detector
│   │   └── renderer.ts        # In-place DOM takeover, TOC & interactive controls
│   ├── parser/
│   │   ├── compiler.ts        # Core Org-mode parser and AST compiler
│   │   ├── todo.ts            # #+TODO workflow scanner
│   │   ├── highlighter.ts     # Lightweight multi-language syntax highlighter
│   │   └── sanitize.ts        # Security whitelist sanitizer
│   ├── ui/
│   │   ├── viewer/            # Standalone drag & drop / paste workspace page
│   │   ├── welcome/           # Onboarding & permission check page
│   │   ├── options/           # Extension options & preferences page
│   │   └── styles/            # Core CSS files (github-theme, toc, print)
│   ├── utils/
│   │   ├── storage.ts         # Chrome storage and session persistence helpers
│   │   └── i18n.ts            # Dynamic localization and geo/timezone detection
│   └── types/                 # TypeScript type declarations
├── tests/
│   ├── fixtures/              # 31 comprehensive Org-mode syntax test files
│   ├── parser.spec.js         # Compiler unit and snapshot test suite
│   └── security.spec.js       # XSS protection and security test suite
├── store_assets/              # Chrome Web Store copy & privacy policy
└── dist/
    └── org-viewer-v1.0.0.zip  # Ready-to-publish Chrome Web Store package
```

---

## 🛠️ Developer Guide (Build & Test)

### Run the Automated Test Suite
The test suite includes 32 tests covering syntax parsing, XSS sanitization, and language detection:
```bash
npm test
```

### Build the Self-Contained Distribution Package
The build script compiles TypeScript, bundles the self-contained execution package, and creates `dist/org-viewer-v1.0.0.zip`:
```bash
npm run build
```
The output package is only **~70 KB**, making it exceptionally fast to load.

---

## ❓ Frequently Asked Questions (FAQ)

### Q1: Why didn't my local `.org` file render when opened in Chrome?
**Answer**: In 99% of cases, the local file permission is not yet enabled.
Navigate to `chrome://extensions/`, find **Org Viewer**, click **Details**, and toggle ON **"Allow access to file URLs"**. Refresh your file to see the formatted view.

### Q2: Can it preview raw `.org` files on GitHub or GitLab?
**Answer**: Yes!
1. When visiting a `raw` plain-text URL (ending in `.org`), the extension takes over automatically.
2. In the options page (right-click extension icon → Options), toggle ON **"Web .org Auto-Rendering"** to enable automatic takeovers on web pages.

### Q3: Why doesn't Org Viewer support editing files directly?
**Answer**: By design, Org Viewer is focused on delivering a blazing-fast, beautiful, and distraction-free **document reader (Previewer)**. Direct silent writes to your local file system are restricted by the browser security sandbox. A read-only design guarantees that your raw note files will never be corrupted or accidentally overwritten. To edit, use your favorite text editor, save, and simply press `F5` in Chrome to refresh!

### Q4: Does the extension transmit any of my note data?
**Answer**: Never. Org Viewer operates under a strict 100% offline policy. There is no telemetry, no analytics, and zero external network traffic.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Contributions, bug reports, and pull requests are warmly welcome!