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
  faLock
} from '@fortawesome/free-solid-svg-icons';

import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer, Header, Footer, AlignmentType, PageNumber, LineRuleType, ShadingType, Table, TableRow, TableCell, WidthType, HeightRule } from "docx";
import { saveAs } from "file-saver";

import QuestionWhiz from './components/QuestionWhiz';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { authService } from './components/Authentication/authService';

// Dashboard layout wrapping authenticated pages with the Lysa UI/UX light theme
const DashboardLayout = ({ children, user, handleLogout }) => {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      {/* Sidebar */}
      <div className="p-4 d-flex flex-column" style={{ 
        width: '280px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.015)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100
      }}>
        <div className="d-flex align-items-center mb-5 gap-2 px-2" style={{ transition: 'all 0.3s' }}>
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
            <li className="nav-item">
              <Link to="/settings" className={`nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 hover-sidebar ${isActive('/settings') ? 'active-sidebar' : ''}`} style={{ color: '#475569', fontWeight: '500', transition: 'all 0.25s' }}>
                <FontAwesomeIcon icon={faKey} className={isActive('/settings') ? 'text-primary' : 'text-secondary'} style={{ width: '20px', transition: 'all 0.2s' }} />
                <span>AI API Keys</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/terms" className={`nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 hover-sidebar ${isActive('/terms') ? 'active-sidebar' : ''}`} style={{ color: '#475569', fontWeight: '500', transition: 'all 0.25s' }}>
                <FontAwesomeIcon icon={faShieldHalved} className={isActive('/terms') ? 'text-primary' : 'text-secondary'} style={{ width: '20px', transition: 'all 0.2s' }} />
                <span>Terms & Privacy</span>
              </Link>
            </li>
          </ul>
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
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden" style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              <div className="fw-semibold small" style={{ color: '#1e293b' }}>{user?.email || 'User'}</div>
              <div className="text-secondary" style={{ fontSize: '11px', fontWeight: '500' }}>Standalone Plan</div>
            </div>
          </div>
          <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2" style={{ 
            borderRadius: '10px', 
            fontWeight: '600',
            padding: '10px',
            borderColor: 'rgba(220, 38, 38, 0.2)',
            transition: 'all 0.2s'
          }} onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 p-5 overflow-auto" style={{ maxHeight: '100vh' }}>
        {children}
      </div>

      {/* Sidebar Hover & Active Styles */}
      <style>{`
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
      `}</style>
    </div>
  );
};

