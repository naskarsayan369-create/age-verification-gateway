# 🛡️ Age Verification Gateway

> **A privacy-preserving age verification dApp built on the Midnight Network.**
> Prove you meet age requirements without revealing your birthdate or identity.

---

## 🚀 Live Demo, Video & Repository

- 🌐 **Live Demo:** [https://age-verification-gateway-hm6wh4rog.vercel.app](https://age-verification-gateway-hm6wh4rog.vercel.app)
- 📺 **Video Walkthrough:** [https://youtu.be/cSVF8q7BSUM](https://youtu.be/cSVF8q7BSUM)
- 💻 **Repository:** [GitHub Repository](https://github.com/naskarsayan369-create/age-verification-gateway)

[![Midnight Network](https://img.shields.io/badge/Midnight-v4.1.1-8b5cf6)](https://midnight.network)

---

## 📋 Challenge Requirements & Passing Checklist

### Level 1 — Contract & Local Deployment
- [x] Compact contract with public ledger state (`verificationCount`, `lastResult`, `minimumAge`)
- [x] Private witness (`localBirthYear`) — never disclosed on-chain
- [x] `disclose()` used deliberately only for boolean outcomes and policy values
- [x] Contract compiles: `compact compile src/age_gate.compact ./src/managed/age-gate`
- [x] Generated `contract/src/managed/age-gate/` with `keys/`, `zkir/`, `contract/`
- [x] Local deployment via CLI: `npm run cli`
- [x] Preprod deployment documented (requires Docker WSL integration)
- [x] README with setup, compile, local deploy, privacy model, network status
- [x] Public state vs private witness section documented
- [x] 5+ meaningful commits

### Level 2 — Frontend
- [x] Lace wallet Connect button (id: `btn-connect-wallet`)
- [x] Lace wallet Disconnect button (id: `btn-disconnect-wallet`)
- [x] Wallet address displayed after connect
- [x] Network status displayed (NetworkPill component)
- [x] Contract address loaded from `VITE_CONTRACT_ADDRESS` env
- [x] Network loaded from `VITE_NETWORK` env
- [x] `verifyAge` circuit callable from frontend
- [x] Result displayed (pass/fail ResultCard)
- [x] Public ledger state shown (LedgerPanel with 4 stats)
- [x] User enters birth year (private) — never displayed publicly
- [x] ZK proof submitted without revealing birth year
- [x] Loading, success, error, empty, disconnected states all handled
- [x] `.env.example` with `VITE_NETWORK`, `VITE_CONTRACT_ADDRESS`, `VITE_PROOF_SERVER_URL`
- [x] Vercel/Netlify deployment instructions
- [x] 8+ meaningful commits

### Level 3 — Production Polish
- [x] 8 meaningful contract tests (age-gate.test.ts)
- [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`)
  - [x] Install dependencies
  - [x] Compile contract
  - [x] Run tests
  - [x] Type-check and build frontend
- [x] Complete README with Privacy Model section
- [x] README: What observers CAN see
- [x] README: What observers CANNOT see
- [x] README: What is deliberately disclosed
- [x] README: Product Proposal with Level 3 category (Age / Eligibility Gate)
- [x] README: Submission checklist (all 3 levels)
- [x] Polished frontend (glassmorphism dark theme, animations, hover effects)
- [x] All UI states: loading, success, error, empty, disconnected
- [x] No hardcoded addresses (env vars used throughout)
- [x] 20+ meaningful commits

---

## 🛡️ Midnight Privacy Model: What an Observer Learns vs Cannot Learn

This is the core security model of the Age Verification Gateway.

### ❌ What an Observer CANNOT Learn (Kept Strictly Private):
| Field | Why It's Hidden |
|-------|----------------|
| **Birth year** | Stored in browser private state; used only inside the ZK circuit computation |
| **Actual computed age** | Intermediate value inside the proof; never disclosed |
| **Who verified** | No wallet address or identity is linked to any verification result |
| **Pass/fail per user** | Only the most recent global result is shown; no per-user history |

### ✅ What an Observer CAN Learn (Disclosed On-Chain Public State):
| Field | Value | Reason |
|-------|-------|--------|
| `verificationCount` | Running integer | Policy transparency — how many proofs submitted |
| `lastResult` | `true` or `false` | The outcome of the last verification — no identity attached |
| `minimumAge` | e.g. `18` or `21` | The access policy is public by design |
| `initialized` | `true/false` | Contract deployment status |

The circuit uses `disclose()` only for policy definitions and boolean results:
```compact
// PRIVATE: localBirthYear() — never leaves ZK circuit
// PUBLIC:  lastResult = disclose(true) — only the boolean outcome
lastResult = disclose(true);
verificationCount.increment(1);
```

---

## 🛠️ Contract & Live Deployment Details

### Undeployed / Standalone (Local)
```bash
npm run cli
# Uses local testnet containers via Docker
```

### Preview Network
```bash
npm run cli:preview
# Follow wallet funding instructions printed to console
```

### Preprod Network
```bash
npm run cli:preprod
```
**Preprod Deployment Status:**
- Contract compiles: ✅
- Local deploy works: ✅ (requires Docker WSL integration)
- Faucet funding: ⚠️ Requires running deploy script to get wallet address
- Preprod wallet sync: ⚠️ May be slow — see logs for sync progress

> If Preprod sync hangs, check endpoints `rpc.preprod.midnight.network` and `indexer.preprod.midnight.network`. Do **not** delete `.midnight-state.json` after funding — it stores your wallet state.

---

## 🔑 Browser Wallet Connector (window.midnight.mnLace)

The frontend integrates directly with the Midnight Lace Wallet for seamless Web3 interaction.
- Uses `window.midnight.mnLace` to establish connection.
- Standard connection logic implemented in `bboard-ui/src/App.tsx`.
- Implements standard connection interface and retrieves the active wallet address.

---

## 🚀 Quickstart & Local Installation

### Prerequisites
| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 22 | Use NVM: `nvm use 22` |
| compact | 0.5.1+ | Installed via `npm install` |
| Docker | Desktop 4.x | Required for local testnet |
| WSL 2 | Ubuntu | Required for Midnight CLI tools |

> **Docker Note:** Enable WSL integration in Docker Desktop Settings → Resources → WSL Integration → Enable for your Ubuntu distro.

### 1. Clone & Install
```bash
# In WSL Ubuntu
cd ~/midnight-projects/age-verification-gateway
npm install
```

### 2. Compile the Contract
```bash
npm run compile
```

### 3. Run the CLI (Local Standalone)
```bash
npm run cli
```
The CLI will deploy the contract to the local network and present an interactive menu to verify age or view ledger state.

### 4. Run the Frontend
```bash
cd bboard-ui
cp .env.example .env
# Edit .env with your contract address (from CLI deploy step)
npm run dev
# Open http://localhost:5173
```

---

## 🧪 Automated Test Suite

The contract test suite covers critical verification flows and boundary conditions:

| Test | Description |
|------|-------------|
| Initialization | Contract initializes with correct public state |
| Pass — adult user | Born 1990, year 2025, min 18 → PASS |
| Fail — underage | Born 2015, year 2025, min 18 → FAIL (proof rejected) |
| Counter increments | Multiple verifications increment count correctly |
| Privacy check | Birth year is NOT in ledger state |
| Reset | `resetLastResult()` clears the boolean |
| Minimum age 21 | Works for 21+ gate (exact boundary) |
| Boundary — 1 year under | Born 2008, year 2025, min 18 → FAIL |

```bash
npm test
# Runs all 8 tests via vitest
```

---

## 🎯 Product Proposal: Age / Eligibility Gate

### Problem
Age verification today requires uploading government IDs to third-party services. This creates:
- **Privacy risk**: ID data is stored centrally, a prime target for breaches
- **Friction**: Users abandon sign-up when ID scanning is required
- **Liability**: Platforms are responsible for securely storing age data

### Solution
The Age Verification Gateway uses **zero-knowledge proofs** on Midnight to verify age without collecting any personal data:
1. The user enters their birth year **locally in their browser**
2. A ZK circuit computes `age = currentYear - birthYear` and checks `age >= minimumAge`
3. Only the **boolean result** (pass/fail) is submitted on-chain — no birth year, no identity
4. The platform receives cryptographic proof of eligibility

---

## 📁 Project Structure

```
age-verification-gateway/
├── contract/           # Compact ZK contract (privacy logic, witnesses, tests)
├── api/                # TypeScript API layer
├── bboard-cli/         # Interactive CLI & Network configs
├── bboard-ui/          # React frontend (Vite)
├── .github/workflows/  # CI pipelines
└── README.md           # This file
```

---

## 📸 Platform Screenshots

### Age Verification Portal
*(Users securely enter their birth year into a privacy-first gateway interface.)*
[Insert screenshot here]

### ZK Proof Generation & Activity Log
*(A clean timeline or log showing the zero-knowledge proof generation and validation without exposing data.)*
[Insert screenshot here]

### Multi-Page Dashboard & Explorer State
*(A high-level view showing the on-chain ledger state including total verification count and minimum age requirement.)*
[Insert screenshot here]

---

## ⚙️ CI/CD Pipeline

The project features a fully automated CI/CD pipeline using **GitHub Actions**.

- **CI Workflow (`ci.yml`)**: Triggers on pushes and PRs to the `main` branch.
  - Installs Midnight Compact compiler and Node.js dependencies.
  - Compiles the ZK contract.
  - Runs the full automated test suite for the contract.
  - Performs TypeScript type-checking for the React frontend, API, and CLI components.
  - Builds the production distribution of the frontend application.

[![CI](https://github.com/naskarsayan369-create/age-verification-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/naskarsayan369-create/age-verification-gateway/actions)

---

## 📄 License

Apache 2.0 — See [LICENSE](LICENSE)
