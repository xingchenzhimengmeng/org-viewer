<div align="center">

# Org Viewer - Chrome 浏览器扩展

**无需启动 Emacs，直接在 Chrome 浏览器中将原生 `.org` 纯文本笔记渲染为精美、现代化排版的 HTML 网页。**

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

## 📖 目录

- [💡 为什么需要 Org Viewer？](#-为什么需要-org-viewer)
- [🚀 新手极速上手指南（图文流程）](#-新手极速上手指南图文流程)
  - [第 1 步：在 Chrome 中安装扩展](#第-1-步在-chrome-中安装扩展)
  - [第 2 步：开启「允许访问文件网址」开关（关键！）](#第-2-步开启允许访问文件网址开关关键)
  - [第 3 步：开始使用三种预览方式](#第-3-步开始使用三种预览方式)
  - [顶部工具栏功能说明](#顶部工具栏功能说明)
- [✨ 专业特性与语法支持详解](#-专业特性与语法支持详解)
  - [1. 类 GitHub 排版与自适应阅读容器](#1-类-github-排版与自适应阅读容器)
  - [2. 标题层级与树状点击折叠](#2-标题层级与树状点击折叠)
  - [3. 智能大纲目录（Table of Contents）](#3-智能大纲目录table-of-contents)
  - [4. 全套 Org-mode 核心语法覆盖](#4-全套-org-mode-核心语法覆盖)
  - [5. 丰富代码高亮与 LaTeX 公式渲染](#5-丰富代码高亮与-latex-公式渲染)
  - [6. 深浅色主题与原生打印优化](#6-深浅色主题与原生打印优化)
- [🛡️ 架构设计与安全性保障](#️-架构设计与安全性保障)
- [📂 项目目录结构](#-项目目录结构)
- [🛠️ 开发者指南（从源码构建与测试）](#️-开发者指南从源码构建与测试)
- [❓ 常见问题排查（FAQ）](#-常见问题排查faq)
- [📄 开源协议](#-开源协议)

---

## 💡 为什么需要 Org Viewer？

**Org-mode** 是 GNU Emacs 中最著名、最严谨的纯文本知识管理和任务规划系统，随着 **Logseq**、**Doom Emacs** 以及大量技术人员将笔记沉淀为 `.org` 格式，查看与分享 `.org` 文档的需求日益增多。

然而，传统的浏览方式存在诸多痛点：
1. **依赖繁琐的导出流程**：以往必须启动庞大的 Emacs 执行 `C-c C-e h h` 导出为 HTML，或者安装配置复杂的命令行 Pandoc 工具。
2. **缺乏即时轻量化预览**：在浏览器双击或拖拽 `.org` 文本文件时，浏览器默认仅将其当作无格式的纯文本代码查看。
3. **安全与隐私担忧**：在线转换网站会将笔记上传至第三方服务器，对个人笔记和工作文档构成隐私泄露风险。

**Org Viewer** 彻底解决了这些痛点。它是一款完全离线、开箱即用、零遥测的 Chrome 扩展，能直接就地将本地或网络上的 `.org` 文件原地重绘为类似 GitHub Markdown 般优雅美观的交互式网页。

---

## 🚀 新手极速上手指南（图文流程）

### 第 1 步：在 Chrome 中安装扩展

1. 下载并解压：[插件发行版][https://github.com/xingchenzhimengmeng/org-viewer/archive/refs/tags/v1.1.0.zip]
2. 打开 Google Chrome 浏览器，在地址栏输入 `chrome://extensions/` 并按回车进入扩展管理页面。
3. 在页面右上角，打开 **「开发者模式」 (Developer mode)** 开关。
4. 点击左上角的 **「加载已解压的扩展程序」 (Load unpacked)** 按钮。
5. 在弹出的文件选择框中，选中本插件根目录（即包含 `manifest.json` 的目录）。
6. 此时扩展列表中将出现 **Org Viewer** 图标，安装完成！

---

### 第 2 步：开启「允许访问文件网址」开关（关键！）

> ⚠️ **新手必读**：出于操作系统安全考虑，Chrome 默认对所有扩展禁用本地 `file:///` 协议读取权限。若未开启此开关，直接打开本地 `.org` 文件将无法自动接管渲染。

1. 在 `chrome://extensions/` 页面中，找到 **Org Viewer** 卡片，点击 **「详细信息」 (Details)** 按钮。
2. 向下滑动页面，找到 **「允许访问文件网址」 (Allow access to file URLs)** 选项。
3. 将该选项右侧的开关切换为 **开启状态**（显示为蓝色）。
4. 扩展会自动弹出或可以在扩展设置中看到状态变为绿色：`已开启（本地 file:///*.org 文件将自动接管渲染）`。

---

### 第 3 步：开始使用三种预览方式

#### 方式 A：双击本地 `.org` 文件直接打开
- 将本地 `.org` 文件的默认打开方式关联为 Google Chrome。
- 双击任何 `.org` 文件，Chrome 将自动就地将其渲染为精美的格式化排版！

#### 方式 B：拖拽文件至 Chrome 标签页
- 打开任意 Chrome 空白标签页，将电脑中的 `.org` 文件直接拖拽进浏览器窗口，页面瞬间就地呈现排版文章。

#### 方式 C：使用独立拖拽与粘贴预览页
- 点击 Chrome 工具栏右上角的 **Org Viewer** 插件图标，打开快捷小窗口：
  - 当前标签页是 `.org` 文件时，可点击 **「渲染当前 .org 文件」**；
  - 点击 **「选择 .org 文件」** 可直接将本地文件交给预览器，无需先开启文件网址权限；
  - 点击 **「打开预览器」** 进入全屏工作台，可拖拽、选择或粘贴 Org 文本；
  - 点击 **「加载示例」** 即刻体验完整排版功能；
  - 在预览器中直接 **粘贴 Org 纯文本**，点击「立即渲染」查看效果。

---

### 顶部工具栏功能说明

渲染后的页面顶部提供常驻工具栏，包含以下便捷功能：

| 按钮 | 功能说明 |
| :--- | :--- |
| **Open File（打开文件）** | 在独立工作台模式下快速返回文件选择/粘贴界面。 |
| **Raw Source（查看源码）** | 一键在「美化排版视图」与「原始 Org 纯文本视图」之间无缝切换。 |
| **Outline（大纲目录）** | 展开或收起左侧悬浮目录树。 |
| **Collapse All（全部折叠）** | 一键将正文中所有多级章节全部折叠收起；再次点击一键展开。 |
| **Theme（主题切换）** | 轮流切换「跟随系统主题」→「浅色模式」→「深色模式」→「Phycat 主题」。 |
| **Print Document（打印文档）** | 专为 A4/Letter 优化的打印模式，自动剔除所有工具栏与侧边栏，支持直接优雅导出 PDF。 |

---

## ✨ 专业特性与语法支持详解

### 1. 类 GitHub 排版与自适应阅读容器
- **优雅字体栈**：采用针对代码与文章优化的系统级中英文混排无衬线字体与等宽字体（SF Pro, Segoe UI, Consolas）。
- **专业排版宽度**：正文最大阅读宽度限定为最舒适的 `860px`，左侧目录树与右侧正文独立并列，在任意分屏或宽屏显示器下均不遮挡任何文字。

### 2. 标题层级与树状点击折叠
- 完美支持 `* 一级标题` 至 `****** 六级标题` 的标准层级结构。
- 每个标题左侧均带有小巧的折叠箭头（Chevron）。点击标题文字或箭头，其包含的所有子段落与下级子标题将平滑折叠隐藏。
- **状态会话记忆**：用户对各章节的折叠状态及页面的滚动进度均会通过 `sessionStorage` 绑定 URL 自动保存。刷新页面时自动无缝还原至上次阅读位置。

### 3. 智能大纲目录（Table of Contents）
- 自动递归扫描文档中的全部标题，并在左侧生成悬浮可折叠的树状大纲。
- **滚动监听（Scroll-Spy）**：阅读文章时，大纲中对应当前屏幕位置的章节项会自动高亮指示。
- **宽度可调节**：拖拽大纲与正文之间的分隔条即可自由调整大纲宽度（默认占窗口宽度的 20%）；双击分隔条或按 `Home` 键恢复默认宽度，聚焦分隔条时也可用方向键微调。
- **平滑定位**：点击大纲项即可平滑滑动跳转至对应章节。如果目标章节当前处于折叠状态，扩展会自动将其展开以保证内容可见。

### 4. 全套 Org-mode 核心语法覆盖

#### ✅ 任务状态流与自定义 `#+TODO:`
- 原生支持 `TODO`、`NEXT`、`STARTED`、`WAITING`、`DONE`、`CANCELLED` 关键字，分别呈现为鲜明的红、橙、蓝、绿状态胶囊徽章。
- **自定义序列识别**：自动解析文档头部的 `#+TODO:` 或 `#+SEQ_TODO:` 声明（如 `#+TODO: TODO FEEDBACK | RESOLVED CLOSED`），`|` 之前的词汇作为待办态加亮显示，`|` 之后的词汇作为完成态显示。

#### ✅ 优先级与标签
- 优先级标志：`[#A]`、`[#B]`、`[#C]` 自动渲染为紫色高对比度标志。
- 标签体系：行尾的 `:work:project:urgent:` 自动分离并渲染为独立的圆角灰色标签胶囊。

#### ✅ 属性抽屉（Properties Drawers）
- `:PROPERTIES: ... :END:` 及 `:LOGBOOK: ... :END:` 默认呈现为现代化折叠手风琴面板，既保持正文清爽，又可随时点开查阅元数据。

#### ✅ 时间戳与排期信息
- `SCHEDULED: <2026-10-24 Sat>` 与 `DEADLINE: <2026-10-28 Wed>` 渲染为专门的元数据提示块。
- 行内时间戳 `<2026-10-24>` 与未生效时间戳 `[2026-10-24]` 均带有专用等宽浅灰背景装饰。

#### ✅ 结构化表格
- 识别标准的 Org 表格（`| Header | ... |` 与 `|---+---|` 分割线）。
- 自动构建符合 HTML 语义标准的 `<thead>` 表头与 `<tbody>` 表体，带有细边框与斑马纹交替行底色。

#### ✅ 任务复选框与多级列表
- 勾选态 `[X]`、未勾选态 `[ ]` 与部分完成态 `[-]` 自动转换为原生复选框控件。
- 完美支持有序列表、无序列表及以 `项 :: 解释` 格式书写的描述列表（Description Lists）。

#### ✅ 双向跳转脚注
- 正文中标记的 `[fn:1]` 或 `[fn:name]` 会转换为上标跳转链接。
- 文档底部的脚注定义区域带有平滑反向跳转箭头（`↩︎`），便于论文或深度长文的阅读往返。

### 5. 丰富代码高亮与 LaTeX 公式渲染
- **代码块语法高亮**：原生支持 `#+BEGIN_SRC` 代码块，已内置精简高效的词法高亮引擎，覆盖：
  - `javascript` / `typescript`
  - `python`
  - `elisp`（Emacs Lisp）
  - `bash` / `sh` / `shell`
  - `rust`
  - `go`
  - `sql` / `json`
- **数学公式排版**：支持行内公式 `$E=mc^2$`、`\(...\)` 以及独立公式块 `\[...\]`，采用 Cambria Math 与现代数学衬线字体排版，格式优美。

### 6. 深浅色主题与原生打印优化
- **深色模式（Dark Mode）**：专为护眼打造的深灰黑调底色（`#0d1117`），并对表格、边框、代码块着色进行了深度微调。
- **浅色模式（Light Mode）**：干净清晰的 GitHub 白色纸质排版。
- **Phycat 主题**：可选的文艺阅读主题，灵感来自 Typora 的 Phycat 主题（天蓝主色、渐变丝带标题、纸纹背景）。在设置页或工具栏主题按钮中切换；默认外观保持不变。
- **编辑器级代码块**：采用 VSCode Light+/Dark+ 令牌配色并带行号槽，覆盖 Python、JavaScript/TypeScript、Java、C/C++/C#、Go、Rust、Kotlin、Ruby、PHP、SQL、Bash、JSON、HTML、CSS、YAML 与 Emacs Lisp。
- **图片显示**：`[[image.png]]` 链接渲染为居中图版，支持 `[[path][caption]]` 描述与 `#+CAPTION` 图注；无法加载的图片会显示带文件名的占位框。
- **打印与导出 PDF**：按 `Ctrl + P` 或点击工具栏「打印文档」，页面会自动隐藏顶部导航栏、大纲侧栏与折叠图标，将背景置为纯白并强制展开所有折叠内容，呈现专业出版级别的打印版面。

---

## 🛡️ 架构设计与安全性保障

### 两段式轻量注入架构（极低系统开销）
1. **轻量检测器 (`content/detector.js`, <5KB)**：
   常驻运行的检测器体积极小，仅执行简单的扩展名与 MIME 类型判断，绝不在无关页面上常驻占用 CPU 或内存。
2. **按需动态注入渲染器 (`content/renderer.js`)**：
   只有确认当前页面为目标 `.org` 文本时，后台服务才通过 `chrome.scripting` 将编译打包后的完整自包含渲染套件注入页面中执行。

### 严苛的安全模型（零 XSS 隐患）
- 所有由 Org 语法解析出的中间 HTML 字符串，均强制通过内置的 [sanitize.ts](src/parser/sanitize.ts) 白名单清洗器。
- 彻底剔除 `<script>`、`<iframe>`、`<object>`、`<embed>`、`<form>` 等高危标签。
- 严格剥离所有 `onload`、`onerror`、`onclick` 等以 `on*` 开头的内联脚本属性。
- 严格协议过滤：链接属性中仅允许放行 `http:`, `https:`, `mailto:`, `file:`, 相对路径和内部锚点，所有 `javascript:` 伪协议均被安全拦截。

### 隐私原则：100% 离线，零网络请求
- 扩展代码中**不包含任何远程请求代码**。
- 所有样式、矢量图标与高亮规则均打包在扩展包内，无需连接 CDN，即使电脑处于飞行模式或离线断网环境中也能稳定工作。

---

## 📂 项目目录结构

```
chrome_extension/
├── manifest.json              # Chrome 扩展配置规范清单 (MV3)
├── package.json               # 项目包定义与脚本命令
├── tsconfig.json              # TypeScript 编译配置
├── build.js                   # 自动化编译、自包含打包与 ZIP 生成脚本
├── run-tests.js               # 单元测试与安全过滤测试启动器
├── icons/                     # 16px, 48px, 128px 扩展专用图标
├── _locales/                  # 国际化语言包目录
│   ├── en/messages.json       # 英文翻译定义
│   └── zh_CN/messages.json    # 中文翻译定义
├── src/
│   ├── background/
│   │   └── index.ts           # 后台 Service Worker（动态注入与权限监听）
│   ├── content/
│   │   ├── detector.ts        # <5KB 超轻量静态页面检测器
│   │   └── renderer.ts        # 就地 DOM 替换、大纲构建与交互驱动
│   ├── parser/
│   │   ├── compiler.ts        # Org-mode 核心编译器与 AST 解析器
│   │   ├── todo.ts            # #+TODO 状态流扫描器
│   │   ├── highlighter.ts     # 内置多语言语法着色器
│   │   └── sanitize.ts        # 严格安全白名单清洗器
│   ├── ui/
│   │   ├── viewer/            # 独立拖拽/文件选择/粘贴工作台页面
│   │   ├── welcome/           # 新手引导与权限检测页面
│   │   ├── options/           # 扩展首选项设置页
│   │   └── styles/            # 核心样式表（github-theme, toc, print）
│   ├── utils/
│   │   ├── storage.ts         # 本地存储与会话记忆辅助工具
│   │   └── i18n.ts            # 动态多语言与地理时区自动检测
│   └── types/                 # TypeScript 类型补充声明
├── tests/
│   ├── fixtures/              # 31 份涵盖各类 Org 语法的测试样本文件
│   ├── parser.spec.js         # 编译器单元测试用例
│   └── security.spec.js       # XSS 防护与安全边界测试用例
├── store_assets/              # 应用商店发布资料与隐私政策
└── dist/
    └── org-viewer-v1.0.0.zip  # 最终打包生成的 Chrome 应用商店发布压缩包
```

---

## 🛠️ 开发者指南（从源码构建与测试）

### 运行自动化测试套件
本项目包含 37 组针对语法解析、XSS 安全注入、多语言时区检测、清单权限、打包资源及 `.org` 文件识别的自动化测试：
```bash
npm test
```

### 构建自包含发行包
执行打包命令后，脚本会自动执行 TypeScript 类型编译、自包含模块内联合并，并在 `dist/` 目录下生成标准 ZIP 发布包：
```bash
npm run build
```
打包输出产物仅约 **70 KB**，轻巧极致。

### 发布 Release
1. 修改 `manifest.json` 中的 `version`（以及 `src/ui/popup/popup.html` 里的版本号标签），然后执行 `npm run build` 与 `npm test`。
2. 提交并打标签推送：`git tag -a v1.1.0 -m "Release v1.1.0" && git push origin main --tags`。
3. `release.yml` 工作流会在标签推送后自动构建 `dist/org-viewer-v<version>.zip` 并发布为 GitHub Release 附件。也可手动发布：`gh release create v1.1.0 dist/org-viewer-v1.1.0.zip --title "v1.1.0" --notes "..."`，或在网页端 Releases - Draft a new release 中上传。
4. 同一个 zip 可直接上传到 Chrome 网上应用店开发者后台：zip 根目录即为 `manifest.json`。

---

## ❓ 常见问题排查（FAQ）

### Q1：为什么我直接双击本地 `.org` 文件，页面没有变成漂亮的排版？
**解答**：99% 的原因是因为尚未开启 Chrome 的本地文件权限。
请前往 `chrome://extensions/` 找到 **Org Viewer**，点击 **详细信息**，向下滑动并打开 **「允许访问文件网址」**。开启后刷新网页即可看到美化排版。

### Q2：访问 GitHub 或 GitLab 上的 `.org` 文件可以自动预览吗？
**解答**：可以！
1. 如果是 GitHub / GitLab 提供的 `raw` 纯文本链接（URL 以 `.org` 结尾且浏览器作为纯文本加载），扩展可以直接接管。
2. 可以在扩展设置页（右键插件图标 -> 选项）中开启 **「网页端 .org 自动渲染」** 开关，扩展将安全申请对网页纯文本文件的自动接管权限。

### Q3：为什么这款扩展不能直接编辑保存文件？
**解答**：在版本定位上，Org Viewer 专注于成为一款极致轻快、纯粹且排版精美的**文档阅读器（Previewer）**。浏览器环境对本地磁盘的直接静默写回受限于安全沙箱。只读设计能确保您的原生文件绝对不会遭遇损坏或意外覆写。如需修改，请使用您趁手的文本编辑器编辑，保存后在浏览器中按 `F5` 刷新即可即时查看到最新渲染效果。

### Q4：我的笔记数据会被上传吗？
**解答**：绝对不会。Org Viewer 遵守 100% 离线原则，代码中没有任何网络发送逻辑，不包含任何跟踪或埋点 SDK。

---

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 进行开源。欢迎提交 Issue 与 Pull Request 共同完善！
