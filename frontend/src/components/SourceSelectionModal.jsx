import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faCopy, 
  faTimes, 
  faVideo, 
  faMicrophone, 
  faImage, 
  faList, 
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import './SourceSelectionModal.css';

const SourceSelectionModal = ({ isOpen, onClose, onSelectSource }) => {
  if (!isOpen) return null;

  return (
    <div className="source-modal-overlay" onClick={onClose}>
      <div className="source-modal-container compact" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="source-modal-header">
          <h2>Select Source</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="source-modal-body">
          <div className="source-tabs-grid">
            {/* Card: Text */}
            <button 
              type="button" 
              className="source-grid-card"
              onClick={() => onSelectSource(1)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#1A5AFF', background: 'rgba(26, 90, 255, 0.08)' }}>
                <FontAwesomeIcon icon={faCopy} />
              </div>
              <span>Text</span>
            </button>

            {/* Card: Topic */}
            <button 
              type="button" 
              className="source-grid-card"
              onClick={() => onSelectSource(2)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.08)' }}>
                <FontAwesomeIcon icon={faList} />
              </div>
              <span>Topic</span>
            </button>

            {/* Card: Similar */}
            <button 
              type="button" 
              className="source-grid-card"
              onClick={() => onSelectSource(4)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.08)' }}>
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <span>Similar</span>
            </button>



            {/* Card: Audio */}
            <button 
              type="button" 
              className="source-grid-card"
              onClick={() => onSelectSource(6)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.08)' }}>
                <FontAwesomeIcon icon={faMicrophone} />
              </div>
              <span>Audio</span>
            </button>

            {/* Card: Video */}
            <button 
              type="button" 
              className="source-grid-card"
              onClick={() => onSelectSource(5)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}>
                <FontAwesomeIcon icon={faVideo} />
              </div>
              <span>Video</span>
            </button>

            {/* Card: Documents (Spans full width at bottom) */}
            <button 
              type="button" 
              className="source-grid-card wide"
              onClick={() => onSelectSource(3)}
            >
              <div className="source-grid-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
                <FontAwesomeIcon icon={faUpload} />
              </div>
              <span>Documents</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceSelectionModal;
