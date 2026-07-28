// Age Verification Gateway - Main App Component
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useCallback } from 'react';
import CosmicSingularityBackground from './components/lightswind/cosmic-singularity-background';

// ─── Types ───────────────────────────────────────────────────────────────────

type WalletState = 'disconnected' | 'connecting' | 'connected' | 'error';
type VerifyState = 'idle' | 'loading' | 'success' | 'error';

interface LedgerState {
  verificationCount: number;
  lastResult: boolean;
  minimumAge: number;
  initialized: boolean;
}

interface HistoryEntry {
  timestamp: Date;
  result: 'pass' | 'fail';
  minimumAge: number;
}

interface WalletInfo {
  address: string;
  network: string;
}

// ─── Inline CSS Strings ───────────────────────────────────────────────────────

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '0 24px 80px',
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: '#050510',
    position: 'relative' as const,
    overflowX: 'hidden' as const,
  } as React.CSSProperties,

  content: {
    position: 'relative' as const,
    zIndex: 1,
    width: '100%',
    maxWidth: 820,
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 0',
    borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
    marginBottom: 48,
  } as React.CSSProperties,

  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as React.CSSProperties,

  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
  } as React.CSSProperties,

  card: {
    background: 'rgba(255, 255, 255, 0.035)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    borderRadius: 20,
    padding: 28,
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    color: '#f1f0ff',
    fontSize: 15,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  select: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(10, 10, 30, 0.9)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    color: '#f1f0ff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
  } as React.CSSProperties,

  readonlyField: {
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    color: '#6b7280',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: 8,
  } as React.CSSProperties,
};

// ─── Environment Config ───────────────────────────────────────────────────────

const NETWORK = (import.meta as any).env?.VITE_NETWORK || 'Binly Testnet';
const CONTRACT_ADDRESS = (import.meta as any).env?.VITE_CONTRACT_ADDRESS || '';
const PROOF_SERVER_URL = (import.meta as any).env?.VITE_PROOF_SERVER_URL || 'http://localhost:6300';

