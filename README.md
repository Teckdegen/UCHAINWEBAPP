## UNCHAINEDWEBAPP

Unchained Web Wallet is a non-custodial, multi-chain cryptocurrency wallet and browser extension built with Next.js, React, and TypeScript.

---

### Core Features

- **Wallet management**
  - Create wallets with 12‑word mnemonics
  - Import via seed phrase or private key
  - Non‑custodial: keys encrypted client‑side
- **Multi‑chain**
  - Ethereum Mainnet (Chain ID: 1)
  - Pepe Unchained V2 / PEPU (Chain ID: 97741)
- **Product surface**
  - Send / Receive (native + ERC‑20)
  - Unchained Swap (Uniswap V3 on PEPU)
  - Unchained Bridge (SuperBridge L2→L1)
  - Built‑in dApp browser
  - Portfolio view with CoinGecko + GeckoTerminal pricing
  - PEPU `.pepu` domain integration (Unchained Domains)

---

### Security Overview (from `audit.md`)

- **Threat model**
  - Handles mnemonics, private keys, and signing operations entirely in the browser
  - No backend required; all persistence via encrypted localStorage
- **Key points from the internal audit**
  - Stronger encryption and key‑derivation added (PBKDF2/Argon2 style approach with salt)
  - Auto‑lock and unlock flows hardened
  - Console logging of sensitive data removed
  - Input validation added across setup, unlock, and signing flows
  - RPC errors are surfaced explicitly in the UI so users can see when a node is unhealthy

> This wallet is non‑custodial: you are fully responsible for backing up your seed phrase and private key. Losing them means permanently losing access to funds.

---

### Domains / Unchained Domains (`README_DOMAINS.md` + `DEPLOYMENT.md`)

- **Chain / Contract**
  - Chain: PEPU (Pepe Unchained V2), Chain ID `97741`
  - UnchainedDomains contract exposes:
    - Forward resolution: `.pepu` → wallet address
    - Reverse resolution: wallet address → `.pepu`
    - Availability / fee checks
    - Registration / renewal with USDC
- **Usage inside the wallet**
  - `/send` accepts `.pepu` domains in the recipient field and resolves them before sending
  - `/dashboard` shows the user’s domain when available
- **Standalone domain site**
  - You can build a separate domain UI using the documented ABI, RPC (`https://rpc-pepu-v2-mainnet-0.t.conduit.xyz`) and the examples originally in `README_DOMAINS.md` / `DEPLOYMENT.md`

---

### SDK (`sdk/README.md`)

There is a small SDK (`sdk/`) to help dApps:

- Detect and prioritize **Unchained Wallet** via `window.ethereum.isUnchained === true`
- Fallback to MetaMask / Coinbase / generic injected providers
- Provide a ready‑made `WalletSelector` React component
- Provide vanilla helpers (`createWalletManager`, `isUnchainedInstalled`, etc.)

The SDK is built on **wagmi** + **viem** and can be used in a normal dApp with a `WagmiProvider` + `QueryClientProvider`.

---

### Browser Extension & Chrome Web Store Justification

The extension injects a `window.ethereum` provider so dApps can talk to the wallet like MetaMask.

- **Architecture (from `BROWSER_EXTENSION_ARCHITECTURE.md`)**
  - `manifest.json`: MV3 manifest, background service worker, and content/injected scripts
  - `background.js`: handles connection requests, redirects to the web wallet, and relays responses
  - Content / injected script: provides an EIP‑1193 compatible `window.ethereum` that forwards to Unchained
  - Web wallet routes like `/connect` + `/sign` handle approvals and send results back

#### Single‑purpose statement (from `SINGLE_PURPOSE_STATEMENT.md`)

- Single purpose: **cryptocurrency wallet** for Ethereum + Pepe Unchained.
- Functions:
  - Store and manage assets (ETH, PEPU, ERC‑20)
  - Connect to Web3 dApps
  - Sign transactions and messages
  - Show balances and history
- Does **not**:
  - Collect browsing data
  - Track users across sites
  - Modify page content beyond provider injection

#### Broad host permissions justification (from `CHROME_STORE_JUSTIFICATION.md`)

Why `<all_urls>` / broad host style access is required:

- dApps expect `window.ethereum` to be:
  - Present on **any** domain
  - Available **synchronously** on page load
  - EIP‑1193 compatible
- This is exactly how MetaMask, Coinbase Wallet, Trust Wallet, Brave Wallet, etc. work.
- The content script:
  - Only injects the provider stub
  - Does **not** read or modify page content
  - Requires explicit user approval for all signing / sending

#### `activeTab` permission (from `ACTIVETAB_JUSTIFICATION.md`)

- Used only:
  - When the user explicitly clicks the extension or otherwise interacts with it
  - To read the active tab’s URL / origin for display in approval UIs
- Benefits:
  - Temporary, one‑shot access to the active tab
  - No background reading of tabs
  - Aligns with Chrome’s least‑privilege model

#### Optional permissions / scripting (from `OPTIONAL_PERMISSIONS_APPROACH.md` + `SCRIPTING_PERMISSION_JUSTIFICATION.md`)

- The extension can request `scripting` / host access as **optional** permissions:
  - Permission prompts are shown clearly
  - Injection only happens after user grants permission
  - Permission can be revoked at any time from Chrome settings
- Programmatic injection:
  - Uses `chrome.scripting` to inject content scripts / provider shims
  - Makes it clear to Chrome and users that injection is controlled and limited

#### Why the “Broad Host Permissions” warning still appears

Summarizing `CHROME_WARNING_EXPLANATION.md`, `WARNING_STILL_APPEARS_EXPLANATION.md`, and `MANIFEST_*_EXPLANATION.md`:

- Chrome treats **any** content script with `matches: ["<all_urls>"]` as a broad host permission.
- Even with:
  - No explicit `host_permissions`
  - `activeTab`
  - Optional permissions and scripting
- The warning still shows because:
  - Wallets must inject `window.ethereum` before dApp JS runs
  - That requires content scripts on `<all_urls>`
- This is expected for all serious wallet extensions.
- The correct way to handle it is:
  - Keep the minimal, optimized manifest
  - Provide the justification above in the Chrome Web Store submission

---

### Development

- **Install**

```bash
npm install
```

- **Run dev**

```bash
npm run dev
```

- **Build**

```bash
npm run build
npm start
```

All important previous `.md` documentation (audit, domains, deployment, SDK, and Chrome Store justifications) has been merged into this single `README.md`.

---

### License

MIT
