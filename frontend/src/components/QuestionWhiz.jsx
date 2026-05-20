
import React, { useLayoutEffect, useRef, useState } from "react";
import { useNotifications } from '../contexts/NotificationContext';


import {
  faComment,
  faCopy,
  faDownload,
  faTimes,
  faUpload,
  faVideo,
  faMicrophone,
  faFileAlt,
  faBell,
  faCheck,
  faList,
  faPlus,
  faBook,
  faImage,
  faCloudUploadAlt,
  faLink,
  faArrowUp,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import jsPDF from "jspdf";
import "./QuestionGen.css";
import SourceSelectionModal from "./SourceSelectionModal";



import docx from "../assets/docx.png";
import image from "../assets/image.png";
import link from "../assets/link.png";
import pdf from "../assets/pdf.png";
import PageFooter from "./Footer";
import FeedbackPopup from "./FeedbackPopup";
import { buildApiUrl, apiClient } from "../utils/apiClient";
import { authService } from "./Authentication/authService";
import { Document, Paragraph, TextRun, Packer, Header, Footer, AlignmentType, PageNumber, LineRuleType, ShadingType, Table, TableRow, TableCell, WidthType, HeightRule } from "docx";
import { saveAs } from "file-saver";
//import { authService } from './Authentication/authService';
//import FeedbackPopup from "./FeedbackPopup";

const QuestionWhiz = ({ onUseQuestion, queueLength, user }) => {
  useLayoutEffect(() => {
    const reset = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }
      const contentArea = document.querySelector(".content-area");
      const contentWrapper = document.querySelector(".content-wrapper");
      const card = document.querySelector(".question-gen-card");
      [contentArea, contentWrapper, card].forEach((el) => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        }
      });
    };
    reset();
    const raf = window.requestAnimationFrame(reset);
    const timer = window.setTimeout(reset, 80);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  const { addNotification } = useNotifications();
  const [questionType, setQuestionType] = useState("MCQ");
  const [outputText, setOutputText] = useState("");
  const [additionalValues, setAdditionalValues] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [subtopicValue, setSubtopicValue] = useState("");
  const [exampleValue, setExampleValue] = useState("");
  const [provideAnswerValue, setProvideAnswerValue] = useState("Yes");
  const [formatValue, setFormatValue] = useState("Plain text");
  const [explanationValue, setExplanationValue] = useState("Not required");
  const [numberOfOptionsValue, setNumberOfOptionsValue] = useState("4");
  const [optionTypeValue, setOptionTypeValue] = useState("A, B,");
  const [numberOfMissingWordsValue, setNumberOfMissingWordsValue] =
    useState("1");
  const [representingWordsValue, setRepresentingWordsValue] =
    useState("underscore");
  const [numberOfItemsValue, setNumberOfItemsValue] = useState("4");
  const [numQuestionsValue, setNumQuestionsValue] = useState("1");
  const [bloomValue, setBloomValue] = useState("Not Specified");
  const [levelValue, setLevelValue] = useState("Easy");
  const [learningObj, setlearningObj] = useState("");
  //above......
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showContent, setShowContent] = useState(true); // Initially set to true to show the content
  const [showTopic, setShowTopic] = useState(false);
  const [activeButton, setActiveButton] = useState(1);
  const [showPdf, setShowpdf] = useState(false);
  const [files, setFiles] = useState([]);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showImage, setShowImage] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [showYouTubePopup, setShowYouTubePopup] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showSimilar, setShowSimilar] = useState(false);
  // const [showVideoInput, setShowVideoInput] = useState(false); // Removed duplicate
  const [showPopup, setShowPopup] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [comment, setComment] = useState("");
  const [showFeed, setShowFeed] = useState(false);
  //Options
  const [enterTheText, setEnterTheText] = useState("");
  const [similarQuestion, setSimilarQuestion] = useState("");
  const [conceptValue, setConceptValue] = useState(""); // Added state for Concept emphasis
  const [constraintsValue, setConstraintsValue] = useState(""); // Added state for Constraints
  const [keywordsValue, setKeywordsValue] = useState(""); // Added state for Keywords
  const [isLoading, setIsLoading] = useState(false);
  const [generatedFromSource, setGeneratedFromSource] = useState("");
  const [longProcessWarning, setLongProcessWarning] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // success, error, info
  const [docMode, setDocMode] = useState("normal"); // 'normal' or 'handwritten'
  const [showLesson, setShowLesson] = useState(false);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Eligibility check for question generation:
  // DOCUMENT — always eligible (uploaded PDF or URL).
  // LINK     — always eligible (external web URL, scrapeable).
  // VIDEO    — only eligible when video_file is uploaded (video_url is non-null);
  //             link-based videos (YouTube / external URL) are excluded.
  const isEligibleForQuestionGeneration = (lesson) => {
    if (lesson.lesson_type === 'DOCUMENT') return true;
    if (lesson.lesson_type === 'LINK')     return true;
    if (lesson.lesson_type === 'VIDEO')    return Boolean(lesson.video_url);
    return false; // TEXT, ASSESSMENT, FEEDBACK — excluded
  };

  // Fetch initial courses
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get(buildApiUrl("/api/organization/courses/"));
        setCourses(res.data || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setSelectedBatch("");
    setSelectedModule("");
    setSelectedLesson("");
    setBatches([]);
    setModules([]);
    setLessons([]);
    if (!courseId) return;

    try {
      setIsLessonLoading(true);
      const [batchesRes, modulesRes] = await Promise.all([
        apiClient.get(buildApiUrl(`/api/organization/batches/?course=${courseId}`)),
        apiClient.get(buildApiUrl(`/api/organization/modules/?course=${courseId}`))
      ]);
      setBatches(batchesRes.data || []);
      setModules(modulesRes.data || []);
    } catch (err) {
      console.error("Error fetching batches/modules:", err);
    } finally {
      setIsLessonLoading(false);
    }
  };

  const handleModuleChange = async (moduleId) => {
    setSelectedModule(moduleId);
    setSelectedLesson("");
    setLessons([]);
    if (!moduleId) return;

    try {
      setIsLessonLoading(true);
      const res = await apiClient.get(buildApiUrl(`/api/organization/lessons/?module=${moduleId}`));
      const allLessons = res.data || [];
      // Filter to lessons with processable content (excludes link-based VIDEO lessons)
      const filteredLessons = allLessons.filter(isEligibleForQuestionGeneration);
      setLessons(filteredLessons);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setIsLessonLoading(false);
    }
  };

  const showToast = (msg, type = "success", duration = 3000) => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), duration);
  };


  const FILE_SOURCE_MODES = [3, 5, 6, 7];

  const classifyFile = (file) => {
    if (!file || file.type === "url") return null;
    const lowerName = (file.name || "").toLowerCase();
    if (
      file.type?.startsWith("video/") ||
      [".mp4", ".avi", ".mov", ".mkv", ".webm"].some((ext) => lowerName.endsWith(ext))
    ) {
      return "video";
    }
    if (
      file.type?.startsWith("audio/") ||
      [".mp3", ".wav", ".m4a", ".flac"].some((ext) => lowerName.endsWith(ext))
    ) {
      return "audio";
    }
    if (
      file.type?.startsWith("image/") ||
      [".jpg", ".jpeg", ".png", ".webp"].some((ext) => lowerName.endsWith(ext))
    ) {
      return "image";
    }
    if (
      file.type === "application/pdf" ||
      lowerName.endsWith(".pdf") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      return "document";
    }
    return null;
  };

  const syncFilePanelsFromFiles = (fileList) => {
    const cats = new Set(fileList.map(classifyFile).filter(Boolean));
    setShowpdf(cats.has("document"));
    setShowImage(cats.has("image"));
    setShowVideoInput(cats.has("video"));
    setShowAudioInput(cats.has("audio"));
  };

  const appendNumberField = (formData, key, value) => {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      formData.append(key, parsed.toString());
    }
  };

  const handleFileSelect = async (e, sourceCategory = null) => {
    const uploadedFiles = Array.from(e.target.files);

    const allowedFiles = uploadedFiles.filter((file) => {
      const category = classifyFile(file);
      if (!category) return false;
      if (sourceCategory) return category === sourceCategory;
      return true;
    });

    const invalidTypeMessage = {
      video: "Invalid file type. Please upload a Video file. Supported formats: MP4, AVI, MOV, MKV, WEBM.",
      audio: "Invalid file type. Please upload an Audio file. Supported formats: MP3, WAV, M4A, FLAC.",
      image: "Invalid file type. Please upload an Image file. Supported formats: JPG, JPEG, PNG.",
      document: "Invalid file type. Please upload a Document. Supported formats: PDF, DOCX.",
    };

    if (allowedFiles.length === 0) {
      const key = sourceCategory || classifyFile(uploadedFiles[0]) || "document";
      showToast(invalidTypeMessage[key] || invalidTypeMessage.document, "error", 6000);
      if (sourceCategory === "video" && videoInputRef.current) videoInputRef.current.value = "";
      else if (sourceCategory === "audio" && audioInputRef.current) audioInputRef.current.value = "";
      else if (sourceCategory === "image" && imageInputRef.current) imageInputRef.current.value = "";
      else if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map((f) => f.name));
      const uniqueNewFiles = allowedFiles.filter((f) => !existingNames.has(f.name));
      const nextFiles = [...prevFiles, ...uniqueNewFiles];
      syncFilePanelsFromFiles(nextFiles);
      return nextFiles;
    });

    if (sourceCategory === "document") setActiveButton(3);
    else if (sourceCategory === "image") setActiveButton(7);
    else if (sourceCategory === "video") setActiveButton(5);
    else if (sourceCategory === "audio") setActiveButton(6);

    e.target.value = "";
  };

  const getOptionLabel = (index, type) => {
    const t = (type || "").trim();
    if (t.startsWith("A, B")) return `${String.fromCharCode(65 + index)}. `;
    if (t.startsWith("a, b")) return `${String.fromCharCode(97 + index)}. `;
    if (t.startsWith("1, 2")) return `${index + 1}. `;
    if (t.startsWith("I, ii") || t.startsWith("i, ii")) {
      const roman = ["I", "II", "III", "IV", "V", "VI"];
      return `${roman[index] || index + 1}. `;
    }
    return `${String.fromCharCode(65 + index)}. `;
  };

  const formatPydanticResponse = (data, requestedFormat = "Plain text") => {
    if (!data) return "";

    // If data is already a string, just return it
    if (typeof data === 'string') return data;

    if (typeof data === 'object') {
      // If the user explicitly requested JSON, show the raw JSON
      if (requestedFormat === "JSON") {
        return JSON.stringify(data, null, 2);
      }

      // Handle common nested envelopes from file APIs:
      // { questions: [...] } or { questions: { questions: [...] } }.
      const questionsData =
        (data.questions && data.questions.questions) ||
        data.questions ||
        data.question ||
        data;

      if (Array.isArray(questionsData)) {
        if (questionsData.length === 0 && data.raw_fallback) {
          return data.raw_fallback;
        }
        return questionsData.map((q, i) => {
          if (typeof q === 'string') return `${i + 1}. ${q}`;

          let str = `${i + 1}. ${q.question || q.text || "Question text missing"}\n`;
          if (q.options && Array.isArray(q.options)) {
            str += q.options.map((opt, idx) => {
              const label = getOptionLabel(idx, optionTypeValue);
              const trimmedOpt = String(opt).trim();
              return trimmedOpt.startsWith(label) ? `   ${trimmedOpt}` : `   ${label}${trimmedOpt}`;
            }).join('\n') + '\n';
          }
          if (q.answer) str += `   Answer: ${q.answer}\n`;
          if (q.explanation) str += `   Explanation: ${q.explanation}\n`;
          return str;
        }).join('\n');
      }

      // If it's a single question object
      if (questionsData.question || questionsData.text) {
        let str = `${questionsData.question || questionsData.text}\n`;
        if (questionsData.options && Array.isArray(questionsData.options)) {
          str += questionsData.options.map((opt, idx) => {
            const label = getOptionLabel(idx, optionTypeValue);
            const trimmedOpt = String(opt).trim();
            return trimmedOpt.startsWith(label) ? `   ${trimmedOpt}` : `   ${label}${trimmedOpt}`;
          }).join('\n') + '\n';
        }
        if (questionsData.answer) str += `   Answer: ${questionsData.answer}\n`;
        if (questionsData.explanation) str += `   Explanation: ${questionsData.explanation}\n`;
        return str;
      }

      // If the object itself is an envelope with a nested questions object, retry once.
      if (data.questions && typeof data.questions === "object") {
        return formatPydanticResponse(data.questions, requestedFormat);
      }

      // Fallback for unknown object shapes
      return JSON.stringify(data, null, 2);
    }

    return String(data);
  };

  const extractQuestionsArray = (responseData) => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    if (Array.isArray(responseData.questions)) return responseData.questions;
    if (responseData.questions && Array.isArray(responseData.questions.questions)) {
      return responseData.questions.questions;
    }
    if (responseData.question && Array.isArray(responseData.question.questions)) {
      return responseData.question.questions;
    }
    if (responseData.question && Array.isArray(responseData.question)) {
      return responseData.question;
    }
    return [responseData];
  };
  const handleUseUploadedFile = async (filename) => {
    try {
      // Check if API Keys are configured
      const emailPrefix = user?.email ? `${user.email}_` : "";
      const openApiKey = localStorage.getItem(`${emailPrefix}openai_api_key`);
      const geminiApiKey = localStorage.getItem(`${emailPrefix}gemini_api_key`);
      if (!openApiKey && !geminiApiKey) {
        showToast("No API key found in settings. The server will use its default key if available.", "info", 5000);
        // Do NOT return — allow the request to proceed using server-side keys
      }

      setIsLoading(true);
      const formData = new FormData();

      // Find the file by its name in the `files` state
      const file = files.find((file) => file.name === filename);
      if (!file) {
        showToast("File not found. Please upload the file again.", "error", 6000);
        return;
      }

      // Ensure axios doesn't force JSON when sending FormData
      // Basic parameters

      // Basic parameters
      formData.append("files", file);
      formData.append("subject", topicValue || "General");
      formData.append("qp_pat", questionType);
      formData.append("topics", subtopicValue || topicValue || "General");
      formData.append("filename", filename);


      // Question Format parameters
      appendNumberField(formData, "num_questions", numQuestionsValue);
      formData.append("bloom_level", bloomValue);
      formData.append("difficulty", levelValue);
      formData.append("learning_obj", learningObj);


      // Conditional question parameters
      if (questionType === "MCQ") {
        appendNumberField(formData, "num_options", numberOfOptionsValue);
        formData.append("option_type", optionTypeValue);
      } else if (questionType === "Fill in the blanks") {
        appendNumberField(formData, "num_missing_words", numberOfMissingWordsValue);
        formData.append("missing_word_style", representingWordsValue);
      } else if (questionType === "Match the following") {
        appendNumberField(formData, "num_items", numberOfItemsValue);
      }


      // Answer Format parameters
      formData.append("provide_answer", provideAnswerValue);
      formData.append("explanation", explanationValue);
      formData.append("output_format", formatValue);

      const response = await apiClient.post(buildApiUrl("/api/query-with-pdf/"), formData);

      if (response.data) {
        const rawQuestions = extractQuestionsArray(response.data);
        const questionsWithMeta = rawQuestions.map(q => ({
          ...q,
          generation_cost: response.data.cost ? String(response.data.cost) : '',
          bloom_ai: response.data.bloom_level || response.data.bloom || bloomValue,
          level_ai: response.data.difficulty || levelValue,
          creation_method: 'ai',
          num_questions_ai: String(numQuestionsValue),
          learning_obj: learningObj,
          blooms_taxonomy_level: bloomValue,
          ai_response_json: JSON.stringify(response.data)
        }));
        setGeneratedQuestions(questionsWithMeta);
        setOutputText(formatPydanticResponse(response.data, formatValue));
        setGeneratedFromSource(`File: ${filename}`);
        saveQuizToHistory(response.data, `File: ${filename}`);
        addNotification("Questions generated successfully! Scroll down to view them.", "success");
        showToast("Questions generated successfully! Scroll down to view them.");
      }

      // Download PDF if available
      // if (response.data.pdf_filename) {
      //   window.open(`http://localhost:8000/${response.data.pdf_filename}`, "_blank");
      // }
    } catch (error) {
      console.error("Error using PDF for question generation:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || error.message;
      showToast(`Failed to generate questions: ${errorMsg}`, "error", 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionMarkClick = () => {
    showToast("Feature coming soon! View concept models.", "info");
  };
  const handleFeedback = () => {
    setShowFeed(true);
  };

  const handleClosePopup = () => {
    setShowFeed(false);
  };

  // Handler for changing the question type
  const handleQuestionTypeChange = (event) => {
    setQuestionType(event.target.value);
  };
  const userEmail = user?.email;




  // Handler for copying the generated prompt to the clipboard

  const outputRef = useRef(null);

  const handleCopyToClipboard = () => {
    if (outputRef.current) {
      outputRef.current.select();
      document.execCommand("copy");
      showToast("Copied to clipboard!", "success");
    }
  };

  const handleDownloadPDF = () => {
    const outputTextArea = document.getElementById("output");
    const text = outputTextArea.value;

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
      // Draw header bar flush to left, ending at right edge
      pdf.rect(0, marginY, pageWidth, headerBarHeight, "F");
      // Draw right half-circle (center at right edge)
      pdf.circle(pageWidth, marginY + headerBarHeight / 2, headerCurveRadius, "F");

      // FOOTER: Thin orange bar with left half-circle flush left
      pdf.setFillColor(246, 144, 80); // #F69050
      // Draw left half-circle (center at left edge)
      pdf.circle(0, pageHeight - footerBarHeight / 2, footerCurveRadius, "F");
      // Draw footer bar flush to left, ending at right edge
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
      // Move right so text starts after the orange circle (footerCurveRadius + some padding)
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

    pdf.save("generated_questions.pdf");
    showToast("PDF downloaded successfully!", "success");
    setShowPopup(false);
  };
  // Add this function to your component to handle file upload to the backend
  const handleUploadToBackend = async (file) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(buildApiUrl("/upload"), formData);

      console.log("Upload response:", response.data);
      setIsLoading(false);
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast(`Failed to upload ${file.name}: ${error.message}`, "error", 6000);
      setIsLoading(false);
      return null;
    }
  };
  const handleDownloadDOCX = () => {
    const outputText = document.getElementById("output").value;
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

      // Group lines into questions and their options
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

      // Create document with proper structure
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
                // Question
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
                // Options (if any)
                ...options.map(option =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `    ${option}`, // Indent options with spaces
                        size: 24,
                        font: "Helvetica"
                      })
                    ],
                    spacing: { before: 120, after: 120, line: 360, lineRule: LineRuleType.AUTO },
                    indent: { left: 720 } // Indent options
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

      // Save the document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, "generated_questions.docx");
        showToast("DOCX downloaded successfully!", "success");
        setShowPopup(false);
      });
    } catch (error) {
      console.error("DOCX generation error:", error);
      showToast("Error generating DOCX file. Please try again.", "error", 6000);
    }
  };


  const handleEmojiClick = (emoji) => {

    // Watermark
    const watermarkParagraph = makeParagraph([
      new TextRun({
        text: "LYSA Solutions",
        color: "D3D3D3",
        bold: true,
        size: 72,
      })
    ], { alignment: "CENTER", spacing: { after: 100 } });

    // FOOTER: Simulate orange bar with colored TextRun
    const footerBarParagraph = makeParagraph([
      new TextRun({
        text: " ",
        size: 24, // 12pt
        color: "F69050",
      })
    ], { spacing: { before: 1 } });

    // FOOTER TEXTS (disclaimer, date, website) - above orange line
    const footerText = makeParagraph([
      new TextRun({
        text: "Disclaimer: AI-generated papers on Lysa Solutions are for practice only; accuracy isn’t guaranteed—use at your own discretion.",
        italics: true,
        size: 20,
      }),
      new TextRun({
        text: `\nGenerated on: ${currentDate} | Page 1 | ID: ${uniqueId}`,
        size: 20,
      }),
      new TextRun({
        text: "    https://lysasolutions.com/",
        size: 20,
      }),
    ], { alignment: "LEFT", spacing: { after: 100 } });

    // Main content
    const lines = outputText.split('\n').filter(line => line.trim() !== '');
    const contentParagraphs = lines.map(line =>
      makeParagraph([
        new TextRun({
          text: line,
          size: 24,
          font: "Arial"
        })
      ], { spacing: { line: 276 } })
    );

    // Ensure header/footer arrays are always valid and all keys are present
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children: [watermarkParagraph, ...contentParagraphs],
        headers: { default: headerParagraph },
        footers: { default: footerText }
      }],
    });


    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "generated_prompt.docx");
      showToast("Prompt DOCX downloaded!", "success");
      setShowPopup(false);
    });
  };

  const handleButtonClick = (buttonNumber) => {
    setDocMode("normal");
    // Keep uploaded files when switching between file-based modes (doc, image, video, audio)
    setActiveButton((prev) => {
      if (prev !== buttonNumber) {
        const prevIsFile = FILE_SOURCE_MODES.includes(prev);
        const nextIsFile = FILE_SOURCE_MODES.includes(buttonNumber);
        if (!(prevIsFile && nextIsFile)) {
          setFiles([]);
        }
      }
      return buttonNumber;
    });
    // Reset all visibility states first
    setShowContent(false);
    setShowTopic(false);
    setShowpdf(false);
    setShowSimilar(false);
    setShowImage(false);
    setShowVideoInput(false);
    setShowAudioInput(false);
    setShowUrlForm(false);
    setShowYouTubePopup(false);
    setShowLesson(false);

    if (buttonNumber === 1) {
      setShowContent(true);
      setShowImage(false);
    } else if (buttonNumber === 2) {
      setShowTopic(true);
    } else if (buttonNumber === 3) {
      setShowpdf(true);
    } else if (buttonNumber === 5) {
      setShowVideoInput(true);
    } else if (buttonNumber === 6) {
      setShowAudioInput(true);
      setShowImage(false);
    } else if (buttonNumber === 4) {
      setShowSimilar(true);
      setShowContent(false);
      setShowTopic(false);
      setShowpdf(false);
      setShowImage(false);
    } else if (buttonNumber === 7) {
      setShowImage(true);
      setShowContent(false);
      setShowTopic(false);
      setShowpdf(false);
      setShowSimilar(false);
    } else if (buttonNumber === 8) {
      setShowLesson(true);
    }

    if (FILE_SOURCE_MODES.includes(buttonNumber) && files.length > 0) {
      syncFilePanelsFromFiles(files);
    }
  };

  const handleSourceSelect = (id) => {
    handleButtonClick(id);
    setIsSourceModalOpen(false);
    
    setTimeout(() => {
      if (id === 3 && fileInputRef.current) fileInputRef.current.click();
      else if (id === 5 && videoInputRef.current) videoInputRef.current.click();
      else if (id === 6 && audioInputRef.current) audioInputRef.current.click();
      else if (id === 7 && imageInputRef.current) imageInputRef.current.click();
    }, 100);
  };

  const triggerFilePicker = (sourceCategory) => {
    if (sourceCategory === "document") {
      setDocMode("normal");
      fileInputRef.current?.click();
    } else if (sourceCategory === "video") {
      videoInputRef.current?.click();
    } else if (sourceCategory === "audio") {
      audioInputRef.current?.click();
    } else if (sourceCategory === "image") {
      imageInputRef.current?.click();
    }
  };

  // + button: add another source type when files exist, otherwise add by current mode
  const handleHeaderAddClick = () => {
    if (files.length > 0) {
      setIsSourceModalOpen(true);
      return;
    }
    if (activeButton === 3) triggerFilePicker("document");
    else if (activeButton === 5) triggerFilePicker("video");
    else if (activeButton === 6) triggerFilePicker("audio");
    else if (activeButton === 7) triggerFilePicker("image");
    else setIsSourceModalOpen(true);
  };

  const sourceCategoriesInFiles = [...new Set(files.map(classifyFile).filter(Boolean))];
  const hasMixedFileSources = sourceCategoriesInFiles.length > 1;

  const saveQuizToHistory = (outerEnvelope, customSource = null) => {
    try {
      const emailPrefix = user?.email ? `${user.email}_` : "";
      const historyKey = `${emailPrefix}quiz_history`;
      const stored = localStorage.getItem(historyKey) || "[]";
      const currentHistory = JSON.parse(stored);
      
      // Dynamically detect the source description
      let detectedSource = customSource;
      if (!detectedSource) {
        if (files && files.length > 0) {
          detectedSource = `File: ${files.map(f => f.name).join(", ")}`;
        } else {
          switch (activeButton) {
            case 1:
              detectedSource = "Direct Text Input";
              break;
            case 2:
              detectedSource = topicValue ? `Topic: ${topicValue}` : "Topic Search";
              break;
            case 3:
              detectedSource = "Document Upload";
              break;
            case 4:
              detectedSource = urlValue ? `Web Link: ${urlValue}` : "Web Link Scraper";
              break;
            case 5:
              detectedSource = "Video Upload";
              break;
            case 6:
              detectedSource = "Audio Upload";
              break;
            case 7:
              detectedSource = "Image Upload";
              break;
            default:
              detectedSource = "AI Generator Prompt";
          }
        }
      }

      const newHistoryItem = {
        topic: topicValue || enterTheText?.slice(0, 30) || "General Topic",
        type: questionType,
        bloom: bloomValue,
        difficulty: levelValue,
        source: detectedSource,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        raw_text: formatPydanticResponse(outerEnvelope, formatValue)
      };
      
      currentHistory.unshift(newHistoryItem);
      localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    } catch (e) {
      console.error("Failed to save to quiz history:", e);
    }
  };

  const handleGenerate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("DEBUG: handleGenerate clicked. ActiveButton:", activeButton, "Files:", files);
    setIsLoading(true);
    setLongProcessWarning(false);
    setGeneratedQuestions([]);

    // Set timeout to show warning if it takes longer than 5 seconds
    const timeoutId = setTimeout(() => {
      setLongProcessWarning(true);
    }, 5000);

    try {
      // Check if API Keys are configured
      const emailPrefix = user?.email ? `${user.email}_` : "";
      const openApiKey = localStorage.getItem(`${emailPrefix}openai_api_key`);
      const geminiApiKey = localStorage.getItem(`${emailPrefix}gemini_api_key`);
      if (!openApiKey && !geminiApiKey) {
        showToast("No API key found in settings. The server will use its default key if available.", "info", 4000);
        // Do NOT return — allow the request to proceed using server-side keys
      }
      // Proceeding to request, backend will fall back to server-side .env keys if none provided in headers.

      if (files.length === 0 && FILE_SOURCE_MODES.includes(activeButton)) {
        alert("Please upload a file first");
        return;
      }

      if (activeButton === 1 && (!enterTheText || enterTheText.trim() === "")) {
        alert("Please enter the text first");
        return;
      }

      if (activeButton === 4 && (!similarQuestion || similarQuestion.trim() === "")) {
        alert("Please enter a similar question first");
        return;
      }

      if (activeButton === 2 && (!topicValue || topicValue.trim() === "")) {
        alert("Please enter a topic first");
        return;
      }

      if (activeButton === 8 && !selectedLesson) {
        alert("Please select a lesson first");
        return;
      }

      if (activeButton === 8) {
        // Lesson-based generation logic
        setLoadingStage("Generating from lesson...");
        const response = await apiClient.post(buildApiUrl("/api/grade/generate-questions/"), {
          lessonId: selectedLesson,
          count: numQuestionsValue
        });

        if (response.data) {
          const rawQuestions = extractQuestionsArray(response.data);
          const questionsWithMeta = rawQuestions.map(q => ({
            ...q,
            generation_cost: response.data.cost ? String(response.data.cost) : '',
            bloom_ai: response.data.bloom_level || response.data.bloom || bloomValue,
            level_ai: response.data.difficulty || levelValue,
            creation_method: 'ai',
            num_questions_ai: String(numQuestionsValue),
            learning_obj: learningObj,
            blooms_taxonomy_level: bloomValue,
            ai_response_json: JSON.stringify(response.data)
          }));
          setGeneratedQuestions(questionsWithMeta);
          setOutputText(formatPydanticResponse(response.data, formatValue));
          addNotification("Questions generated successfully!", "success");
          showToast("Questions generated successfully!");
        }
        return; // Exit early as we've handled generation
      }

      if (files.length > 0) {
        // Upload from one or more sources (documents, images, etc. can be combined)
        if (!files || files.length === 0) {
          alert("Please upload a file first");
          return;
        }

        const supportedFiles = files.filter((f) => classifyFile(f));
        if (supportedFiles.length === 0) {
          showToast(
            "No supported files to generate from. Use PDF, DOCX, images (PNG/JPG), audio (MP3/WAV), or video (MP4).",
            "error",
            7000
          );
          return;
        }
        if (supportedFiles.length < files.length) {
          showToast(
            `${files.length - supportedFiles.length} unsupported file(s) will be skipped.`,
            "info",
            5000
          );
        }

        const formData = new FormData();

        for (let i = 0; i < supportedFiles.length; i++) {
          formData.append("files", supportedFiles[i]);
        }
        formData.append("filename", supportedFiles[0].name);

        formData.append("subject", topicValue || "General");
        formData.append("qp_pat", questionType);
        formData.append("question_type", questionType); // Added for fallback
        formData.append("questionType", questionType);  // Added for consistency with text mode
        formData.append("topics", subtopicValue || topicValue || "General");
        // Add duplicate fields to match text-generation API expectation if needed by backend
        formData.append("questionType", questionType);

        // Question Format parameters
        appendNumberField(formData, "num_questions", numQuestionsValue);
        formData.append("bloom_level", bloomValue);
        formData.append("difficulty", levelValue);
        formData.append("learning_obj", learningObj);


        // Conditional question parameters
        if (questionType === "MCQ") {
          appendNumberField(formData, "num_options", numberOfOptionsValue);
          formData.append("option_type", optionTypeValue);
        } else if (questionType === "Fill in the blanks") {
          appendNumberField(formData, "num_missing_words", numberOfMissingWordsValue);
          formData.append("missing_word_style", representingWordsValue);
        } else if (questionType === "Match the following") {
          appendNumberField(formData, "num_items", numberOfItemsValue);
        }


        // Answer Format parameters
        formData.append("provide_answer", provideAnswerValue);
        formData.append("explanation", explanationValue);
        formData.append("output_format", formatValue);
        
        // Pass doc_mode for Document tab
        if (activeButton === 3) {
          formData.append("doc_mode", docMode);
        }

        const endpoint = buildApiUrl(`/api/query-with-pdf/`);

        console.log(`Uploading ${files.length} file(s), Endpoint: ${endpoint}`);
        console.log("Parameters sent:", { subject: topicValue || "General", qp_pat: questionType, num_questions: numQuestionsValue });

        setLoadingStage("Generating...");

        const response = await apiClient.post(
          endpoint,
          formData
        );

        console.log("Backend Response:", response.data);

        if (response.data) {
          if (response.data.skipped_sources?.length > 0) {
            showToast(
              `Some sources were skipped: ${response.data.skipped_sources.join("; ")}`,
              "info",
              8000
            );
          }
          // File-based endpoints: unwrap questions array from response
          const outerEnvelope = response.data.questions ? response.data : response.data;
          const rawQuestions = extractQuestionsArray(response.data);
          // Stamp every individual question with AI metadata from the response envelope + component state
          const questionsWithMeta = rawQuestions.map(q => ({
            ...q,
            generation_cost: response.data.cost ? String(response.data.cost) : '',
            bloom_ai: response.data.bloom_level || response.data.bloom || bloomValue,
            level_ai: response.data.difficulty || levelValue,
            creation_method: 'ai',
            num_questions_ai: String(numQuestionsValue),
            learning_obj: learningObj,
            blooms_taxonomy_level: bloomValue,
            ai_response_json: JSON.stringify(response.data)
          }));
          setGeneratedQuestions(questionsWithMeta);
          setOutputText(formatPydanticResponse(outerEnvelope, formatValue));
          setGeneratedFromSource(files && files.length > 0 ? `Files (${files.map(f => f.name).join(", ")})` : "Document Upload");
          saveQuizToHistory(outerEnvelope);
        } else {
          console.warn("No data in response:", response.data);
          alert("The backend returned a success response but no data was found. Please check backend logs.");
        }
      } else {
        // Text-based generation
        const params = {
          questionType,
          numQuestionsValue,
          bloomValue,
          levelValue,
          numberOfOptionsValue,
          optionTypeValue,
          numberOfMissingWordsValue,
          representingWordsValue,
          numberOfItemsValue,
          learningObj,
          provideAnswerValue,
          explanationValue,
          formatValue,
          similarQuestion,
          enterTheText,
          topicValue,
          subtopicValue,
          exampleValue,
          conceptValue,
          constraintsValue,
          keywordsValue,
          showContent,
          showSimilar,
          showTopic,
          email: userEmail,
        };

        const url = buildApiUrl(
          `/api/generateQuestion/?${Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join("&")}`
        );

        console.log("Question generation API URL:", url);

        const response = await apiClient.get(url);
        console.log("Question generation API Response:", response.data);


        if (response.data) {
          // Unwrap nested structure: backend returns {question: {questions: [...]}, cost: ...}
          const outerEnvelope = response.data.message || response.data.question || response.data;
          // If outerEnvelope has a .questions array, use it; otherwise treat it as a single item
          let rawQuestions;
          if (outerEnvelope && typeof outerEnvelope === 'object' && Array.isArray(outerEnvelope.questions)) {
            rawQuestions = outerEnvelope.questions;
          } else if (Array.isArray(outerEnvelope)) {
            rawQuestions = outerEnvelope;
          } else {
            rawQuestions = [outerEnvelope];
          }

          // Stamp every individual question with the AI metadata from:
          // 1. response.data envelope (cost, bloom, level returned by backend)
          // 2. component state (numQuestionsValue, bloomValue, learningObj chosen by user)
          const questionsWithMeta = rawQuestions.map(q => ({
            ...q,
            generation_cost: response.data.cost ? String(response.data.cost) : '',
            bloom_ai: response.data.bloom_level || response.data.bloom || bloomValue,
            level_ai: response.data.difficulty || levelValue,
            creation_method: 'ai',
            num_questions_ai: String(numQuestionsValue),
            learning_obj: learningObj,
            blooms_taxonomy_level: bloomValue,
            ai_response_json: JSON.stringify(response.data)
          }));
          setGeneratedQuestions(questionsWithMeta);
          setOutputText(formatPydanticResponse(outerEnvelope, formatValue));
          setGeneratedFromSource(
            activeButton === 2 
              ? `Topic (${topicValue || "General"})`
              : activeButton === 4
                ? `Web Link`
                : `Provided Text`
          );
          saveQuizToHistory(outerEnvelope);
        }
      }
    } catch (error) {
      console.error("DEBUG: Error in Question Generation:", error);
      if (error.response) {
        console.error("DEBUG: Error Response Data:", error.response.data);
        console.error("DEBUG: Error Response Status:", error.response.status);
      }

      const backendErrorText =
        (error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || error.message || "")
          .toString()
          .toLowerCase();

      const errorMsg = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || `Status: ${error.response?.status}`;

      if (error.response) {
        if (error.response.status === 401) {
          console.error("Authentication required or invalid token:", errorMsg);
          showToast(`Authentication failed: ${errorMsg}. Please check your JWT secret in the backend.`, "error", 6000);
        } else if (error.response.status === 402) {
          const goToProfile = confirm("You need to add your credits. Go to profile page?");
          if (goToProfile) {
            window.location.href = "/profile";
          }
        } else if (
          activeButton === 6 &&
          (backendErrorText.includes("no speech was detected") || backendErrorText.includes("no speech detected"))
        ) {
          showToast(
            "No speech detected in the audio. Please upload clear voice audio (not silent/music-only).",
            "error",
            7000
          );
        } else {
          showToast(`Generation failed: ${errorMsg}`, "error", 6000);
        }
      } else {
        if (
          activeButton === 6 &&
          (backendErrorText.includes("no speech was detected") || backendErrorText.includes("no speech detected"))
        ) {
          showToast(
            "No speech detected in the audio. Please upload clear voice audio (not silent/music-only).",
            "error",
            7000
          );
        } else {
          showToast(`An unexpected error occurred. ${error.message || "Please try again later."}`, "error", 6000);
        }
      }
    }
    finally {
      clearTimeout(timeoutId);
      setLongProcessWarning(false);
      setIsLoading(false);
      setLoadingStage("");

      // Add success notification if no error (heuristic based on flow)
      // Note: In catch block we usually return or alert. If we reach here without error usually means success
      // but logic above has alerts. Ideally we set notification in the success blocks.
    }
  };



  const handleDownloadFile = (file) => {
    const blob = new Blob([file], { type: file.type });
    saveAs(blob, file.name);
  };
  const handleIconClick = (iconType) => {
    if (iconType === "upload") {
      if (showVideoInput && videoInputRef.current) {
        videoInputRef.current.click();
      } else if (showAudioInput && audioInputRef.current) {
        audioInputRef.current.click();
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else if (iconType === "link") {
      setShowUrlForm(true);
    }
  };

  const handleUrlFormSubmit = (e) => {
    e.preventDefault();
    if (urlValue.trim() !== "") {
      setFiles([...files, { name: urlValue, type: "url" }]);
      setUrlValue("");
      setShowUrlForm(false);
    }
  };
  const handleYouTubeIconClick = () => {
    window.open("https://www.youtube.com", "_blank");
  };

  const handleFileRemove = (indexToRemove) => {
    const updatedFiles = files.filter((file, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    syncFilePanelsFromFiles(updatedFiles);
  };
  const getFileIconClass = (file) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".pdf")) {
      return <img src={pdf} className="photos" alt="" />;
    } else if (fileName.endsWith(".docx")) {
      return <img src={docx} className="photos" alt="" />;
    } else if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      return <img src={image} className="photos" alt="" />;
    } else if (fileName.endsWith(".mp3") || fileName.endsWith(".wav") || fileName.endsWith(".m4a")) {
      return <FontAwesomeIcon icon={faMicrophone} className="photos" style={{ color: '#1a5aff' }} alt="" />;
    } else {
      return <img src={link} className="photos" alt="" />;
    }
  };
  const handleImageClick = (iconType) => {
    if (iconType === "copy") {
      handleCopyToClipboard();
    } else if (iconType === "download") {
      // Display options for PDF or DOCX download
      const downloadOption = window.confirm(
        "Choose the download format:\nPDF: Click OK\nDOCX: Click Cancel"
      );
      if (downloadOption) {
        // User selected PDF
        handleDownloadPDF();
      } else {
        // User selected DOCX
        handleDownloadDOCX();
      }
    }
  };

  const getDynamicInputLabel = () => {
    if (files && files.length > 0) {
      const isUrl = files.some(f => f.type === 'url');
      if (isUrl) return "Scraped Web Links";
      return "Uploaded Source Files";
    }
    
    switch (activeButton) {
      case 1:
        return "Enter the Text";
      case 2:
        return topicValue ? `Topic Search: ${topicValue}` : "Topic Input";
      case 3:
        return "Document Content";
      case 4:
        return "Web Link Scraper Content";
      case 5:
        return "Video Transcript Details";
      case 6:
        return "Audio Transcript Details";
      case 7:
        return "Image Context Details";
      default:
        return "Enter the Text";
    }
  };

  const getDynamicInputPlaceholder = () => {
    if (files && files.length > 0) {
      return "The questions generated will be based on the uploaded files listed below.";
    }
    switch (activeButton) {
      case 1:
        return "The questions generated will be based on the text you provide here";
      case 2:
        return "Topic active. Enter a topic below to generate questions based on it";
      case 3:
        return "Choose files from the source modal to generate questions from documents";
      case 4:
        return "Enter or select a web link to scrape content from";
      case 5:
        return "Upload video files to generate questions from their transcripts";
      case 6:
        return "Upload audio files to generate questions from their voice recordings";
      case 7:
        return "Upload images to generate questions from their visual content";
      default:
        return "Enter or upload content to generate questions";
    }
  };


  // Component JSX
  return (
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
            <div className="qw-text-area-label">{getDynamicInputLabel()}</div>
            <textarea
              id="text-content"
              value={enterTheText}
              onChange={(e) => setEnterTheText(e.target.value)}
              placeholder={getDynamicInputPlaceholder()}
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
            <div className="qw-text-area-label d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>Generated Question</span>
              {outputText && generatedFromSource && (
                <span style={{ fontSize: '11px', color: '#4361ee', fontWeight: '600', backgroundColor: '#e6ecff', padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.3px' }}>
                  Generated from: {generatedFromSource}
                </span>
              )}
            </div>
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
                      const qText = typeof qTextRaw === 'string' ? qTextRaw.replace(/^\d+\.\s*/, '').trim() : '';
                      const optsRaw = q.options || q.choices || q.choices_text || q.answers || [];
                      const opts = (Array.isArray(optsRaw) ? optsRaw : []).map(opt => typeof opt === 'string' ? opt.replace(/^[A-Z]\.\s*/i, '').replace(/^[a-z]\)\s*/i, '').trim() : opt);
                      const ansRaw = q.answer || q.correctAnswer || q.correct_answer || q.solution || '';
                      const ans = typeof ansRaw === 'string' ? ansRaw.replace(/^Answer:\s*/i, '').replace(/^[A-Z]\.\s*/i, '').trim() : ansRaw;
                      
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
                  <option key={num} value={`${num} sentences`}>{num} {num === 1 ? 'sentence' : 'sentences'}</option>
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
