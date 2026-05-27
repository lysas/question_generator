import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWandMagicSparkles, 
  faHistory, 
  faKey, 
  faSignOutAlt, 
  faSignInAlt, 
  faUserPlus, 
  faChartBar, 
  faSlidersH, 
  faBrain, 
  faLightbulb,
  faDatabase,
  faEye,
  faEyeSlash,
  faTrash,
  faShieldHalved,
  faLock,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer, Header, Footer, AlignmentType, PageNumber, LineRuleType, ShadingType, Table, TableRow, TableCell, WidthType, HeightRule } from "docx";
import { saveAs } from "file-saver";

import QuestionWhiz from './components/QuestionWhiz';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { authService } from './components/Authentication/authService';
import InstallAppButton from './components/InstallAppButton';

const DashboardLayout = ({ children, user, handleLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    return location.pathname.startsWith(path);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div className="d-flex align-items-center gap-2">
          <button 
            className="btn p-1 border-0" 
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: '#1e293b' }}
          >
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
          <div className="rounded-3 p-1.5 d-flex align-items-center justify-content-center" style={{ 
            backgroundColor: '#1A5AFF',
            width: '32px',
            height: '32px'
          }}>
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="20" y1="50" x2="50" y2="20" stroke="white" strokeWidth="18" strokeLinecap="round" />
              <line x1="20" y1="80" x2="50" y2="50" stroke="white" strokeWidth="18" strokeLinecap="round" />
              <line x1="50" y1="80" x2="80" y2="50" stroke="white" strokeWidth="18" strokeLinecap="round" />
              <circle cx="20" cy="20" r="10" fill="white" />
              <circle cx="50" cy="20" r="10" fill="white" />
              <circle cx="80" cy="20" r="10" fill="white" />
              <circle cx="20" cy="50" r="10" fill="white" />
              <circle cx="50" cy="50" r="10" fill="white" />
              <circle cx="80" cy="50" r="10" fill="white" />
              <circle cx="20" cy="80" r="10" fill="white" />
              <circle cx="50" cy="80" r="10" fill="white" />
              <circle cx="80" cy="80" r="10" fill="white" />
            </svg>
          </div>
          <span className="fw-bold" style={{ color: '#1A5AFF', fontSize: '18px', fontFamily: "'Poppins', sans-serif" }}>
            QuestionWhiz
          </span>
        </div>
        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ 
          width: '32px', 
          height: '32px', 
          backgroundColor: '#1A5AFF',
          fontSize: '12px'
        }}>
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="p-4 d-flex flex-column h-100">
          <div className="d-flex align-items-center justify-content-between mb-5 gap-2 px-2" style={{ transition: 'all 0.3s' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ 
                backgroundColor: '#1A5AFF',
                boxShadow: '0 4px 12px rgba(26, 90, 255, 0.25)',
                width: '40px',
                height: '40px'
              }}>
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="20" y1="50" x2="50" y2="20" stroke="white" strokeWidth="18" strokeLinecap="round" />
                  <line x1="20" y1="80" x2="50" y2="50" stroke="white" strokeWidth="18" strokeLinecap="round" />
                  <line x1="50" y1="80" x2="80" y2="50" stroke="white" strokeWidth="18" strokeLinecap="round" />
                  <circle cx="20" cy="20" r="10" fill="white" />
                  <circle cx="50" cy="20" r="10" fill="white" />
                  <circle cx="80" cy="20" r="10" fill="white" />
                  <circle cx="20" cy="50" r="10" fill="white" />
                  <circle cx="50" cy="50" r="10" fill="white" />
                  <circle cx="80" cy="50" r="10" fill="white" />
                  <circle cx="20" cy="80" r="10" fill="white" />
                  <circle cx="50" cy="80" r="10" fill="white" />
                  <circle cx="80" cy="80" r="10" fill="white" />
                </svg>
              </div>
              <span className="fs-4 fw-bold" style={{ 
                color: '#1A5AFF', 
                letterSpacing: '0.5px',
                fontFamily: "'Poppins', sans-serif"
              }}>
                QuestionWhiz
              </span>
            </div>
            
            {/* Close button visible on mobile/tablet */}
            <button 
              className="btn d-lg-none p-1 border-0" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#64748b' }}
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          <div className="flex-grow-1">
            <ul className="nav flex-column gap-2" style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li className="nav-item">
                <Link to="/" className={`nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 hover-sidebar ${isActive('/') ? 'active-sidebar' : ''}`} style={{ color: '#475569', fontWeight: '500', transition: 'all 0.25s' }}>
                  <FontAwesomeIcon icon={faChartBar} className={isActive('/') ? 'text-primary' : 'text-secondary'} style={{ width: '20px', transition: 'all 0.2s' }} />
                  <span>Dashboard Overview</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/generator" className={`nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 hover-sidebar ${isActive('/generator') ? 'active-sidebar' : ''}`} style={{ color: '#475569', fontWeight: '500', transition: 'all 0.25s' }}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className={isActive('/generator') ? 'text-primary' : 'text-secondary'} style={{ width: '20px', transition: 'all 0.2s' }} />
                  <span>AI Generator</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/history" className={`nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 hover-sidebar ${isActive('/history') ? 'active-sidebar' : ''}`} style={{ color: '#475569', fontWeight: '500', transition: 'all 0.25s' }}>
                  <FontAwesomeIcon icon={faHistory} className={isActive('/history') ? 'text-primary' : 'text-secondary'} style={{ width: '20px', transition: 'all 0.2s' }} />
                  <span>Quiz History</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Install Web App Button */}
          <div className="px-1 mb-2">
            <InstallAppButton />
          </div>

          {/* User Card & Logout */}
          <div className="mt-auto pt-4 border-top" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-4" style={{ 
              background: 'linear-gradient(135deg, rgba(26, 90, 255, 0.02) 0%, rgba(26, 90, 255, 0.06) 100%)',
              border: '1px solid rgba(26, 90, 255, 0.08)',
              boxShadow: '0 4px 15px rgba(26, 90, 255, 0.03)'
            }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#1A5AFF',
                fontSize: '14px',
                border: '2px solid #ffffff'
              }}>
                {(user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden" style={{ maxWidth: '150px' }}>
                <div className="fw-semibold" style={{ color: '#1e293b', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'User'}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
              </div>
            </div>
            <button className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-1" style={{ 
              borderRadius: '6px', 
              fontWeight: '500',
              padding: '4px 14px',
              fontSize: '12px',
              borderColor: 'rgba(220, 38, 38, 0.15)',
              transition: 'all 0.2s',
              width: 'auto',
              margin: '0 auto'
            }} onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '11px' }} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-container">
        {children}
      </div>

      {/* Sidebar Hover, Active, and Responsive Styles */}
      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: 'Poppins', sans-serif;
          width: 100%;
        }
        
        .sidebar-container {
          width: 280px;
          background-color: #ffffff;
          border-right: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.015);
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }
        
        .content-container {
          flex-grow: 1;
          padding: 48px;
          max-width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        
        .mobile-header {
          display: none;
          background-color: #ffffff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding: 12px 20px;
          position: sticky;
          top: 0;
          z-index: 99;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
          width: 100%;
        }
        
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1040;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .hover-sidebar {
          border-left: 3px solid transparent;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .hover-sidebar:hover {
          background-color: rgba(26, 90, 255, 0.02);
          border-left-color: rgba(26, 90, 255, 0.3);
          color: #1A5AFF !important;
          transform: translateX(4px);
        }
        .hover-sidebar:hover svg {
          color: #1A5AFF !important;
        }
        .hover-sidebar.active-sidebar {
          background-color: rgba(26, 90, 255, 0.06);
          border-left-color: #1A5AFF;
          color: #1A5AFF !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(26, 90, 255, 0.02);
        }
        .hover-sidebar.active-sidebar svg {
          color: #1A5AFF !important;
        }
        
        .card-custom {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.005);
          border-radius: 16px;
          color: #1e293b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-custom:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(26, 90, 255, 0.04), 0 1px 3px rgba(26, 90, 255, 0.01);
          border-color: rgba(26, 90, 255, 0.15);
        }
        .form-control-custom {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #1e293b !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          transition: all 0.2s !important;
        }
        .form-control-custom:focus {
          border-color: #1A5AFF !important;
          box-shadow: 0 0 0 3px rgba(26, 90, 255, 0.1) !important;
        }
        
        @media (max-width: 991px) {
          .dashboard-container {
            flex-direction: column;
          }
          .sidebar-container {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 1050;
            box-shadow: 10px 0 30px rgba(15, 23, 42, 0.08);
          }
          .sidebar-container.open {
            transform: translateX(0);
          }
          .content-container {
            padding: 24px;
            min-height: calc(100vh - 57px);
          }
          .mobile-header {
            display: flex;
          }
        }
        
        @media (max-width: 576px) {
          .content-container {
            padding: 16px 12px;
          }
        }
      `}</style>
    </div>
  );
};

// Overview dashboard home view
const DashboardOverview = ({ user }) => {
  const [historyCount, setHistoryCount] = useState(0);
  const [recentHistory, setRecentHistory] = useState([]);
  const emailPrefix = user?.email ? `${user.email}_` : "";
  const openApiKeySet = !!(localStorage.getItem(`${emailPrefix}openai_api_key`));
  const geminiApiKeySet = !!(localStorage.getItem(`${emailPrefix}gemini_api_key`));
  const grokApiKeySet = !!(localStorage.getItem(`${emailPrefix}grok_api_key`));
  const mistralApiKeySet = !!(localStorage.getItem(`${emailPrefix}mistral_api_key`));
  const anyApiKeySet = openApiKeySet || geminiApiKeySet || grokApiKeySet || mistralApiKeySet;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${emailPrefix}quiz_history`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistoryCount(parsed.length);
        setRecentHistory(parsed.slice(0, 3));
      }
    } catch {}
  }, [emailPrefix]);

  return (
    <div>
      <h2 className="fw-bold mb-1" style={{ color: '#181d38' }}>Welcome to QuestionWhiz</h2>
      <p className="text-secondary mb-4">Launch generating tests, quizzes and practice papers using your own AI provider keys.</p>

      {/* Compact Grid for Overview Cards */}
      <div className="mb-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {/* Generations Run */}
        <div className="card card-custom p-3 d-flex flex-column justify-content-between" style={{ minHeight: '145px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <div>
            <div className="text-secondary small mb-1" style={{ fontWeight: '500', fontSize: '12px' }}>Generations Run</div>
            <div className="fs-3 fw-bold mb-1" style={{ color: '#1e293b', fontFamily: "'Poppins', sans-serif" }}>{historyCount}</div>
          </div>
          <Link to="/history" className="text-primary text-decoration-none fw-semibold align-self-start" style={{ fontSize: '12px' }}>
            View history &rarr;
          </Link>
        </div>

        {/* OpenAI Key */}
        <div className="card card-custom p-3 d-flex flex-column justify-content-between" style={{ minHeight: '145px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <div>
            <div className="text-secondary small mb-1" style={{ fontWeight: '500', fontSize: '12px' }}>OpenAI API Key</div>
            <span className={`badge ${openApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-1 rounded-pill`} style={{ fontSize: '10px', fontWeight: '600' }}>
              {openApiKeySet ? 'Configured' : 'Missing'}
            </span>
          </div>
          <Link to="/generator" className="text-primary text-decoration-none fw-semibold align-self-start" style={{ fontSize: '12px' }}>
            Configure &rarr;
          </Link>
        </div>

        {/* Gemini Key */}
        <div className="card card-custom p-3 d-flex flex-column justify-content-between" style={{ minHeight: '145px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <div>
            <div className="text-secondary small mb-1" style={{ fontWeight: '500', fontSize: '12px' }}>Gemini API Key</div>
            <span className={`badge ${geminiApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-1 rounded-pill`} style={{ fontSize: '10px', fontWeight: '600' }}>
              {geminiApiKeySet ? 'Configured' : 'Missing'}
            </span>
          </div>
          <Link to="/generator" className="text-primary text-decoration-none fw-semibold align-self-start" style={{ fontSize: '12px' }}>
            Configure &rarr;
          </Link>
        </div>

        {/* Groq Key */}
        <div className="card card-custom p-3 d-flex flex-column justify-content-between" style={{ minHeight: '145px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <div>
            <div className="text-secondary small mb-1" style={{ fontWeight: '500', fontSize: '12px' }}>Groq API Key</div>
            <span className={`badge ${grokApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-1 rounded-pill`} style={{ fontSize: '10px', fontWeight: '600' }}>
              {grokApiKeySet ? 'Configured' : 'Missing'}
            </span>
          </div>
          <Link to="/generator" className="text-primary text-decoration-none fw-semibold align-self-start" style={{ fontSize: '12px' }}>
            Configure &rarr;
          </Link>
        </div>

        {/* Mistral Key */}
        <div className="card card-custom p-3 d-flex flex-column justify-content-between" style={{ minHeight: '145px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
          <div>
            <div className="text-secondary small mb-1" style={{ fontWeight: '500', fontSize: '12px' }}>Mistral API Key</div>
            <span className={`badge ${mistralApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-1 rounded-pill`} style={{ fontSize: '10px', fontWeight: '600' }}>
              {mistralApiKeySet ? 'Configured' : 'Missing'}
            </span>
          </div>
          <Link to="/generator" className="text-primary text-decoration-none fw-semibold align-self-start" style={{ fontSize: '12px' }}>
            Configure &rarr;
          </Link>
        </div>
      </div>

      {/* Compact Horizontal Generator CTA Banner */}
      <div className="card card-custom p-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mt-4" style={{ 
        border: '1px dashed rgba(67, 97, 238, 0.25)', 
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)'
      }}>
        <div className="d-flex align-items-center gap-3 text-center text-md-start flex-column flex-md-row">
          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 animate-badge" style={{ width: '48px', height: '48px', backgroundColor: '#e6ecff', color: '#4361ee' }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} size="sm" />
          </div>
          <div>
            <h5 className="fw-bold mb-1" style={{ color: '#181d38', fontSize: '16px' }}>Ready to generate new questions?</h5>
            <p className="text-secondary mb-0 small" style={{ maxWidth: '520px', fontSize: '12.5px' }}>
              Upload documents, input topics, scrape web links, or insert media content to build comprehensive exam sheets in seconds.
            </p>
          </div>
        </div>
        <Link to="/generator" className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm flex-shrink-0 animate-slide-up" style={{ 
          backgroundColor: '#4361ee', 
          borderColor: '#4361ee',
          fontSize: '13px',
          height: 'fit-content'
        }}>
          Open AI Generator
        </Link>
      </div>

      {/* Recent Generations */}
      {recentHistory.length > 0 && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: '#181d38', fontSize: '15px' }}>Recent Generations</h5>
            <Link to="/history" className="text-primary text-decoration-none fw-semibold" style={{ fontSize: '12.5px' }}>
              View all history &rarr;
            </Link>
          </div>
          <div className="card card-custom p-0 overflow-hidden" style={{ border: '1px solid rgba(0, 0, 0, 0.04)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="px-4 py-3" style={{ borderBottom: 'none' }}>Topic</th>
                    <th className="py-3" style={{ borderBottom: 'none' }}>Type</th>
                    <th className="py-3" style={{ borderBottom: 'none' }}>Difficulty</th>
                    <th className="py-3" style={{ borderBottom: 'none' }}>Bloom Level</th>
                    <th className="py-3" style={{ borderBottom: 'none' }}>Date</th>
                    <th className="pe-4 py-3 text-end" style={{ borderBottom: 'none' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 fw-semibold" style={{ color: '#181d38' }}>{item.topic || 'General Topic'}</td>
                      <td className="py-3 text-secondary">{item.type || 'MCQ'}</td>
                      <td className="py-3">
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
                          {item.difficulty || 'Easy'}
                        </span>
                      </td>
                      <td className="py-3 text-secondary">{item.bloom || 'Not Specified'}</td>
                      <td className="py-3 text-secondary">{item.date || 'Today'}</td>
                      <td className="pe-4 py-3 text-end">
                        <Link to="/history" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold" style={{ fontSize: '11px', borderColor: 'rgba(26, 90, 255, 0.15)', color: '#1A5AFF' }}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started / Quick Onboarding Guide */}
      {recentHistory.length === 0 && (
        <div className="mt-5">
          <h5 className="fw-bold mb-3" style={{ color: '#181d38', fontSize: '15px' }}>Getting Started</h5>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div className="card card-custom p-4" style={{ border: '1px solid rgba(0, 0, 0, 0.04)', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e6f4ea', color: '#137333', fontSize: '15px', fontWeight: 'bold' }}>1</div>
                <h6 className="fw-bold mb-0" style={{ color: '#181d38', fontSize: '14px' }}>Configure API Key</h6>
              </div>
              <p className="text-secondary small mb-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>Go to the Generator page and add your API key (Gemini, OpenAI, Groq, or Mistral) to start generating questions.</p>
              <Link to="/generator" className="text-primary text-decoration-none fw-semibold small" style={{ fontSize: '12px' }}>
                Configure Keys &rarr;
              </Link>
            </div>

            <div className="card card-custom p-4" style={{ border: '1px solid rgba(0, 0, 0, 0.04)', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e8f0fe', color: '#1a73e8', fontSize: '15px', fontWeight: 'bold' }}>2</div>
                <h6 className="fw-bold mb-0" style={{ color: '#181d38', fontSize: '14px' }}>Select Input Source</h6>
              </div>
              <p className="text-secondary small mb-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>Choose how to provide source content: paste paragraphs, upload PDF/Word documents, enter topics, or upload media files.</p>
              <Link to="/generator" className="text-primary text-decoration-none fw-semibold small" style={{ fontSize: '12px' }}>
                Choose Source &rarr;
              </Link>
            </div>

            <div className="card card-custom p-4" style={{ border: '1px solid rgba(0, 0, 0, 0.04)', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fef7e0', color: '#b06000', fontSize: '15px', fontWeight: 'bold' }}>3</div>
                <h6 className="fw-bold mb-0" style={{ color: '#181d38', fontSize: '14px' }}>Generate & Export</h6>
              </div>
              <p className="text-secondary small mb-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>Click Generate, review formatted questions in the preview panel, and instantly download them as a polished PDF or DOCX file.</p>
              <Link to="/generator" className="text-primary text-decoration-none fw-semibold small" style={{ fontSize: '12px' }}>
                Start Generation &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quiz History View
const QuizHistory = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadWithOptions, setDownloadWithOptions] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState("pdf"); // 'pdf' or 'docx'
  const [quizToDownload, setQuizToDownload] = useState(null);
  const { addNotification } = useNotifications();
  const emailPrefix = user?.email ? `${user.email}_` : "";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${emailPrefix}quiz_history`) || "[]";
      setHistory(JSON.parse(stored));
    } catch {}
  }, [emailPrefix]);

  const handleDelete = (indexToDelete) => {
    if (window.confirm("Are you sure you want to delete this quiz from your history?")) {
      const historyKey = `${emailPrefix}quiz_history`;
      const updated = history.filter((_, idx) => idx !== indexToDelete);
      setHistory(updated);
      localStorage.setItem(historyKey, JSON.stringify(updated));
      addNotification("Quiz deleted from history.", "info");
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire quiz history? This cannot be undone.")) {
      const historyKey = `${emailPrefix}quiz_history`;
      setHistory([]);
      localStorage.removeItem(historyKey);
      addNotification("Quiz history cleared.", "info");
    }
  };

  const stripOptions = (txt) => {
    if (!txt) return "";
    let lines = txt.split("\n");
    let filteredLines = [];
    let skipRemaining = false;

    for (let line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Skip everything after answer key headers
      if (
        lower.startsWith("answer:") ||
        lower.startsWith("answers:") ||
        lower.startsWith("correct answer:") ||
        lower.startsWith("correct answers:") ||
        lower.startsWith("answer key:") ||
        lower.startsWith("answers key:") ||
        lower.startsWith("key:")
      ) {
        if (lower.includes("key") || lower.includes("answers") || trimmed.endsWith(":") || trimmed.length < 25) {
          skipRemaining = true;
          continue;
        }
      }

      if (skipRemaining) continue;

      // Skip lines indicating answers or explanations
      if (
        lower.startsWith("correct answer") ||
        lower.startsWith("correct option") ||
        lower.startsWith("answer:") ||
        lower.startsWith("explanation:") ||
        lower.startsWith("explanations:")
      ) {
        continue;
      }

      filteredLines.push(line);
    }
    return filteredLines.join("\n");
  };

  const downloadHistoryPDF = (quiz, withAnswers = true) => {
    if (!quiz || !quiz.raw_text) return;
    let text = quiz.raw_text;
    if (!withAnswers) {
      text = stripOptions(text);
    }

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // HEADER
    const headerBarHeight = 7;
    const headerCurveRadius = 14;
    // FOOTER
    const footerBarHeight = 7;
    const footerCurveRadius = 20;
    // Margins
    const marginX = 0;
    const marginY = 0;
    const maxWidth = pageWidth - 2 * 20;
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = 7;
    let y = headerBarHeight + 30;
    let pageNum = 1;
    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const currentDate = new Date().toLocaleDateString();

    function drawHeaderFooter(pageNum) {
      // HEADER: Bold blue bar with right half-circle flush right
      pdf.setFillColor(26, 90, 255); // #1A5AFF
      pdf.rect(0, marginY, pageWidth, headerBarHeight, "F");
      pdf.circle(pageWidth, marginY + headerBarHeight / 2, headerCurveRadius, "F");

      // FOOTER: Thin orange bar with left half-circle flush left
      pdf.setFillColor(246, 144, 80); // #F69050
      pdf.circle(0, pageHeight - footerBarHeight / 2, footerCurveRadius, "F");
      pdf.rect(0, pageHeight - footerBarHeight, pageWidth, footerBarHeight, "F");

      // FOOTER TEXTS (disclaimer, date, website) - above orange line
      const footerTextY = pageHeight - footerBarHeight - 8;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        "Disclaimer: AI-generated papers on Lysa Solutions are for practice only; accuracy isn’t guaranteed—use at your own discretion.",
        pageWidth / 2,
        footerTextY,
        { align: "center" }
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(
        `Generated on: ${currentDate} | Page ${pageNum} | ID: ${uniqueId}`,
        footerCurveRadius + 10,
        footerTextY + 7
      );
      pdf.text(
        "https://lysasolutions.com/",
        pageWidth - 8,
        footerTextY + 7,
        { align: "right" }
      );
    }

    function drawWatermark() {
      pdf.saveGraphicsState();
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(36);
      pdf.text("LYSA Solutions", pageWidth / 2, pageHeight / 2, null, 45);
      pdf.restoreGraphicsState();
    }

    drawHeaderFooter(pageNum);
    drawWatermark();

    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - footerBarHeight - 25) {
        pdf.addPage();
        pageNum++;
        drawHeaderFooter(pageNum);
        drawWatermark();
        y = headerBarHeight + 30;
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(lines[i], marginX + headerCurveRadius + 5, y);
      y += lineHeight;
    }

    const filename = `${(quiz.topic || "quiz").toLowerCase().replace(/[^a-z0-9]+/g, "_")}_questions.pdf`;
    pdf.save(filename);
    addNotification("PDF downloaded successfully!", "success");
  };

  const downloadHistoryDOCX = (quiz, withAnswers = true) => {
    if (!quiz || !quiz.raw_text) return;
    let outputText = quiz.raw_text;
    if (!withAnswers) {
      outputText = stripOptions(outputText);
    }
    const currentDate = new Date().toLocaleDateString();
    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      // Create header with blue bar (table, full width)
      const header = new Header({
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "1A5AFF",
                      color: "1A5AFF",
                      type: ShadingType.SOLID,
                    },
                    children: [new Paragraph({ text: " " })],
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  }),
                ],
                height: { value: 400, rule: HeightRule.EXACT },
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "LYSA Solutions - Generated Questions",
                size: 24,
                bold: true
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 }
          })
        ]
      });

      // Create watermark
      const watermark = new Paragraph({
        children: [
          new TextRun({
            text: "LYSA Solutions",
            color: "D3D3D3",  // Light gray
            size: 72,
            bold: true
          })
        ],
        alignment: AlignmentType.CENTER,
        floating: {
          rotation: 315  // 45-degree rotation
        }
      });

      // Create footer with disclaimer and orange bar (table, full width)
      const footer = new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Disclaimer: AI-generated papers on Lysa Solutions are for practice only; accuracy isn't guaranteed—use at your own discretion.",
                size: 18,
                italics: true
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${currentDate} | Page `,
                size: 22
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                size: 22
              }),
              new TextRun({
                text: ` | ID: ${uniqueId}`,
                size: 22
              }),
              new TextRun({
                text: "    https://lysasolutions.com/",
                size: 22
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: {
                      fill: "F69050",
                      color: "F69050",
                      type: ShadingType.SOLID,
                    },
                    children: [new Paragraph({ text: " " })],
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  }),
                ],
                height: { value: 400, rule: HeightRule.EXACT },
              }),
            ],
          })
        ]
      });

      // Process text into questions and options
      const lines = outputText.split('\n').filter(line => line.trim());
      const questions = [];
      let currentQuestion = [];

      lines.forEach(line => {
        if (line.match(/^\d+\./)) { // This is a question
          if (currentQuestion.length > 0) {
            questions.push(currentQuestion);
          }
          currentQuestion = [line];
        } else { // This is an option or continuation of the question
          currentQuestion.push(line);
        }
      });
      if (currentQuestion.length > 0) {
        questions.push(currentQuestion);
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720,     // 0.5 inch
                right: 720,   // 0.5 inch
                bottom: 720,  // 0.5 inch
                left: 720     // 0.5 inch
              },
              size: {
                width: 12240,  // 8.5 inches
                height: 15840  // 11 inches
              }
            }
          },
          headers: {
            default: header
          },
          children: [
            watermark,
            ...questions.flatMap(questionGroup => {
              const [question, ...options] = questionGroup;
              return [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: question,
                      size: 24,
                      font: "Helvetica"
                    })
                  ],
                  spacing: { before: 240, after: 240, line: 360, lineRule: LineRuleType.AUTO }
                }),
                ...options.map(option =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `    ${option}`,
                        size: 24,
                        font: "Helvetica"
                      })
                    ],
                    spacing: { before: 120, after: 120, line: 360, lineRule: LineRuleType.AUTO },
                    indent: { left: 720 }
                  })
                )
              ];
            })
          ],
          footers: {
            default: footer
          }
        }]
      });

      Packer.toBlob(doc).then(blob => {
        const filename = `${(quiz.topic || "quiz").toLowerCase().replace(/[^a-z0-9]+/g, "_")}_questions.docx`;
        saveAs(blob, filename);
        addNotification("DOCX downloaded successfully!", "success");
      });
    } catch (error) {
      console.error("DOCX generation error:", error);
      addNotification("Error generating DOCX file. Please try again.", "error");
    }
  };

  const triggerHistoryDownload = () => {
    setDownloadModalOpen(false);
    if (!quizToDownload) return;
    if (downloadFormat === "pdf") {
      downloadHistoryPDF(quizToDownload, downloadWithOptions);
    } else {
      downloadHistoryDOCX(quizToDownload, downloadWithOptions);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#181d38' }}>Quiz History</h2>
          <p className="text-secondary mb-0">View your previously generated quizzes and export or review them.</p>
        </div>
        {history.length > 0 && (
          <button 
            className="btn btn-outline-danger btn-sm rounded-pill px-4 py-2" 
            onClick={handleClearAll}
            style={{ fontWeight: '600', transition: 'all 0.2s' }}
          >
            Clear All History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card card-custom p-5 text-center text-secondary">
          <FontAwesomeIcon icon={faDatabase} size="2x" className="mb-3 text-muted" />
          <p className="mb-0">No quizzes generated yet. Launch your first generation using the AI Generator!</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {history.map((item, index) => (
            <div key={index} className="card card-custom p-4 d-flex flex-row justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#181d38' }}>{item.topic || 'General Topic'}</h5>
                <div className="text-secondary small">
                  Type: {item.type} | Bloom Level: {item.bloom} | Difficulty: {item.difficulty}
                </div>
                {item.source && (
                  <div className="small fw-semibold mt-1" style={{ color: '#4361ee' }}>
                    Source: <span className="text-secondary fw-normal">{item.source}</span>
                  </div>
                )}
                <div className="text-secondary small mt-1">{item.date}</div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => {
                  setSelectedQuiz(item);
                }}>View Details</button>
                <button className="btn btn-outline-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-1" onClick={() => handleDelete(index)}>
                  <FontAwesomeIcon icon={faTrash} size="sm" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Details Modal */}
      {selectedQuiz && (
        <div 
          className="modal-overlay d-flex align-items-center justify-content-center"
          onClick={() => setSelectedQuiz(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            className="card card-custom p-4 shadow-lg border-0"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '700px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
              <div>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary px-3 py-1.5 rounded-pill fw-semibold animate-badge" style={{ fontSize: '11px' }}>
                    {selectedQuiz.type} • {selectedQuiz.bloom} • {selectedQuiz.difficulty}
                  </span>
                  {selectedQuiz.source && (
                    <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill fw-semibold animate-badge" style={{ fontSize: '11px' }}>
                      {selectedQuiz.source}
                    </span>
                  )}
                </div>
                <h4 className="fw-bold mb-1" style={{ color: '#181d38' }}>{selectedQuiz.topic || 'General Topic'}</h4>
                <div className="text-secondary small fw-medium">{selectedQuiz.date}</div>
              </div>
              <button 
                type="button" 
                className="btn-close shadow-none hover-close" 
                onClick={() => setSelectedQuiz(null)}
                style={{
                  padding: '10px',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            {/* Modal Body */}
            <div className="flex-grow-1 overflow-auto pe-1 mb-3" style={{ maxHeight: '55vh' }}>
              <div 
                className="p-4 rounded-4" 
                style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid rgba(0, 0, 0, 0.03)',
                  fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                  fontSize: '14px',
                  color: '#334155',
                  lineHeight: '1.6'
                }}
              >
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word', 
                  margin: 0,
                  fontFamily: 'inherit'
                }}>
                  {selectedQuiz.raw_text || "No saved output raw text found"}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="d-flex gap-2 justify-content-end mt-auto pt-3 border-top flex-wrap" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
              <button 
                className="btn btn-outline-secondary rounded-pill px-4" 
                onClick={() => {
                  navigator.clipboard.writeText(selectedQuiz.raw_text || "");
                  addNotification("Quiz questions copied to clipboard!", "success");
                }}
                style={{ fontWeight: '600', transition: 'all 0.2s' }}
              >
                Copy to Clipboard
              </button>
              <button 
                className="btn btn-outline-primary rounded-pill px-4" 
                onClick={() => {
                  setQuizToDownload(selectedQuiz);
                  setDownloadModalOpen(true);
                }}
                style={{ fontWeight: '600', transition: 'all 0.2s' }}
              >
                Download Paper
              </button>
              <button 
                className="btn btn-primary rounded-pill px-4" 
                onClick={() => setSelectedQuiz(null)}
                style={{ backgroundColor: '#1A5AFF', borderColor: '#1A5AFF', fontWeight: '600', transition: 'all 0.2s' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Options/Format Selection Modal */}
      {downloadModalOpen && (
        <div 
          className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in"
          onClick={() => setDownloadModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
          }}
        >
          <div 
            className="card card-custom p-4 shadow-lg border-0 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
              <h4 className="fw-bold mb-0" style={{ color: '#181d38', fontSize: '18px' }}>Download Document</h4>
              <button 
                type="button" 
                className="btn-close shadow-none hover-close" 
                onClick={() => setDownloadModalOpen(false)}
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            {/* Modal Body */}
            <div className="mb-4">
              {/* Step 1: Options & Answers */}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Include Answer Key?</label>
              <div className="d-flex gap-3 mb-4">
                <button
                  type="button"
                  className="flex-grow-1 p-3 rounded-4 d-flex flex-column align-items-start gap-1 transition-all"
                  style={{
                    backgroundColor: downloadWithOptions ? 'rgba(26, 90, 255, 0.05)' : '#ffffff',
                    border: downloadWithOptions ? '2px solid #1A5AFF' : '1px solid #cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: downloadWithOptions ? '0 4px 12px rgba(26, 90, 255, 0.1)' : 'none'
                  }}
                  onClick={() => setDownloadWithOptions(true)}
                >
                  <span className="fw-bold" style={{ fontSize: '14px', color: downloadWithOptions ? '#1A5AFF' : '#1e293b' }}>With Answers</span>
                  <span className="text-secondary" style={{ fontSize: '11px', lineHeight: '1.3' }}>Includes options, correct answers, and final keys.</span>
                </button>
                <button
                  type="button"
                  className="flex-grow-1 p-3 rounded-4 d-flex flex-column align-items-start gap-1 transition-all"
                  style={{
                    backgroundColor: !downloadWithOptions ? 'rgba(26, 90, 255, 0.05)' : '#ffffff',
                    border: !downloadWithOptions ? '2px solid #1A5AFF' : '1px solid #cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: !downloadWithOptions ? '0 4px 12px rgba(26, 90, 255, 0.1)' : 'none'
                  }}
                  onClick={() => setDownloadWithOptions(false)}
                >
                  <span className="fw-bold" style={{ fontSize: '14px', color: !downloadWithOptions ? '#1A5AFF' : '#1e293b' }}>Without Answers</span>
                  <span className="text-secondary" style={{ fontSize: '11px', lineHeight: '1.3' }}>Includes option choices but hides all answers & keys.</span>
                </button>
              </div>

              {/* Step 2: Download Format */}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Choose Format</label>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="flex-grow-1 p-3 rounded-4 d-flex flex-column align-items-start gap-1 transition-all"
                  style={{
                    backgroundColor: downloadFormat === 'pdf' ? 'rgba(26, 90, 255, 0.05)' : '#ffffff',
                    border: downloadFormat === 'pdf' ? '2px solid #1A5AFF' : '1px solid #cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: downloadFormat === 'pdf' ? '0 4px 12px rgba(26, 90, 255, 0.1)' : 'none'
                  }}
                  onClick={() => setDownloadFormat('pdf')}
                >
                  <span className="fw-bold" style={{ fontSize: '14px', color: downloadFormat === 'pdf' ? '#1A5AFF' : '#1e293b' }}>PDF Document</span>
                  <span className="text-secondary" style={{ fontSize: '11px', lineHeight: '1.3' }}>Standard print-ready styled format.</span>
                </button>
                <button
                  type="button"
                  className="flex-grow-1 p-3 rounded-4 d-flex flex-column align-items-start gap-1 transition-all"
                  style={{
                    backgroundColor: downloadFormat === 'docx' ? 'rgba(26, 90, 255, 0.05)' : '#ffffff',
                    border: downloadFormat === 'docx' ? '2px solid #1A5AFF' : '1px solid #cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: downloadFormat === 'docx' ? '0 4px 12px rgba(26, 90, 255, 0.1)' : 'none'
                  }}
                  onClick={() => setDownloadFormat('docx')}
                >
                  <span className="fw-bold" style={{ fontSize: '14px', color: downloadFormat === 'docx' ? '#1A5AFF' : '#1e293b' }}>Word (DOCX)</span>
                  <span className="text-secondary" style={{ fontSize: '11px', lineHeight: '1.3' }}>Fully editable Word file layout.</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
              <button 
                className="btn btn-outline-secondary rounded-pill px-4" 
                onClick={() => setDownloadModalOpen(false)}
                style={{ fontWeight: '600', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary rounded-pill px-4" 
                onClick={triggerHistoryDownload}
                style={{ backgroundColor: '#1A5AFF', borderColor: '#1A5AFF', fontWeight: '600', transition: 'all 0.2s' }}
              >
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hover-close:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: rotate(90deg);
        }
        .animate-badge {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .transition-all:hover {
          transform: translateY(-2px);
          border-color: #1A5AFF !important;
        }
      `}</style>
    </div>
  );
};

// Settings (AI API Keys) View
const Settings = ({ user }) => {
  const emailPrefix = user?.email ? `${user.email}_` : "";
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem(`${emailPrefix}openai_api_key`) || "");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem(`${emailPrefix}gemini_api_key`) || "");
  const [grokKey, setGrokKey] = useState(localStorage.getItem(`${emailPrefix}grok_api_key`) || "");
  const [mistralKey, setMistralKey] = useState(localStorage.getItem(`${emailPrefix}mistral_api_key`) || "");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showGrok, setShowGrok] = useState(false);
  const [showMistral, setShowMistral] = useState(false);
  const { addNotification } = useNotifications();

  const handleSave = (e) => {
    e.preventDefault();
    const cleanOpenai = openaiKey.trim();
    const cleanGemini = geminiKey.trim();
    const cleanGrok = grokKey.trim();
    const cleanMistral = mistralKey.trim();

    localStorage.setItem(`${emailPrefix}openai_api_key`, cleanOpenai);
    localStorage.setItem(`${emailPrefix}gemini_api_key`, cleanGemini);
    localStorage.setItem(`${emailPrefix}grok_api_key`, cleanGrok);
    localStorage.setItem(`${emailPrefix}mistral_api_key`, cleanMistral);
    
    if (!cleanOpenai && !cleanGemini && !cleanGrok && !cleanMistral) {
      addNotification("Keys cleared. The app will now use the server's default keys.", "info");
    } else {
      addNotification("AI Provider API Keys saved successfully!", "success");
    }
  };

  return (
    <div className="max-w-xl" style={{ maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
      <h2 className="fw-bold mb-1" style={{ color: '#181d38' }}>API Provider Settings</h2>
      <p className="text-secondary mb-4">Securely configure your own OpenAI, Gemini, Groq, or Mistral API Keys. These keys are only stored in your browser local storage.</p>

      <div className="alert alert-warning d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff3cd', borderColor: '#ffe69c', color: '#664d03' }}>
        <FontAwesomeIcon icon={faLightbulb} className="text-warning" />
        <span><strong>At least one API Key</strong> (OpenAI, Gemini, Groq, or Mistral) is required to generate quiz papers.</span>
      </div>

      <form onSubmit={handleSave} className="card card-custom p-4">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0 text-secondary small fw-semibold">OpenAI API Key</label>
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-link text-primary small text-decoration-none fw-semibold p-0"
              style={{ fontSize: '12px' }}
            >
              Get OpenAI Key <FontAwesomeIcon icon={faSignInAlt} size="xs" />
            </a>
          </div>
          <div className="input-group">
            <input 
              type={showOpenai ? "text" : "password"} 
              className="form-control form-control-custom" 
              placeholder="Enter your key" 
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              style={{ borderRight: 'none' }}
            />
            <button 
              type="button"
              className="btn"
              onClick={() => setShowOpenai(!showOpenai)}
              style={{ 
                borderLeft: 'none', 
                backgroundColor: '#ffffff', 
                borderColor: '#ddd',
                color: '#6c757d',
                zIndex: 10
              }}
            >
              <FontAwesomeIcon icon={showOpenai ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0 text-secondary small fw-semibold">Gemini API Key</label>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-link text-primary small text-decoration-none fw-semibold p-0"
              style={{ fontSize: '12px' }}
            >
              Get Gemini Key <FontAwesomeIcon icon={faSignInAlt} size="xs" />
            </a>
          </div>
          <div className="input-group">
            <input 
              type={showGemini ? "text" : "password"} 
              className="form-control form-control-custom" 
              placeholder="Enter your key" 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              style={{ borderRight: 'none' }}
            />
            <button 
              type="button"
              className="btn"
              onClick={() => setShowGemini(!showGemini)}
              style={{ 
                borderLeft: 'none', 
                backgroundColor: '#ffffff', 
                borderColor: '#ddd',
                color: '#6c757d',
                zIndex: 10
              }}
            >
              <FontAwesomeIcon icon={showGemini ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0 text-secondary small fw-semibold">Groq API Key</label>
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-link text-primary small text-decoration-none fw-semibold p-0"
              style={{ fontSize: '12px' }}
            >
              Get Groq Key <FontAwesomeIcon icon={faSignInAlt} size="xs" />
            </a>
          </div>
          <div className="input-group">
            <input 
              type={showGrok ? "text" : "password"} 
              className="form-control form-control-custom" 
              placeholder="Enter your key" 
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              style={{ borderRight: 'none' }}
            />
            <button 
              type="button"
              className="btn"
              onClick={() => setShowGrok(!showGrok)}
              style={{ 
                borderLeft: 'none', 
                backgroundColor: '#ffffff', 
                borderColor: '#ddd',
                color: '#6c757d',
                zIndex: 10
              }}
            >
              <FontAwesomeIcon icon={showGrok ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0 text-secondary small fw-semibold">Mistral API Key</label>
            <a 
              href="https://console.mistral.ai/api-keys/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-link text-primary small text-decoration-none fw-semibold p-0"
              style={{ fontSize: '12px' }}
            >
              Get Mistral Key <FontAwesomeIcon icon={faSignInAlt} size="xs" />
            </a>
          </div>
          <div className="input-group">
            <input 
              type={showMistral ? "text" : "password"} 
              className="form-control form-control-custom" 
              placeholder="Enter your key" 
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              style={{ borderRight: 'none' }}
            />
            <button 
              type="button"
              className="btn"
              onClick={() => setShowMistral(!showMistral)}
              style={{ 
                borderLeft: 'none', 
                backgroundColor: '#ffffff', 
                borderColor: '#ddd',
                color: '#6c757d',
                zIndex: 10
              }}
            >
              <FontAwesomeIcon icon={showMistral ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn w-100 py-3 mt-3 d-flex align-items-center justify-content-center gap-2" 
          style={{ 
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '15px',
            letterSpacing: '0.3px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(37, 99, 235, 0.35)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.25)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        >
          <FontAwesomeIcon icon={faSave} />
          Save API Keys
        </button>
      </form>

      <div className="card border-0 p-4 mt-4 shadow-sm" style={{ 
        borderRadius: '20px', 
        background: 'linear-gradient(135deg, rgba(26, 90, 255, 0.02) 0%, rgba(26, 90, 255, 0.07) 100%)',
        border: '1px solid rgba(26, 90, 255, 0.08)',
      }}>
        <div className="d-flex align-items-start gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center text-primary mt-1" style={{ 
            width: '36px', 
            height: '36px', 
            backgroundColor: 'rgba(26, 90, 255, 0.1)',
            flexShrink: 0
          }}>
            <FontAwesomeIcon icon={faLock} />
          </div>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Privacy & Security Guarantee</h6>
            <p className="text-secondary small mb-3" style={{ lineHeight: '1.5' }}>
              Your API keys are stored entirely inside your browser's local memory. We do not store, view, or transmit them to any third-party servers. All transactions are fully encrypted.
            </p>
            <Link to="/terms" className="btn btn-sm btn-link text-primary p-0 small fw-bold text-decoration-none hover-underline">
              View full Terms & Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Terms & Conditions / Privacy View
const TermsAndConditions = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="terms-page" style={{ width: '100%', maxWidth: '760px', animation: 'fadeIn 0.3s ease-out', fontFamily: "'Poppins', sans-serif", color: '#475569' }}>

      {/* Page Header */}
      <div className="mb-5">
        <h2 className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: '26px', letterSpacing: '-0.3px' }}>Terms & Data Privacy</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Last updated: May 2026 — QuestionWhiz Standalone Platform</p>
      </div>

      {/* Section 1 */}
      <div className="mb-4 p-4" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faLock} style={{ color: '#475569', fontSize: '14px' }} />
          </div>
          <h5 className="fw-semibold mb-0" style={{ color: '#0f172a', fontSize: '16px' }}>Client-Side API Key Storage</h5>
        </div>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.75', margin: '0 0 16px 0' }}>
          To ensure maximum security, QuestionWhiz implements a decentralized security model. When you enter your OpenAI, Gemini, or Groq API Keys, they are stored strictly on your local machine using your browser's <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '13px', color: '#334155' }}>localStorage</code>. They never leave your device or touch our servers.
        </p>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="fw-semibold mb-2" style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>How It Secures You</div>
              <ul className="mb-0 ps-3" style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                <li>Keys never touch our databases</li>
                <li>Keys are never logged on our backend</li>
                <li>API calls use client-injected headers only</li>
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="fw-semibold mb-2" style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>What We Cannot Do</div>
              <ul className="mb-0 ps-3" style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                <li>We cannot see or view your keys</li>
                <li>We cannot reuse or share your keys</li>
                <li>We cannot access your LLM usage logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="mb-4 p-4" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faDatabase} style={{ color: '#475569', fontSize: '14px' }} />
          </div>
          <h5 className="fw-semibold mb-0" style={{ color: '#0f172a', fontSize: '16px' }}>No Persistent Storage of Educational Data</h5>
        </div>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
          All source text files, images, recordings, or topics you supply to generate questions are processed in memory and immediately transferred securely to your chosen AI provider. We do not persist any uploaded course contents or generated quizzes on our backend. Your intellectual property remains exclusively yours.
        </p>
      </div>

      {/* Section 3 */}
      <div className="mb-4 p-4" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
            <FontAwesomeIcon icon={faBrain} style={{ color: '#475569', fontSize: '14px' }} />
          </div>
          <h5 className="fw-semibold mb-0" style={{ color: '#0f172a', fontSize: '16px' }}>Responsible AI Usage Policy</h5>
        </div>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
          Question papers are generated in real-time by advanced generative models (GPT-4o, Gemini 2.5, Llama 3.3). They should be reviewed for academic accuracy before use in formal assessments. You retain full copyright and usage permissions for all questions generated through this platform.
        </p>
      </div>

      {/* Footer Note */}
      <div className="p-4 rounded-3 d-flex align-items-start gap-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#94a3b8', marginTop: '2px', flexShrink: 0 }} />
        <p style={{ color: '#64748b', fontSize: '13.5px', lineHeight: '1.65', margin: 0 }}>
          <strong style={{ color: '#334155' }}>Privacy Guarantee:</strong> All API requests are transmitted over HTTPS. Your browser sends context directly to our secure server proxy, which forwards it to your selected AI provider and streams the response back. Zero data is retained.
        </p>
      </div>

      </div>
    </div>
  );
};

// Scoped Auth Styles
const AuthStyles = () => (
  <style>{`
    .auth-split-container {
      display: flex;
      min-height: 100vh;
      font-family: 'Poppins', sans-serif;
      background-color: #ffffff;
    }
    .auth-left-panel {
      flex: 1.1;
      background-color: #0A1D37;
      color: #ffffff;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .auth-right-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background-color: #ffffff;
    }
    .auth-form-wrapper {
      width: 100%;
      max-width: 440px;
    }
    .auth-input-container {
      position: relative;
      margin-bottom: 20px;
    }
    .auth-input-field {
      width: 100%;
      padding: 12px 16px;
      padding-right: 46px;
      background-color: #eaf2ff;
      border: 1px solid rgba(26, 90, 255, 0.1);
      border-radius: 8px;
      color: #1e293b;
      font-size: 14.5px;
      transition: all 0.2s ease;
    }
    .auth-input-field:focus {
      outline: none;
      border-color: #1A5AFF;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(26, 90, 255, 0.1);
    }
    .auth-eye-toggle {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-submit-btn {
      width: 100%;
      padding: 12px;
      background-color: #4CAF50;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .auth-submit-btn:hover {
      background-color: #43A047;
    }
    .auth-submit-btn:disabled {
      background-color: #a0aec0;
      cursor: not-allowed;
    }
    .auth-divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #64748b;
      font-size: 13px;
      margin: 24px 0;
    }
    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }
    .auth-divider:not(:empty)::before {
      margin-right: .5em;
    }
    .auth-divider:not(:empty)::after {
      margin-left: .5em;
    }
    .auth-google-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px 16px;
      background-color: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      color: #3c4043;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .auth-google-btn:hover {
      background-color: #f8fafc;
    }
    @media (max-width: 991px) {
      .auth-left-panel {
        display: none;
      }
    }
  `}</style>
);

// Login Screen
const Login = ({ setAuth }) => {
  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingResolve, setLoadingResolve] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailOrName && password) {
      setErrorMessage("");
      setLoadingResolve(true);
      try {
        let finalEmail = emailOrName.trim();
        if (!finalEmail.includes("@")) {
          finalEmail = await authService.resolveEmailFromName(finalEmail);
        }
        const user = await authService.signIn(finalEmail, password);
        setAuth(user);
        navigate("/");
      } catch (err) {
        setErrorMessage(err.message || "Authentication failed.");
      } finally {
        setLoadingResolve(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage("");
      await authService.signInWithGoogle();
    } catch (err) {
      setErrorMessage(err.message || "Google Sign-In failed.");
    }
  };

  return (
    <div className="auth-split-container">
      <AuthStyles />
      
      {/* Left Sidebar Info Panel */}
      <div className="auth-left-panel">
        <div>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="rounded-3 p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#1A5AFF', width: '36px', height: '36px' }}>
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                <circle cx="20" cy="20" r="10" fill="white" />
                <circle cx="50" cy="20" r="10" fill="white" />
                <circle cx="80" cy="20" r="10" fill="white" />
                <circle cx="20" cy="50" r="10" fill="white" />
                <circle cx="50" cy="50" r="10" fill="white" />
                <circle cx="80" cy="50" r="10" fill="white" />
                <circle cx="20" cy="80" r="10" fill="white" />
                <circle cx="50" cy="80" r="10" fill="white" />
                <circle cx="80" cy="80" r="10" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>QuestionWhiz</span>
          </div>

          <h2 className="fw-bold mb-2" style={{ fontSize: '30px', lineHeight: '1.3' }}>Generate Exam-Ready Questions in Seconds</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
            Powered by AI. Designed for educators, trainers, and students who need high-quality assessments fast.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'AI-powered question generation from any topic or PDF',
              'MCQ, True/False, Short Answer, Fill-in-the-Blank & more',
              'Bloom\'s Taxonomy level targeting',
              'Adjustable difficulty — Easy, Medium, Hard',
              'Upload PDFs or paste text as input source',
              'Export to PDF, Word, or Excel instantly',
              'Full generation history & quiz tracking',
              'Bring your own API key — OpenAI, Groq, Gemini'
            ].map((text, i) => (
              <li key={i} className="d-flex align-items-start" style={{ fontSize: '14px', color: '#cbd5e1' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', marginTop: '3px', flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Trusted by educators worldwide</p>
        </div>
      </div>

      {/* Right Sidebar Form Panel */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          {/* logo icon matching screenshot */}
          <div className="text-center mb-4">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="20" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="20" cy="80" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="80" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="80" r="10" fill="#1A5AFF" />
            </svg>
            <h3 className="fw-bold mt-3 mb-1" style={{ color: '#1e293b', fontSize: '24px' }}>Welcome, Let's get started!</h3>
          </div>

          {errorMessage && (
            <div className="alert alert-danger p-2 small text-center mb-3" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-input-container">
              <input 
                type="text" 
                required 
                className="auth-input-field" 
                placeholder="student@lysasolutions.com"
                value={emailOrName} 
                onChange={e => setEmailOrName(e.target.value)} 
              />
            </div>

            <div className="auth-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="auth-input-field" 
                placeholder="Password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            <div className="text-end mb-3">
              <a href="#" className="text-primary text-decoration-none small" onClick={(e) => e.preventDefault()} style={{ fontSize: '13px', fontWeight: '500' }}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loadingResolve}
              className="auth-submit-btn mb-2"
            >
              {loadingResolve ? "Logging In..." : "Login"}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            className="auth-google-btn mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.67H24v8.83h12.62c-.55 2.87-2.18 5.3-4.62 6.94l7.16 5.55C43.34 36.63 46.5 30.82 46.5 24z"/>
              <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.16-5.55c-2 .54-4.52.86-7.16.86-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="text-center" style={{ fontSize: '14.5px', color: '#64748b' }}>
            New User? <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: '#2ecc71' }}>Signup</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

// Register Screen
const Register = ({ setAuth }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && email && password && agreedToTerms) {
      setErrorMessage("");
      setLoadingRegister(true);
      try {
        const user = await authService.signUp(email, password, name.trim());
        setAuth(user);
        navigate("/");
      } catch (err) {
        setErrorMessage(err.message || "Registration failed.");
      } finally {
        setLoadingRegister(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage("");
      await authService.signInWithGoogle();
    } catch (err) {
      setErrorMessage(err.message || "Google Sign-In failed.");
    }
  };

  return (
    <div className="auth-split-container">
      <AuthStyles />
      
      {/* Left Sidebar Info Panel */}
      <div className="auth-left-panel">
        <div>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="rounded-3 p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#1A5AFF', width: '36px', height: '36px' }}>
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                <circle cx="20" cy="20" r="10" fill="white" />
                <circle cx="50" cy="20" r="10" fill="white" />
                <circle cx="80" cy="20" r="10" fill="white" />
                <circle cx="20" cy="50" r="10" fill="white" />
                <circle cx="50" cy="50" r="10" fill="white" />
                <circle cx="80" cy="50" r="10" fill="white" />
                <circle cx="20" cy="80" r="10" fill="white" />
                <circle cx="50" cy="80" r="10" fill="white" />
                <circle cx="80" cy="80" r="10" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>QuestionWhiz</span>
          </div>

          <h2 className="fw-bold mb-2" style={{ fontSize: '30px', lineHeight: '1.3' }}>Generate Exam-Ready Questions in Seconds</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
            Powered by AI. Designed for educators, trainers, and students who need high-quality assessments fast.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'AI-powered question generation from any topic or PDF',
              'MCQ, True/False, Short Answer, Fill-in-the-Blank & more',
              'Bloom\'s Taxonomy level targeting',
              'Adjustable difficulty — Easy, Medium, Hard',
              'Upload PDFs or paste text as input source',
              'Export to PDF, Word, or Excel instantly',
              'Full generation history & quiz tracking',
              'Bring your own API key — OpenAI, Groq, Gemini'
            ].map((text, i) => (
              <li key={i} className="d-flex align-items-start" style={{ fontSize: '14px', color: '#cbd5e1' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', marginTop: '3px', flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Trusted by educators worldwide</p>
        </div>
      </div>

      {/* Right Sidebar Form Panel */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          {/* logo icon matching screenshot */}
          <div className="text-center mb-4">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="20" r="10" fill="#1A5AFF" />
              <circle cx="20" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="50" r="10" fill="#1A5AFF" />
              <circle cx="20" cy="80" r="10" fill="#1A5AFF" />
              <circle cx="50" cy="80" r="10" fill="#1A5AFF" />
              <circle cx="80" cy="80" r="10" fill="#1A5AFF" />
            </svg>
            <h3 className="fw-bold mt-3 mb-1" style={{ color: '#1e293b', fontSize: '24px' }}>Create Your Account</h3>
          </div>

          {errorMessage && (
            <div className="alert alert-danger p-2 small text-center mb-3" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-input-container">
              <input 
                type="text" 
                required 
                className="auth-input-field" 
                placeholder="Full Name"
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>

            <div className="auth-input-container">
              <input 
                type="email" 
                required 
                className="auth-input-field" 
                placeholder="student@lysasolutions.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="auth-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                className="auth-input-field" 
                placeholder="Password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="mb-4 d-flex align-items-start gap-2">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  accentColor: '#4361ee',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <label htmlFor="agreeTerms" className="small text-secondary" style={{ cursor: 'pointer', lineHeight: '1.5' }}>
                I agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary fw-semibold text-decoration-none"
                  style={{ borderBottom: '1px solid #4361ee' }}
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loadingRegister || !agreedToTerms}
              className="auth-submit-btn mb-2"
              style={{
                backgroundColor: agreedToTerms ? '#4CAF50' : '#a0aec0',
                cursor: agreedToTerms ? 'pointer' : 'not-allowed'
              }}
            >
              {loadingRegister ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn}
            className="auth-google-btn mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.67H24v8.83h12.62c-.55 2.87-2.18 5.3-4.62 6.94l7.16 5.55C43.34 36.63 46.5 30.82 46.5 24z"/>
              <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.16-5.55c-2 .54-4.52.86-7.16.86-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="text-center" style={{ fontSize: '14.5px', color: '#64748b' }}>
            Already have an account? <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#2ecc71' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// App Root
// App Root
const App = () => {
  // Initialise user as null; we will fetch from Supabase on mount
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Centralized authentication state handler that syncs user to localStorage
  const handleSetAuth = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
    } else {
      localStorage.removeItem("user");
    }
  };

  // On component mount, check for an existing session
  useEffect(() => {
    const fetchUser = async () => {
      const current = await authService.getCurrentUser();
      handleSetAuth(current);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f4f4' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    authService.signOut();
    handleSetAuth(null);
  };

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setAuth={handleSetAuth} />} />
          <Route path="/register" element={<Register setAuth={handleSetAuth} />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/*" element={
            user ? (
              <DashboardLayout user={user} handleLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<DashboardOverview user={user} />} />
                  <Route path="/generator" element={<QuestionWhiz user={user} />} />
                  <Route path="/history" element={<QuizHistory user={user} />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
};

export default App;
