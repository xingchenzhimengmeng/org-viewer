# Chrome Web Store Listing Information

## Title
- **English**: Org Viewer - Org-mode Previewer
- **Chinese (Simplified)**: Org Viewer - Org-mode 文档预览器

## Summary (Max 132 chars)
- **English**: Modern, beautiful, and secure Org-mode previewer. Read local and web .org files directly in Chrome without Emacs.
- **Chinese (Simplified)**: 现代、优雅且安全的 Chrome Org-mode 预览器。直接在浏览器内渲染预览 .org 笔记与文档，无需打开 Emacs。

---

## Detailed Description (English)

Org Viewer transforms plain-text Org-mode (`.org`) files into cleanly formatted, modern, and readable web documents directly inside Google Chrome — no Emacs export steps, no external pandoc installations, and zero setup required.

Whether you are reviewing notes from Emacs, checking raw notes from GitHub/GitLab, or managing dual-link notes, Org Viewer provides an instant, distraction-free reading experience.

### ✨ Key Features

- **In-Place Local & Web Preview**: Open any `file:///.../*.org` file in Chrome to instantly view its beautifully styled article format.
- **Drag & Drop Standalone Viewer**: Drag and drop any `.org` file into the viewer or paste Org-mode text for immediate offline rendering.
- **Interactive Outline (TOC)**: Automatically generates a collapsible sidebar Table of Contents with active heading tracking as you scroll.
- **Section Folding**: Click any heading to fold or unfold sections, with state preserved across refreshes.
- **Rich Syntax Support**:
  - Full support for TODO, NEXT, DONE, and custom `#+TODO:` keyword sequences with colored status badges.
  - Priority flags `[#A]`, `[#B]`, `[#C]` and tags `:tag1:tag2:`.
  - Properties drawers (`:PROPERTIES: ... :END:`) rendered as collapsible detail boxes.
  - Formatted tables with header separation and alternating zebra stripes.
  - Interactive checklists (`[ ]`, `[X]`, `[-]`) with modern checkbox styling.
  - Planning metadata: `SCHEDULED:`, `DEADLINE:`, and active/inactive timestamps.
  - Bidirectional footnotes with smooth jumping and backlink return arrows.
- **Code Syntax Highlighting**: Fast, built-in highlighting for JavaScript, TypeScript, Python, Emacs Lisp, Bash, Rust, Go, SQL, HTML, and more.
- **LaTeX Math Support**: Inline `$E=mc^2$` and block mathematical formulas rendered with clean mathematical typography.
- **Theme & View Controls**:
  - Light mode, Dark mode, or automatic system appearance.
  - Instant toggle between rendered document and raw source view.
  - Print optimization: cleanly strips UI toolbars for perfect PDF exports.

### 🔒 Privacy & Security

- **100% Offline & Private**: Zero external network requests, zero telemetry, zero analytics. Your notes never leave your computer.
- **Strict Sanitization**: Hardened HTML sanitization engine protects against malicious scripts, unwanted iframes, and cross-site scripting (XSS).
- **Open Source**: Licensed under the MIT License.

---

## 详细描述 (简体中文)

Org Viewer 是一款专为 Google Chrome 打造的现代化、安全且轻量的 Org-mode (`.org`) 纯文本预览扩展。无需启动庞大的 Emacs 客户端，无需繁琐的 `ox-html` 导出流程，也无需配置外部 Pandoc 工具，直接在浏览器中双击或拖拽 `.org` 文件，即可获得如同 GitHub Markdown 般优雅美观的排版阅读体验。

### ✨ 核心功能亮点

- **本地与网络文件原地预览**：在 Chrome 中直接打开任何 `file:///.../*.org` 文件或网络 raw 链接，自动无缝接管并就地渲染。
- **独立拖拽与粘贴预览页**：支持一键拖拽本地 `.org` 文件、点击文件选择器上传，或直接粘贴 Org 文本即时预览。
- **智能大纲与目录 (TOC)**：自动解析文档标题层级生成左侧悬浮目录树，随着页面滚动自动高亮当前阅读段落。
- **标题点击层级折叠**：点击标题可折叠或展开下级章节内容，页面刷新后自动记忆滚动位置与折叠状态。
- **全方位 Org-mode 语法支持**：
  - 支持 TODO、NEXT、WAITING、DONE 以及通过 `#+TODO:` 自定义的任务状态流，醒目标签分类着色。
  - 支持任务优先级 `[#A]`, `[#B]`, `[#C]` 与标签 `:tag1:tag2:` 徽章呈现。
  - 属性抽屉 (`:PROPERTIES: ... :END:`) 自动呈现为可展开的详情抽屉。
  - 标准 Org 表格转制为美观的斑马纹排版表格。
  - 任务复选框列表 (`[ ]`, `[X]`, `[-]`) 原生样式展示。
  - 任务排期信息：`SCHEDULED:`、`DEADLINE:` 与时间戳清晰呈现。
  - 双向脚注跳转：文档内点击脚注标号直达底部释义，点击反向链接平滑返回原位置。
- **多语言代码高亮**：原生内置高亮引擎，覆盖 JavaScript, TypeScript, Python, Emacs Lisp, Shell/Bash, Rust, Go, SQL 等常用语言。
- **LaTeX 数学公式解析**：支持 `$E=mc^2$` 行内公式与数学公式块排版。
- **便捷阅读辅助**：
  - 支持深色模式（Dark Mode）、浅色模式及跟随系统自动切换。
  - 一键在“渲染视图”与“纯文本源码”之间自由切换。
  - 专属打印排版优化：隐藏导航栏与多余控件，支持一键优雅另存为 PDF。

### 🔒 隐私与安全承诺

- **完全离线，零遥测**：扩展运行不发起任何外部网络请求，不收集任何用户数据与浏览记录。所有笔记均在本地浏览器内部完成解析。
- **严格的安全白名单**：内置严苛的 HTML 净化流水线，彻底拦截任何 `<script>` 注入、`javascript:` 伪协议链接及恶意代码，保障阅读安全。
- **开源保障**：基于 MIT 协议完全开源。