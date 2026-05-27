import React, { useState } from 'react';

/**
 * DownloadAppButton
 * Always-visible sidebar button that downloads the QuestionWhiz
 * desktop application (.zip) when clicked.
 */
const DownloadAppButton = () => {
  const [clicked, setClicked] = useState(false);

  const handleDownload = () => {
    setClicked(true);
    const link = document.createElement('a');
    link.href = '/QuestionWhizSetup.exe';
    link.download = 'QuestionWhizSetup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setClicked(false), 6000);
  };

  return (
    <>
      <button
        id="download-app-btn"
        onClick={handleDownload}
        title="Download QuestionWhiz Desktop App"
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
          {clicked ? 'Downloading…' : 'Download App'}
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

      {/* Post-download helper */}
      {clicked && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '8px',
          borderRadius: '8px',
          background: 'rgba(22, 163, 74, 0.08)',
          border: '1px solid rgba(22, 163, 74, 0.15)',
          fontSize: '11px',
          color: '#475569',
          lineHeight: '1.5',
          fontFamily: "'Poppins', sans-serif",
          animation: 'dl-fade-in 0.3s ease-out',
        }}>
          <strong style={{ color: '#16a34a' }}>✓ Download started!</strong><br />
          Extract the zip → Run <strong>QuestionWhiz.exe</strong>
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
