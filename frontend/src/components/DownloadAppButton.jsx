import React, { useState, useEffect, useRef } from 'react';

/**
 * DownloadAppButton
 * Always-visible sidebar button. When PWA install prompt is available,
 * it installs the app as a web application (creates a Desktop shortcut).
 * Otherwise it shows the user how to install from their browser menu.
 */
const DownloadAppButton = () => {
  const [clicked, setClicked] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredPrompt = useRef(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    });

    // Check if running as standalone PWA already
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = async () => {
    if (canInstall && deferredPrompt.current) {
      // Trigger native PWA install prompt
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setCanInstall(false);
      }
      deferredPrompt.current = null;
    } else {
      // Show instructions
      setClicked(true);
      setTimeout(() => setClicked(false), 8000);
    }
  };

  if (installed) return null;

  return (
    <>
      <button
        id="download-app-btn"
        onClick={handleClick}
        title="Install QuestionWhiz on your Desktop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          width: '100%',
          padding: '10px 14px',
          marginBottom: clicked ? '4px' : '8px',
          border: 'none',
          borderRadius: '10px',
          background: clicked
            ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: clicked
            ? '0 4px 14px rgba(22,163,74,0.35)'
            : '0 4px 14px rgba(37,99,235,0.35)',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          letterSpacing: '0.2px',
        }}
        onMouseEnter={e => {
          if (!clicked) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={e => {
          if (!clicked) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Shimmer */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            animation: 'dl-shimmer 2.5s infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Icon */}
        {clicked ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}

        <span style={{ whiteSpace: 'nowrap' }}>
          {clicked ? 'See below ↓' : 'Install App'}
        </span>

        {/* Badge */}
        {!clicked && (
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

      {/* Install instructions (shown when native prompt is not available) */}
      {clicked && (
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
          animation: 'dl-fade-in 0.3s ease-out',
        }}>
          <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '4px' }}>
            📲 Install as Desktop App
          </strong>
          <div style={{ marginBottom: '2px' }}>
            <strong>Chrome / Edge:</strong> Click the <strong>⊕</strong> icon in the address bar → "Install"
          </div>
          <div>
            This creates a <strong>Desktop shortcut</strong> that opens QuestionWhiz as a standalone app — no zip or exe needed!
          </div>
        </div>
      )}

      <style>{`
        @keyframes dl-shimmer {
          0%   { left: -100%; }
          60%  { left: 160%; }
          100% { left: 160%; }
        }
        @keyframes dl-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default DownloadAppButton;
