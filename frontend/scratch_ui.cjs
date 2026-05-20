const fs = require('fs');

const filePath = 'c:\\lysa\\questionwhiz-standalone\\frontend\\src\\components\\QuestionWhiz.jsx';
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
let returnIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "return (" && i > 1400) {
        returnIdx = i;
        break;
    }
}

if (returnIdx === -1) {
    console.error("Could not find return statement");
    process.exit(1);
}

const preContent = lines.slice(0, returnIdx).join('\n');

const postContent = `  return (
    <div className="question-gen-card" style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto', background: '#ffffff', boxShadow: 'none', border: 'none' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '50%',
          transform: 'translateX(50%)',
          backgroundColor: toastType === 'error' ? '#f44336' : toastType === 'info' ? '#2196f3' : '#4caf50',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 3000,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Long Processing Warning Toast */}
      {longProcessWarning && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fa fa-info-circle"></i>
          <span>Generation is taking longer than usual. You can continue with other work; we will notify you when it is done.</span>
        </div>
      )}

      <h1 className="question-gen-heading" style={{ color: '#1A5AFF', marginBottom: '30px' }}>Question Whiz</h1>

      <div className="qw-clean-layout">
        <div className="qw-source-btn-container">
          <button type="button" className="qw-source-btn" onClick={() => setIsSourceModalOpen(true)}>
            <FontAwesomeIcon icon={faPlus} /> Source
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e, "document")}
          multiple
          accept={docMode === 'normal' ? '.pdf, .docx' : '.pdf, .docx, .jpg, .jpeg, .png'}
        />
        <input
          type="file"
          ref={videoInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e, "video")}
          multiple
          accept="video/*"
        />
        <input
          type="file"
          ref={audioInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e, "audio")}
          multiple
          accept="audio/*"
        />
        <input
          type="file"
          ref={imageInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e, "image")}
          multiple
          accept=".jpg, .jpeg, .png"
        />

        <div className="qw-split-text-areas">
          <div className="qw-text-area-card">
            <div className="qw-text-area-label">Enter the Text</div>
            <textarea
              id="text-content"
              value={enterTheText}
              onChange={(e) => setEnterTheText(e.target.value)}
              placeholder="The questions generated will be based on the text you provide here"
            />
            {files.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {files.map((f, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                    {f.name} <FontAwesomeIcon icon={faTimes} style={{ cursor: 'pointer', marginLeft: '4px', color: '#ef4444' }} onClick={() => handleFileRemove(idx)} />
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="qw-text-area-card" style={{ position: 'relative' }}>
            <div className="qw-text-area-label">Generated Question</div>
            <textarea
              ref={outputRef}
              id="output"
              value={outputText}
              readOnly
              placeholder="Generated questions will appear here"
            />
            <div className="qw-text-actions">
              <FontAwesomeIcon icon={faComment} className="qw-action-icon" onClick={handleFeedback} title="Feedback" />
              {showFeed && <FeedbackPopup onClose={handleClosePopup} />}
              <FontAwesomeIcon icon={faCopy} className="qw-action-icon" onClick={handleCopyToClipboard} title="Copy" />
              <FontAwesomeIcon icon={faDownload} className="qw-action-icon" onClick={() => setShowPopup(!showPopup)} title="Download" />
              
              {showPopup && (
                <div className="popup" style={{ position: 'absolute', top: 'auto', bottom: '50px', right: '20px', zIndex: 100 }}>
                  <button type="button" onClick={handleDownloadPDF} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>Download as PDF</button>
                  <button type="button" onClick={handleDownloadDOCX} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', borderTop: '1px solid #eee' }}>Download as DOCX</button>
                </div>
              )}
            </div>
            {generatedQuestions.length > 0 && onUseQuestion && (
              <div style={{ marginTop: '10px', textAlign: 'right' }}>
                 <button 
                  type="button" 
                  className="btn btn-primary px-3 py-1" 
                  style={{ borderRadius: '6px', fontSize: '13px' }}
                  onClick={() => {
                    const parsedQuestions = generatedQuestions.map(q => {
                      const qTextRaw = q.text || q.question || q.question_text || q.description || q.content || q.body || (typeof q === 'string' ? q : '');
                      const qText = typeof qTextRaw === 'string' ? qTextRaw.replace(/^\\d+\\.\\s*/, '').trim() : '';
                      const optsRaw = q.options || q.choices || q.choices_text || q.answers || [];
                      const opts = (Array.isArray(optsRaw) ? optsRaw : []).map(opt => typeof opt === 'string' ? opt.replace(/^[A-Z]\\.\\s*/i, '').replace(/^[a-z]\\)\\s*/i, '').trim() : opt);
                      const ansRaw = q.answer || q.correctAnswer || q.correct_answer || q.solution || '';
                      const ans = typeof ansRaw === 'string' ? ansRaw.replace(/^Answer:\\s*/i, '').replace(/^[A-Z]\\.\\s*/i, '').trim() : ansRaw;
                      
                      return {
                        ...q, text: qText, options: opts, answer: ans, creation_method: q.creation_method || 'ai',
                        generation_cost: q.generation_cost, bloom_ai: q.bloom_ai, level_ai: q.level_ai, num_questions_ai: q.num_questions_ai,
                        learning_obj: q.learning_obj, ai_response_json: q.ai_response_json
                      };
                    });
                    onUseQuestion(parsedQuestions);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Questions
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="qw-section">
          <div className="qw-section-title">Question Format</div>
          <div className="qw-grid-4">
            <div className="forrm-group-quiz">
              <label>Type of question</label>
              <select value={questionType} onChange={handleQuestionTypeChange}>
                <option value="MCQ">MCQ</option>
                <option value="Short Answer">Short Answer</option>
                <option value="True or False">True or False</option>
                <option value="Fill in the blanks">Fill in the blanks</option>
                <option value="Match the following">Match the following</option>
                {onUseQuestion && (
                  <>
                    <option value="Flashcards">Flashcards</option>
                    <option value="Summaries">Summaries</option>
                    <option value="Mindmaps">Mindmaps</option>
                    <option value="Riddles">Riddles</option>
                  </>
                )}
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Number of questions</label>
              <input type="number" min="1" value={numQuestionsValue} onChange={(e) => setNumQuestionsValue(e.target.value)} />
            </div>
            <div className="forrm-group-quiz">
              <label>Bloom's Taxonomy Levels</label>
              <select value={bloomValue} onChange={(e) => setBloomValue(e.target.value)}>
                <option>Not Specified</option>
                <option>Remembering</option>
                <option>Understanding</option>
                <option>Applying</option>
                <option>Analyzing</option>
                <option>Evaluating</option>
                <option>Creating</option>
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Level of difficulty</label>
              <select value={levelValue} onChange={(e) => setLevelValue(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
          
          <div className="qw-grid-3">
            <div className="forrm-group-quiz">
              <label>Number of options</label>
              <select value={numberOfOptionsValue} onChange={(e) => setNumberOfOptionsValue(e.target.value)}>
                {[1, 2, 3, 4].map((num) => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Option type</label>
              <select value={optionTypeValue} onChange={(e) => setOptionTypeValue(e.target.value)}>
                <option>A, B,</option>
                <option>a, b, </option>
                <option>1, 2</option>
                <option>I, ii,</option>
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Learning Objective</label>
              <input type="text" placeholder="objective" value={learningObj} onChange={(e) => setlearningObj(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="qw-section">
          <div className="qw-section-title">Answer Format</div>
          <div className="qw-grid-3">
            <div className="forrm-group-quiz">
              <label>Provide Answer</label>
              <select value={provideAnswerValue} onChange={(e) => setProvideAnswerValue(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Explanation</label>
              <select value={explanationValue} onChange={(e) => setExplanationValue(e.target.value)}>
                <option>Not required</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={\`\${num} sentences\`}>{num} {num === 1 ? 'sentence' : 'sentences'}</option>
                ))}
              </select>
            </div>
            <div className="forrm-group-quiz">
              <label>Result Format</label>
              <select value={formatValue} onChange={(e) => setFormatValue(e.target.value)}>
                <option>Plain text</option>
                <option>JSON</option>
                <option>Markdown</option>
                <option>HTML</option>
                <option>CSV</option>
                <option>List</option>
                <option>Dictionary</option>
                <option>XML</option>
              </select>
            </div>
          </div>
        </div>

        <div className="qw-generate-btn-container">
          <button type="button" className="qw-generate-btn" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Question'}
          </button>
        </div>
      </div>

      <SourceSelectionModal 
        isOpen={isSourceModalOpen} 
        onClose={() => setIsSourceModalOpen(false)} 
        onSelectSource={(sourceId) => {
          setIsSourceModalOpen(false);
          if (sourceId === 3) {
            handleButtonClick(3);
            if (fileInputRef.current) fileInputRef.current.click();
          } else if (sourceId === 5) {
            handleButtonClick(5);
            if (videoInputRef.current) videoInputRef.current.click();
          } else if (sourceId === 6) {
            handleButtonClick(6);
            if (audioInputRef.current) audioInputRef.current.click();
          } else if (sourceId === 7) {
            handleButtonClick(7);
            if (imageInputRef.current) imageInputRef.current.click();
          } else {
            handleButtonClick(sourceId);
          }
        }}
      />
    </div>
  );
};

export default QuestionWhiz;
`;

const newContent = preContent + '\\n' + postContent;
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("Done");
