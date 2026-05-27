import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * InstallAppButton
 * Renders a premium sidebar install button that appears only when the
 * browser's beforeinstallprompt event is available, and disappears
 * once the app has been installed.
 */
const InstallAppButton = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setInstalling(true);
      setTimeout(() => setInstalling(false), 8000);
    }
  };

  return (
    <>
      <button
        id="pwa-install-btn"
        onClick={handleInstall}
        disabled={installing}
        title="Install QuestionWhiz as a desktop app"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          width: '100%',
          padding: '10px 14px',
          marginBottom: '8px',
          border: 'none',
          borderRadius: '10px',
          background: installing
            ? 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: installing ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          letterSpacing: '0.2px',
        }}
        onMouseEnter={e => {
          if (!installing) {
            e.currentTarget.style.background =
              'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
            e.currentTarget.style.boxShadow =
              '0 6px 20px rgba(37,99,235,0.5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={e => {
          if (!installing) {
            e.currentTarget.style.background =
              'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
            e.currentTarget.style.boxShadow =
              '0 4px 14px rgba(37,99,235,0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Shimmer animation */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            animation: 'pwa-shimmer 2.5s infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Download / Spinner icon */}
        {installing ? (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'pwa-spin 0.9s linear infinite', flexShrink: 0 }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}

        <span style={{ whiteSpace: 'nowrap' }}>
          {installing ? 'Installing…' : 'Download App'}
        </span>

        {/* "Free" badge */}
        {!installing && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '9px',
            fontWeight: '700',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            padding: '2px 5px',
            letterSpacing: '0.5px',
            flexShrink: 0,
          }}>
            FREE
          </span>
        )}
      </button>

      {/* Success toast */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'pwa-slide-in 0.3s ease-out',
          fontFamily: "'Poppins', sans-serif",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          QuestionWhiz installed successfully!
        </div>
      )}

      {/* Install instructions (shown when native prompt is not available) */}
      {!isInstallable && !isInstalled && installing && (
        <div style={{
          padding: '10px 12px',
          marginBottom: '8px',
          borderRadius: '8px',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.12)',
          fontSize: '11px',
          color: '#475569',
          lineHeight: '1.55',
          fontFamily: "'Poppins', sans-serif",
          animation: 'pwa-slide-in 0.3s ease-out',
        }}>
          <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '4px' }}>
            📲 Install as Desktop App
          </strong>
          <div style={{ marginBottom: '2px' }}>
            <strong>Chrome / Edge:</strong> Click the <strong>⊕</strong> icon in the address bar → "Install"
          </div>
          <div>
            This creates a <strong>Desktop shortcut</strong> that opens QuestionWhiz as a standalone app — no zip needed!
          </div>
        </div>
      )}

      {/* Keyframes injected once */}
      <style>{`
        @keyframes pwa-shimmer {
          0%   { left: -100%; }
          60%  { left: 160%; }
          100% { left: 160%; }
        }
        @keyframes pwa-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pwa-slide-in {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallAppButton;
