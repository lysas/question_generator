import React from 'react';

const PageFooter = () => {
  return (
    <footer className="py-4 text-center mt-5" style={{ borderTop: '1px solid #1f2937', color: '#6b7280' }}>
      <p className="mb-0">© {new Date().getFullYear()} QuestionWhiz Standalone AI. All rights reserved.</p>
    </footer>
  );
};

export default PageFooter;