// Overview dashboard home view
const DashboardOverview = ({ user }) => {
  const [historyCount, setHistoryCount] = useState(0);
  const emailPrefix = user?.email ? `${user.email}_` : "";
  const openApiKeySet = !!(localStorage.getItem(`${emailPrefix}openai_api_key`));
  const geminiApiKeySet = !!(localStorage.getItem(`${emailPrefix}gemini_api_key`));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${emailPrefix}quiz_history`);
      if (stored) {
        setHistoryCount(JSON.parse(stored).length);
      }
    } catch {}
  }, [emailPrefix]);

  return (
    <div>
      <h2 className="fw-bold mb-1" style={{ color: '#181d38' }}>Welcome to QuestionWhiz</h2>
      <p className="text-secondary mb-4">Launch generating tests, quizzes and practice papers using your own AI provider keys.</p>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card card-custom p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="text-secondary small mb-1" style={{ fontWeight: '500' }}>Generations Run</div>
              <div className="fs-1 fw-bold mb-3" style={{ color: '#1e293b', fontFamily: "'Poppins', sans-serif" }}>{historyCount}</div>
            </div>
            <Link to="/history" className="btn btn-sm btn-outline-primary px-4 py-2 mt-auto" style={{ 
              borderRadius: '50px', 
              borderColor: 'rgba(26, 90, 255, 0.2)', 
              color: '#1A5AFF',
              fontWeight: '600',
              transition: 'all 0.2s',
              width: 'fit-content'
            }}>View history</Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-custom p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="text-secondary small mb-1" style={{ fontWeight: '500' }}>OpenAI API Key</div>
              <div className="d-flex align-items-center gap-2 my-2">
                <span className={`badge ${openApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-2 rounded-pill`} style={{ fontSize: '11px', fontWeight: '600' }}>
                  {openApiKeySet ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
            <Link to="/settings" className="btn btn-sm btn-outline-primary px-4 py-2 mt-3" style={{ 
              borderRadius: '50px', 
              borderColor: 'rgba(26, 90, 255, 0.2)', 
              color: '#1A5AFF',
              fontWeight: '600',
              transition: 'all 0.2s',
              width: 'fit-content'
            }}>Manage key</Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-custom p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="text-secondary small mb-1" style={{ fontWeight: '500' }}>Gemini API Key</div>
              <div className="d-flex align-items-center gap-2 my-2">
                <span className={`badge ${geminiApiKeySet ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-2 rounded-pill`} style={{ fontSize: '11px', fontWeight: '600' }}>
                  {geminiApiKeySet ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>
            <Link to="/settings" className="btn btn-sm btn-outline-primary px-4 py-2 mt-3" style={{ 
              borderRadius: '50px', 
              borderColor: 'rgba(26, 90, 255, 0.2)', 
              color: '#1A5AFF',
              fontWeight: '600',
              transition: 'all 0.2s',
              width: 'fit-content'
            }}>Manage key</Link>
          </div>
        </div>
      </div>

      <div className="card card-custom p-5 text-center" style={{ border: '2px dashed #eaeaea', backgroundColor: '#ffffff' }}>
        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', backgroundColor: '#e6ecff', color: '#4361ee' }}>
          <FontAwesomeIcon icon={faWandMagicSparkles} size="2x" />
        </div>
        <h4 className="fw-bold mb-2" style={{ color: '#181d38' }}>Ready to generate new questions?</h4>
        <p className="text-secondary max-w-md mx-auto mb-4" style={{ maxWidth: '500px' }}>
          Upload PDF documents, input topics, scrape web links, or insert media content to build comprehensive exam sheets inside seconds.
        </p>
        <Link to="/generator" className="btn btn-lg btn-primary rounded-pill px-5 shadow-sm" style={{ backgroundColor: '#4361ee', borderColor: '#4361ee' }}>Open AI Generator</Link>
      </div>
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

        <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm w-100 py-2.5 mt-2" style={{ backgroundColor: '#4361ee', borderColor: '#4361ee', fontWeight: '500' }}>Save Settings</button>
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
    <div className="max-w-4xl" style={{ maxWidth: '800px', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="d-flex align-items-center gap-3 mb-2">
        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(26, 90, 255, 0.1)', color: '#1A5AFF' }}>
          <FontAwesomeIcon icon={faShieldHalved} size="lg" />
        </div>
        <div>
          <h2 className="fw-bold mb-0 text-slate-800" style={{ color: '#1e293b' }}>Terms & Data Privacy</h2>
          <p className="text-secondary mb-0 small fw-medium">Your data, completely protected. Last updated: May 2026</p>
        </div>
      </div>
      
      <hr className="my-4" style={{ opacity: 0.08 }} />

      <div className="card card-custom p-4 border-0 shadow-sm mb-4" style={{ borderRadius: '24px', backgroundColor: '#ffffff' }}>
        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1A5AFF', fontSize: '18px' }}>
          <FontAwesomeIcon icon={faLock} className="text-primary" />
          <span>100% Client-Side API Key Storage</span>
        </h4>
        <p className="text-slate-600 mb-4" style={{ lineHeight: '1.6', fontSize: '14.5px' }}>
          To ensure maximum security and protect your financial credentials, QuestionWhiz implements a decentralized security model. 
          When you enter your <strong>OpenAI, Gemini, or Grok API Keys</strong>, they are stored <strong>strictly on your local machine</strong> using your browser's encrypted <code>localStorage</code>.
        </p>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="p-3 rounded-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
              <div className="fw-bold text-success mb-1 small uppercase tracking-wider" style={{ fontSize: '12px' }}>HOW IT SECURES YOU</div>
              <ul className="ps-3 mb-0 text-success-emphasis" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                <li>Keys never touch our databases</li>
                <li>Keys are never printed in backend logs</li>
                <li>API calls route dynamically with client-injected headers</li>
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="p-3 rounded-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
              <div className="fw-bold text-danger mb-1 small uppercase tracking-wider" style={{ fontSize: '12px' }}>WHAT WE CANNOT DO</div>
              <ul className="ps-3 mb-0 text-danger-emphasis" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                <li>We cannot see or view your keys</li>
                <li>We cannot reuse or share your keys</li>
                <li>We cannot access your LLM usage logs</li>
              </ul>
            </div>
          </div>
        </div>

        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2 mt-4" style={{ color: '#f69050', fontSize: '18px' }}>
          <FontAwesomeIcon icon={faDatabase} className="text-warning" />
          <span>No Persistent Storage of Educational Data</span>
        </h4>
        <p className="text-slate-600 mb-4" style={{ lineHeight: '1.6', fontSize: '14.5px' }}>
          All source text files, images, recordings, or topics that you supply to generate questions are processed in memory and immediately transferred securely to your chosen AI model provider. We do not persist any uploaded course contents or generated quizzes on our backend databases. Your intellectual property remains exclusively yours.
        </p>

        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1e293b', fontSize: '18px' }}>
          <FontAwesomeIcon icon={faBrain} className="text-secondary" />
          <span>Responsible AI Usage Policy</span>
        </h4>
        <p className="text-slate-600 mb-0" style={{ lineHeight: '1.6', fontSize: '14.5px' }}>
          Since question papers are generated in real-time by advanced generative models (GPT-4o, Gemini-2.5, Grok-beta), they should be reviewed for academic accuracy before formal classroom assessments. You retain full copyright and usage permissions for all questions generated.
        </p>
      </div>

      <div className="alert alert-primary d-flex align-items-start gap-3 p-4 border-0" style={{ borderRadius: '20px', backgroundColor: 'rgba(26, 90, 255, 0.05)' }}>
        <FontAwesomeIcon icon={faLightbulb} className="text-primary mt-1" size="lg" />
        <div>
          <h6 className="fw-bold text-primary mb-1">Privacy Guarantee</h6>
          <p className="mb-0 text-secondary" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
            We leverage industry standard secure HTTPS encryption. Your browser directly sends requests containing headers to our server proxy, which streams the context directly to the selected LLM provider and responds with your generated quiz immediately. Zero persistence, absolute privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

// Login Screen
const Login = ({ setAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const user = await authService.signIn(email, password);
        setAuth(user);
        navigate("/");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', fontFamily: "'Poppins', sans-serif" }}>
      <form onSubmit={handleSubmit} className="card card-custom p-5" style={{ width: '420px' }}>
        <h3 className="fw-bold mb-2 text-center" style={{ color: '#181d38' }}>Sign In</h3>
        <p className="text-secondary text-center small mb-4">Access your standalone QuestionWhiz engine</p>

        <div className="mb-3">
          <label className="form-label text-secondary small">Email address</label>
          <input type="email" required className="form-control form-control-custom" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="form-label text-secondary small">Password</label>
          <input type="password" required className="form-control form-control-custom" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 shadow-sm mb-3" style={{ backgroundColor: '#4361ee', borderColor: '#4361ee' }}>Sign In</button>
        <div className="text-center small text-secondary">
          Don't have an account? <Link to="/register" className="text-primary text-decoration-none fw-semibold">Sign Up</Link>
        </div>
      </form>
    </div>
  );
};

// Register Screen
const Register = ({ setAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const user = await authService.signUp(email, password);
        setAuth(user);
        navigate("/");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', fontFamily: "'Poppins', sans-serif" }}>
      <form onSubmit={handleSubmit} className="card card-custom p-5" style={{ width: '420px' }}>
        <h3 className="fw-bold mb-2 text-center" style={{ color: '#181d38' }}>Sign Up</h3>
        <p className="text-secondary text-center small mb-4">Start generating exam papers with ease</p>

        <div className="mb-3">
          <label className="form-label text-secondary small">Email address</label>
          <input type="email" required className="form-control form-control-custom" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="form-label text-secondary small">Password</label>
          <input type="password" required className="form-control form-control-custom" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 shadow-sm mb-3" style={{ backgroundColor: '#4361ee', borderColor: '#4361ee' }}>Create Account</button>
        <div className="text-center small text-secondary">
          Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-semibold">Sign In</Link>
        </div>
      </form>
    </div>
  );
};

// App Root
// App Root
const App = () => {
  // Initialise user as null; we will fetch from Supabase on mount
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On component mount, check for an existing session
  useEffect(() => {
    const fetchUser = async () => {
      const current = await authService.getCurrentUser();
      setUser(current);
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
    setUser(null);
  };

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setAuth={setUser} />} />
          <Route path="/register" element={<Register setAuth={setUser} />} />
          <Route path="/*" element={
            user ? (
              <DashboardLayout user={user} handleLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<DashboardOverview user={user} />} />
                  <Route path="/generator" element={<QuestionWhiz user={user} />} />
                  <Route path="/history" element={<QuizHistory user={user} />} />
                  <Route path="/settings" element={<Settings user={user} />} />
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
