# Privacy Policy for Org Viewer

**Last Updated: October 24, 2026**

Org Viewer ("we", "our", or "the extension") is an open-source browser extension developed for Google Chrome. We believe that privacy is a fundamental human right, especially when working with personal notes, journals, and technical documentation.

## 1. Zero Data Collection
- Org Viewer **does not collect, store, transmit, or monetize any personal data, browsing history, or user content**.
- All Org-mode parsing and HTML rendering are performed **100% locally and offline** within your browser.
- No analytics, telemetry, tracking pixels, cookies, or remote logging services are embedded in the extension.

## 2. Zero External Network Requests
- Org Viewer contains **zero outgoing network requests**.
- All stylesheets, fonts, code syntax definitions, and assets are bundled directly inside the extension package.
- The extension does not communicate with any external servers or third-party APIs.

## 3. Permissions Justification
- `storage`: Used solely to persist your local user preferences (such as preferred theme and default outline state) and session scroll positions. This data stays exclusively in your local Chrome profile or private Chrome Sync account.
- `scripting`: Used strictly to inject the local rendering stylesheets and scripts when you open a `.org` document.
- `file:///`: Optional local file scheme access. Chrome requires explicit manual approval to view local files. Org Viewer only reads files you deliberately open.
- Optional Web host permissions (`*://*/*.org*`): Disabled by default. Only used if you explicitly enable "Web .org Auto-Rendering" in the settings to render raw plain-text `.org` URLs.

## 4. Open Source Transparency
Org Viewer is open source under the MIT License. Anyone can inspect and audit the complete source code to verify our privacy guarantees.

## 5. Contact
If you have any questions or feedback regarding this Privacy Policy, please open an issue on the GitHub repository.