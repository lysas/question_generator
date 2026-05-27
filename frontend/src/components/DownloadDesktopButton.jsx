import React, { useState } from 'react';

const DownloadDesktopButton = () => {
  const [clicked, setClicked] = useState(false);

  const handleDownload = () => {
    setClicked(true);
    // Direct download link to the zip file in the public directory
    const link = document.createElement('a');
    link.href = '/QuestionWhiz-Windows.zip';
    link.download = 'QuestionWhiz-Windows.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset after 8 seconds
    setTimeout(() => setClicked(false), 8000);
  };

  return (
    <>
      <button
        onClick={handleDownload}
        title="Download QuestionWhiz Desktop App for Windows"
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
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: clicked
            ? '0 4px 14px rgba(22,163,74,0.35)'
            : '0 4px 14px rgba(15, 23, 42, 0.25)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          letterSpacing: '0.2px',
        }}
        onMouseEnter={e => {
          if (!clicked) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={e => {
          if (!clicked) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Subtle shimmer effect */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            animation: 'desktop-shimmer 3s infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Icon: checkmark when clicked, monitor when not */}
        {clicked ? (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )}

        <span style={{ whiteSpace: 'nowrap' }}>
          {clicked ? 'Downloading…' : 'Download Desktop'}
        </span>

        {/* Windows tag */}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '9px',
            fontWeight: '700',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '4px',
            padding: '2px 5px',
            letterSpacing: '0.5px',
            color: clicked ? '#bbf7d0' : '#38bdf8',
            flexShrink: 0,
          }}
        >
          WIN
        </span>
      </button>

      {/* Post-download instructions */}
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
          animation: 'desktop-fade-in 0.3s ease-out',
        }}>
          <strong style={{ color: '#16a34a' }}>✓ Download started!</strong><br />
          Extract the zip → Open the folder → Run <strong>QuestionWhiz.exe</strong>
        </div>
      )}

      <style>{`
        @keyframes desktop-shimmer {
          0%   { left: -100%; }
          50%  { left: 160%; }
          100% { left: 160%; }
        }
        @keyframes desktop-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default DownloadDesktopButton;
