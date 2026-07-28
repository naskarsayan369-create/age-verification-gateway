# 🛡️ Age Verification Gateway

> **A privacy-preserving age verification dApp built on the Midnight Network.**
> Prove you meet age requirements without revealing your birthdate or identity.

🚀 **Live Demo:** [https://age-verification-gateway-hm6wh4rog.vercel.app](https://age-verification-gateway-hm6wh4rog.vercel.app)

[![CI](https://github.com/yourusername/age-verification-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/age-verification-gateway/actions)
[![Midnight Network](https://img.shields.io/badge/Midnight-v4.1.1-8b5cf6)](https://midnight.network)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 📖 Product Overview

The **Age Verification Gateway** is a ZK-powered API and dApp that allows websites and platforms to verify user age without collecting personally identifiable information. Instead of uploading an ID document (which creates privacy and data breach risks), users submit a **zero-knowledge proof** that they were born before a certain year.

**Use Cases:**
- Alcohol & tobacco e-commerce (18+ / 21+)
- Adult content platforms
- Gambling websites
- Pharmaceutical sites with restricted medicines
- Any platform needing COPPA / age-of-consent compliance

**Level 3 Category:** Age / Eligibility Gate

---

## 🔐 Privacy Model

This is the most important section. Here is exactly what is and is not revealed:

### What Observers CAN See (On-Chain / Public Ledger)
| Field | Value | Reason |
|-------|-------|--------|
| `verificationCount` | Running integer | Policy transparency — how many proofs submitted |
| `lastResult` | `true` or `false` | The outcome of the last verification — no identity attached |
| `minimumAge` | e.g. `18` or `21` | The access policy is public by design |
| `initialized` | `true/false` | Contract deployment status |

### What Observers CANNOT See (Private / Off-Chain)
| Field | Why It's Hidden |
|-------|----------------|
| **Birth year** | Stored in browser private state; used only inside the ZK circuit computation |
| **Actual computed age** | Intermediate value inside the proof; never disclosed |
| **Who verified** | No wallet address or identity is linked to any verification result |
| **Pass/fail per user** | Only the most recent global result is shown; no per-user history |

### What Is Deliberately Disclosed
The circuit uses `disclose()` only for:
1. `lastResult` — the boolean outcome (true = pass, false = fail). **No identity is attached.**
2. `minimumAge` — set at constructor time; the access policy itself is public.
3. `initialized` — contract deployment state.

```compact
// PRIVATE: localBirthYear() — never leaves ZK circuit
// PUBLIC:  lastResult = disclose(true) — only the boolean outcome
lastResult = disclose(true);
verificationCount.increment(1);
```

---

## 🏗️ Architecture

```
age-verification-gateway/
├── contract/           # Compact ZK contract
│   └── src/
│       ├── age_gate.compact    # Contract (privacy logic)
│       ├── witnesses.ts        # Private state (birthYear)
│       ├── index.ts            # Contract exports
│       ├── managed/age-gate/   # Generated artifacts (keys, zkir, JS)
│       └── test/
│           └── age-gate.test.ts  # Contract tests
├── api/                # TypeScript API layer
│   └── src/
│       ├── index.ts           # AgeGateAPI class
│       └── common-types.ts    # Shared types
├── bboard-cli/         # Interactive CLI
│   └── src/
│       ├── index.ts           # CLI entrypoint
│       └── config.ts          # Network configurations
├── bboard-ui/          # React frontend (Vite)
│   └── src/
│       ├── App.tsx            # Main UI component
│       ├── index.css          # Global styles
│       └── main.tsx           # React entry
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI
├── .env.example               # Environment template
└── README.md                  # This file
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 22 | Use NVM: `nvm use 22` |
| compact | 0.5.1+ | `~/.local/bin/compact` |
| Docker | Desktop 4.x | Required for local testnet |
| WSL 2 | Ubuntu | Required for Midnight CLI tools |

> **Docker Note:** Enable WSL integration in Docker Desktop Settings → Resources → WSL Integration → Enable for your Ubuntu distro. This is required for the standalone local network.

### 1. Clone & Install

```bash
# In WSL Ubuntu
cd ~/midnight-projects/age-verification-gateway
npm install
```

### 2. Compile the Contract

```bash
npm run compile
# or directly:
~/.local/bin/compact compile contract/src/age_gate.compact contract/src/managed/age-gate
```

Expected output:
```
Compiling 2 circuits:
  verifyAge
  resetLastResult
✓ Generated: contract/src/managed/age-gate/
```

### 3. Run Tests

```bash
npm test
# Runs vitest for the contract package
```

### 4. Run the CLI (Local Standalone)

> Requires Docker with WSL integration enabled.

```bash
npm run cli
# or:
npm run standalone --workspace=bboard-cli
```

The CLI will:
1. Ask for your birth year (stored privately, never sent on-chain)
2. Deploy the contract to the local standalone network
3. Present an interactive menu to verify age or view ledger state

### 5. Run the Frontend

```bash
cd bboard-ui
cp .env.example .env
# Edit .env with your contract address (from CLI deploy step)
npm run dev
# Open http://localhost:5173
```

---

## 🌐 Network Deployment

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

| Step | Status |
|------|--------|
| Contract compiles | ✅ |
| Local deploy works | ✅ (requires Docker WSL integration) |
| Faucet funding | ⚠️ Requires running deploy script to get wallet address |
| Preprod wallet sync | ⚠️ May be slow — see logs for sync progress |

> If Preprod sync hangs, check endpoints:
> ```bash
> curl -I https://rpc.preprod.midnight.network
> curl -I https://indexer.preprod.midnight.network/api/v4/graphql
> ```
> Do **not** delete `.midnight-state.json` after funding — it stores your wallet state.

---

## 🔧 Environment Variables

Copy `bboard-ui/.env.example` to `bboard-ui/.env`:

```env
VITE_NETWORK=undeployed          # undeployed | standalone | preview | preprod
VITE_CONTRACT_ADDRESS=           # From CLI deploy output
VITE_PROOF_SERVER_URL=http://localhost:6300
VITE_INDEXER_URL=                # Optional: override indexer
VITE_NODE_URL=                   # Optional: override node RPC
```

---

## 🧪 Tests

The contract test suite covers:

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

## 🚀 Frontend Deployment (Vercel / Netlify)

### Vercel

```bash
cd bboard-ui
vercel --prod
# Set env vars in Vercel dashboard
```

### Netlify

```bash
cd bboard-ui
netlify deploy --prod --dir=dist
```

---

## 📋 Submission Checklist

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
- [x] 10+ meaningful commits

---

## 🏛️ Product Proposal — Age / Eligibility Gate

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

### Value Proposition

| Traditional Age Check | Age Verification Gateway |
|----------------------|--------------------------|
| Upload government ID | Enter birth year locally |
| ID stored on servers | Birth year never leaves browser |
| Central breach risk | No PII collected anywhere |
| 30–60 second friction | Sub-5 second ZK proof |
| Regulatory liability | GDPR/CCPA compliant by design |

---

## 🔑 Key Files

- [`contract/src/age_gate.compact`](contract/src/age_gate.compact) — The core ZK contract
- [`contract/src/witnesses.ts`](contract/src/witnesses.ts) — Private state (birth year)
- [`contract/src/test/age-gate.test.ts`](contract/src/test/age-gate.test.ts) — All tests
- [`bboard-ui/src/App.tsx`](bboard-ui/src/App.tsx) — Frontend UI
- [`api/src/index.ts`](api/src/index.ts) — TypeScript API layer
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — CI pipeline

---

## 📜 License

Apache 2.0 — See [LICENSE](LICENSE)