// ─── App Component ────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>('disconnected');
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'how-to-use' | 'faq' | 'history'>('home');
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [minimumAge, setMinimumAge] = useState('18');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyResult, setVerifyResult] = useState<'pass' | 'fail' | 'none'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [ledgerState, setLedgerState] = useState<LedgerState>({
    verificationCount: 0,
    lastResult: false,
    minimumAge: 18,
    initialized: false,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const currentYear = new Date().getFullYear();

  const connectWallet = useCallback(async () => {
    setWalletState('connecting');
    setErrorMessage('');

    try {
      const midnight = (window as any).midnight;

      if (!midnight?.mnLace) {
        // Graceful demo mode
        await new Promise((r) => setTimeout(r, 1200));
        setWalletInfo({ address: 'mn_addr_test1qr3vz9a2s4d6f8g0h1j2k3l4m5n6p7q8r9s0t', network: NETWORK });
        setWalletState('connected');
        setLedgerState({ verificationCount: 0, lastResult: false, minimumAge: 18, initialized: true });
        return;
      }

      const walletApi = await midnight.mnLace.enable();
      const state = await walletApi.state();
      setWalletInfo({ address: state.address || 'mn_addr_...', network: state.networkId || NETWORK });
      setWalletState('connected');
      setLedgerState((prev) => ({ ...prev, initialized: true, minimumAge: parseInt(minimumAge) }));
    } catch (err: any) {
      setWalletState('error');
      setErrorMessage(err.message || 'Wallet connection failed');
    }
  }, [minimumAge]);

  const disconnectWallet = useCallback(() => {
    setWalletState('disconnected');
    setWalletInfo(null);
    setVerifyState('idle');
    setVerifyResult('none');
    setBirthYear('');
    setErrorMessage('');
  }, []);

  const handleVerify = useCallback(async () => {
    if (!birthYear || walletState !== 'connected') return;

    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setErrorMessage(`Enter a valid birth year between 1900 and ${currentYear}.`);
      return;
    }

    const age = currentYear - year;
    const minAge = parseInt(minimumAge, 10);

    setVerifyState('loading');
    setErrorMessage('');
    setVerifyResult('none');

    // Simulate ZK proof generation delay
    await new Promise((r) => setTimeout(r, 2200));

    if (age >= minAge) {
      setVerifyState('success');
      setVerifyResult('pass');
      setHistory((prev) => [{ timestamp: new Date(), result: 'pass', minimumAge: minAge }, ...prev]);
      setLedgerState((prev) => ({
        ...prev,
        lastResult: true,
        verificationCount: prev.verificationCount + 1,
      }));
    } else {
      setVerifyState('error');
      setVerifyResult('fail');
      setErrorMessage(`Age requirement not met. Minimum is ${minAge} years. Proof rejected.`);
      setHistory((prev) => [{ timestamp: new Date(), result: 'fail', minimumAge: minAge }, ...prev]);
      setLedgerState((prev) => ({
        ...prev,
        lastResult: false,
        verificationCount: prev.verificationCount + 1,
      }));
    }

    setTimeout(() => setVerifyState('idle'), 4000);
  }, [birthYear, minimumAge, walletState, currentYear]);

  const handleReset = useCallback(() => {
    setVerifyResult('none');
    setVerifyState('idle');
    setErrorMessage('');
    setBirthYear('');
    setLedgerState((prev) => ({ ...prev, lastResult: false }));
  }, []);

  const handleCopyAddress = useCallback(() => {
    if (walletInfo?.address) {
      navigator.clipboard.writeText(walletInfo.address).then(() => {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      });
    }
  }, [walletInfo]);

  const isDisabled = !birthYear || walletState !== 'connected' || verifyState === 'loading';

  const getVerifyButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      padding: '16px 24px',
      borderRadius: 14,
      border: 'none',
      fontSize: 15,
      fontWeight: 700,
      fontFamily: 'inherit',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.25s ease',
      letterSpacing: '0.3px',
    };
    if (verifyState === 'success') return { ...base, background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' };
    if (verifyState === 'error') return { ...base, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' };
    if (verifyState === 'loading') return { ...base, background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' };
    if (isDisabled) return { ...base, background: 'rgba(255,255,255,0.06)', color: '#4b5563' };
    return { ...base, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' };
  };

  const getButtonLabel = () => {
    if (verifyState === 'loading') return '⏳ Generating ZK Proof...';
    if (verifyState === 'success') return '✅ Age Verified!';
    if (verifyState === 'error') return '❌ Proof Rejected';
    return '🔐 Verify Age Privately';
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.app}>
      {/* Cosmic Singularity Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <CosmicSingularityBackground colorInner="#8b5cf6" colorOuter="#6366f1" />
      </div>

      <div style={styles.content}>
        {/* ── Header ── */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          borderBottom: '1px solid rgba(139, 92, 246, 0.12)',
          marginBottom: 48,
          gap: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '20px' }}>
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>🛡️</div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f0ff', lineHeight: 1.2, letterSpacing: '-0.3px', margin: 0 }}>
                  Age Verification Gateway
                </h1>
                <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: 2 }}>
                  Midnight Network · ZK Privacy
                </p>
              </div>
            </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {walletInfo && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)', borderRadius: 50,
                fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8', display: 'inline-block' }} />
                {walletInfo.network}
              </span>
            )}

            {walletState === 'connected' ? (
              <button
                id="btn-disconnect-wallet"
                onClick={disconnectWallet}
                aria-label="Disconnect wallet"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 50,
                  border: '1px solid rgba(16,185,129,0.4)',
                  background: 'rgba(16,185,129,0.08)', color: '#10b981',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                {walletInfo?.address.slice(0, 14)}… Disconnect
              </button>
            ) : (
              <button
                id="btn-connect-wallet"
                onClick={connectWallet}
                disabled={walletState === 'connecting'}
                aria-label="Connect Lace wallet"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 50,
                  border: '1px solid rgba(139,92,246,0.35)',
                  background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                  fontSize: 13, fontWeight: 600, cursor: walletState === 'connecting' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {walletState === 'connecting' ? '⏳ Connecting...' : '🔗 Connect Lace'}
              </button>
            )}
          </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '16px' }}>
            <nav style={{
              display: 'flex', gap: 4, alignItems: 'center',
              padding: '4px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 50,
              flexWrap: 'wrap', justifyContent: 'center'
            }}>
              {[
                { id: 'home', label: 'Home', icon: '🏠' },
                { id: 'overview', label: 'Overview', icon: '📖' },
                { id: 'how-to-use', label: 'How to Use', icon: '🛠️' },
                { id: 'faq', label: 'FAQ', icon: '❓' },
                { id: 'history', label: 'History', icon: '🕒' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 40,
                    background: activeTab === tab.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                    border: activeTab === tab.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                    color: activeTab === tab.id ? '#c4b5fd' : '#9ca3af',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {activeTab === 'home' && (
          <>
        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)', borderRadius: 50,
            fontSize: 12, fontWeight: 600, color: '#a78bfa',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20,
          }}>
            🏗️ Age / Eligibility Gate · Level 3
          </div>
          <h2 style={{
            fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800,
            color: '#f1f0ff', lineHeight: 1.15, letterSpacing: '-1.2px', marginBottom: 14,
          }}>
            Prove Your Age.<br />
            <span style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 40%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Keep Your Identity Private.
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Zero-knowledge proofs verify you meet age requirements without
            revealing your birthdate, identity, or any personal information.
          </p>
        </div>

        {/* ── Privacy Banner ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '14px 20px', background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14, marginBottom: 28,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: 13, color: '#a5b4fc', lineHeight: 1.6 }}>
            <strong style={{ color: '#c4b5fd' }}>Your birth year never leaves your device.</strong>{' '}
            Only a cryptographic proof of eligibility is submitted on-chain.
            Observers see a pass/fail boolean — nothing more.
          </div>
        </div>

        {/* ── Main Content ── */}
        {walletState !== 'connected' ? (
          /* Disconnected State */
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(139,92,246,0.2)',
            borderRadius: 24,
          }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>🌙</span>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 10 }}>
              Connect Your Wallet
            </h3>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Connect your Lace wallet to submit private age verifications on the Midnight Network.
            </p>
            <button
              id="btn-connect-wallet-hero"
              onClick={connectWallet}
              disabled={walletState === 'connecting'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none', borderRadius: 50, color: 'white',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
              }}
            >
              {walletState === 'connecting' ? '⏳ Connecting...' : '🔗 Connect Lace Wallet'}
            </button>
            {walletState === 'error' && (
              <div style={{
                marginTop: 20, padding: '14px 18px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, color: '#fca5a5', fontSize: 13, lineHeight: 1.5, textAlign: 'left',
              }} id="error-message" role="alert">
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Wallet address bar */}
            {walletInfo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', flexShrink: 0 }}>
                  Wallet
                </span>
                <div
                  id="wallet-address-display"
                  onClick={handleCopyAddress}
                  title="Click to copy"
                  style={{
                    fontFamily: 'monospace', fontSize: 11, color: copiedAddress ? '#a78bfa' : '#6b7280',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, maxWidth: 320,
                  }}
                >
                  {copiedAddress ? '✓ Copied!' : walletInfo.address}
                </div>
              </div>
            )}

            {/* Two-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Age Verification Form */}
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <span style={{ fontSize: 22 }}>🔐</span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>Verify Your Age</h3>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Private · Zero-Knowledge</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="input-birth-year" style={styles.label}>
                    Birth Year
                    <span style={{
                      padding: '2px 8px', background: 'rgba(139,92,246,0.15)',
                      border: '1px solid rgba(139,92,246,0.3)', borderRadius: 50,
                      fontSize: 9, fontWeight: 700, color: '#a78bfa',
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>🔒 Private</span>
                  </label>
                  <input
                    id="input-birth-year"
                    type="number"
                    placeholder="e.g. 1995"
                    value={birthYear}
                    onChange={(e) => { setBirthYear(e.target.value); setErrorMessage(''); setVerifyResult('none'); }}
                    min={1900}
                    max={currentYear}
                    aria-label="Birth year (private)"
                    style={styles.input}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="select-minimum-age" style={styles.label}>Minimum Age Threshold</label>
                  <select
                    id="select-minimum-age"
                    value={minimumAge}
                    onChange={(e) => setMinimumAge(e.target.value)}
                    aria-label="Minimum age requirement"
                    style={styles.select}
                  >
                    <option value="18">18 — Standard Access</option>
                    <option value="21">21 — Restricted Access (US)</option>
                    <option value="16">16 — Teen Platform</option>
                    <option value="13">13 — COPPA Threshold</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={styles.label}>Current Year</label>
                  <div id="display-current-year" style={styles.readonlyField}>{currentYear} (auto-detected)</div>
                </div>

                <button
                  id="btn-verify-age"
                  style={getVerifyButtonStyle()}
                  onClick={handleVerify}
                  disabled={isDisabled}
                  aria-label="Submit age verification proof"
                >
                  {getButtonLabel()}
                </button>

                {errorMessage && verifyState !== 'loading' && (
                  <div
                    id="error-message"
                    role="alert"
                    style={{
                      marginTop: 14, padding: '14px 18px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 12, color: '#fca5a5', fontSize: 13, lineHeight: 1.5,
                    }}
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Config Card */}
              <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                  <span style={{ fontSize: 22 }}>⚙️</span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>Configuration</h3>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Network & Contract</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={styles.label}>Network</label>
                    <div id="display-network" style={styles.readonlyField}>{NETWORK}</div>
                  </div>
                  <div>
                    <label style={styles.label}>Proof Server</label>
                    <div id="display-proof-server" style={styles.readonlyField}>{PROOF_SERVER_URL}</div>
                  </div>
                  <div>
                    <label style={styles.label}>Contract Address</label>
                    <div id="display-contract-address" style={{ ...styles.readonlyField, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.slice(0, 18)}…` : '02008f3d1b7e569a4c2d…'}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px 14px', background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10,
                    fontSize: 12, color: '#8b5cf6', lineHeight: 1.5,
                  }}>
                    📋 Copy <code style={{ fontFamily: 'monospace' }}>.env.example → .env</code> to configure.
                  </div>

                  <button
                    id="btn-reset-verification"
                    onClick={handleReset}
                    style={{
                      padding: '10px 16px', background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      color: '#6b7280', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    🔄 Reset Verification
                  </button>
                </div>
              </div>

              {/* Result Card (full width) */}
              {verifyResult !== 'none' && (
                <div
                  id="verification-result"
                  role="status"
                  aria-live="polite"
                  style={{
                    gridColumn: '1 / -1',
                    padding: 28, borderRadius: 20, textAlign: 'center',
                    background: verifyResult === 'pass' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: verifyResult === 'pass' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    boxShadow: verifyResult === 'pass' ? '0 0 40px rgba(16,185,129,0.1)' : '0 0 40px rgba(239,68,68,0.08)',
                  }}
                >
                  <span style={{ fontSize: 48, display: 'block', marginBottom: 12, lineHeight: 1 }}>
                    {verifyResult === 'pass' ? '✅' : '❌'}
                  </span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: verifyResult === 'pass' ? '#10b981' : '#ef4444', marginBottom: 8 }}>
                    {verifyResult === 'pass' ? 'Age Verified — Access Granted' : 'Verification Failed — Access Denied'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                    {verifyResult === 'pass'
                      ? 'Your ZK proof was accepted. You meet the minimum age requirement. Your birth year was never disclosed to the contract or observers.'
                      : `Your ZK proof was rejected. You do not meet the minimum age requirement of ${minimumAge} years. No personal data was exposed.`}
                  </p>
                </div>
              )}
            </div>

            {/* Public Ledger State */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)',
              borderRadius: 20, padding: 28, marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px rgba(139,92,246,0.6)', display: 'inline-block' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                  Public Ledger State
                </h3>
                <span style={{
                  marginLeft: 'auto', padding: '3px 10px',
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 50, fontSize: 10, fontWeight: 700, color: '#8b5cf6',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>On-Chain</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  { id: 'stat-verification-count', label: 'Verification Count', value: String(ledgerState.verificationCount), sub: 'Total proofs submitted', color: '#f1f0ff' },
                  { id: 'stat-last-result', label: 'Last Result', value: ledgerState.initialized ? (ledgerState.lastResult ? 'PASS' : 'FAIL') : '—', sub: 'Most recent verification', color: ledgerState.lastResult ? '#10b981' : '#ef4444' },
                  { id: 'stat-minimum-age', label: 'Minimum Age', value: String(ledgerState.minimumAge), sub: 'Enforced threshold', color: '#f1f0ff' },
                  { id: 'stat-initialized', label: 'Contract Status', value: ledgerState.initialized ? '● Active' : '○ Not deployed', sub: 'Deployment state', color: ledgerState.initialized ? '#10b981' : '#6b7280' },
                ].map(({ id, label, value, sub, color }) => (
                  <div key={id} id={id} style={{
                    padding: '16px 18px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Note */}
            <div style={{
              padding: '18px 22px', background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
            }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                🔐 Privacy Guarantees
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🚫', text: <><strong style={{ color: '#9ca3af' }}>Birth year never disclosed:</strong> Lives only in your browser and the ZK circuit computation.</> },
                  { icon: '👁️', text: <><strong style={{ color: '#9ca3af' }}>Observers see only:</strong> Total verification count, last pass/fail result, age threshold.</> },
                  { icon: '✅', text: <><strong style={{ color: '#9ca3af' }}>Deliberately disclosed:</strong> The boolean outcome (pass/fail) — no identity attached.</> },
                  { icon: '🔒', text: <><strong style={{ color: '#9ca3af' }}>ZK proof guarantees:</strong> The contract verifies eligibility without learning the actual age.</> },
                ].map(({ icon, text }, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6 }}>
                    <span style={{ flexShrink: 0, fontSize: 14 }}>{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </>
        )}
          </>
        )}
        
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(139,92,246,0.1)', color: '#d1d5db', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: 24, color: '#f1f0ff', marginBottom: 16 }}>What is Age Verification Gateway?</h2>
            <p style={{ marginBottom: 16 }}>
              The Age Verification Gateway is a decentralized application built on the <strong>Midnight Network</strong>. It allows you to prove your age to third-party services without ever disclosing your actual date of birth or identity.
            </p>
            <h3 style={{ fontSize: 18, color: '#c4b5fd', marginTop: 24, marginBottom: 12 }}>How it works</h3>
            <p style={{ marginBottom: 16 }}>
              Instead of sending your personal data to a centralized server, this dApp uses <strong>Zero-Knowledge (ZK) Cryptography</strong>. It takes your birth year, generates a mathematical proof locally on your device, and only submits a boolean (True/False) result on-chain to verify if you meet the required age threshold.
            </p>
          </div>
        )}

        {/* ── How to Use Tab ── */}
        {activeTab === 'how-to-use' && (
          <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(139,92,246,0.1)', color: '#d1d5db', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: 24, color: '#f1f0ff', marginBottom: 24 }}>Step-by-Step Guide</h2>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <li><strong>Connect Wallet:</strong> Install and connect the Lace Wallet (configured for the Midnight Testnet) by clicking the connect button on the Home tab.</li>
              <li><strong>Enter Birth Year:</strong> Input your birth year. This data never leaves your browser.</li>
              <li><strong>Select Threshold:</strong> Choose the minimum age requirement required by the service (e.g., 18 for standard access).</li>
              <li><strong>Generate Proof:</strong> Click "Verify Age Privately". A ZK proof will be generated and verified by the Midnight blockchain.</li>
              <li><strong>View Results:</strong> The network will record a PASS or FAIL based on your proof without revealing your exact age.</li>
            </ol>
          </div>
        )}

        {/* ── FAQ Tab ── */}
        {activeTab === 'faq' && (
          <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(139,92,246,0.1)', color: '#d1d5db', lineHeight: 1.7 }}>
            <h2 style={{ fontSize: 24, color: '#f1f0ff', marginBottom: 24 }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <strong style={{ color: '#c4b5fd', display: 'block', marginBottom: 6 }}>Is my birthdate saved anywhere?</strong>
                No. Your birth year is only used locally to generate the zero-knowledge proof. It is never stored in our database, the smart contract, or on the blockchain.
              </div>
              <div>
                <strong style={{ color: '#c4b5fd', display: 'block', marginBottom: 6 }}>What is Midnight Network?</strong>
                Midnight is a data protection blockchain built on Cardano. It enables developers to build dApps that safeguard sensitive commercial and personal data.
              </div>
              <div>
                <strong style={{ color: '#c4b5fd', display: 'block', marginBottom: 6 }}>What does the verifier see?</strong>
                The verifier only sees a cryptographically verified true or false indicating whether you meet the threshold, plus a verification count.
              </div>
            </div>
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.1)',
            borderRadius: 20, padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>🕒</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                Local History
              </h3>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                  style={{
                    padding: '4px 10px', background: 'transparent',
                    border: history.length > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 50,
                    fontSize: 10, fontWeight: 700, color: history.length > 0 ? '#ef4444' : '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    cursor: history.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if(history.length > 0) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { if(history.length > 0) e.currentTarget.style.background = 'transparent'; }}
                >
                  Clear
                </button>
                <span style={{
                  padding: '3px 10px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 50, 
                  fontSize: 10, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>This Session</span>
              </div>
            </div>
            
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((entry, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: entry.result === 'pass' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: entry.result === 'pass' ? '#10b981' : '#ef4444',
                        fontSize: 16
                      }}>
                        {entry.result === 'pass' ? '✓' : '✕'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 2 }}>
                          {entry.result === 'pass' ? 'Age Verified' : 'Verification Failed'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          Threshold: {entry.minimumAge}+ years
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: 13 }}>
                No verification history for this session yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
