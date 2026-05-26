
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
  faLightbulb,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faCircleNotch
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

const cleanErrorMessage = (rawMsg) => {
  if (!rawMsg) return "An unknown error occurred.";
  let msg = String(rawMsg);

  if (msg.includes("413") || msg.toLowerCase().includes("request entity too large") || msg.toLowerCase().includes("too large")) {
    return "The uploaded file is too large (413 Request Entity Too Large). Please increase Nginx's 'client_max_body_size' limit in your server configuration, or try uploading a smaller file.";
  }

  // Check if it's a python dict-like string, e.g. "{'code': '...', 'error': '...'}"
  if (msg.includes("{") && msg.includes("}")) {
    try {
      const errorMatch = msg.match(/'error':\s*'([^']+)'/) || msg.match(/"error":\s*"([^"]+)"/);
      const messageMatch = msg.match(/'message':\s*'([^']+)'/) || msg.match(/"message":\s*"([^"]+)"/);
      
      if (errorMatch) {
        let errText = errorMatch[1];
        return errText;
      }
      if (messageMatch) {
        return messageMatch[1];
      }
    } catch (e) {
      // ignore parsing error
    }
  }

  // Specific check for Groq API errors
  if (msg.includes("Groq API") || msg.includes("groq")) {
    if (msg.includes("400") || msg.includes("invalid") || msg.includes("not found") || msg.includes("Incorrect API key")) {
      return "Groq API Error: Invalid API key. Please make sure you entered a valid Groq key from https://console.groq.com.";
    }
  }

  if (msg.includes("api_key") || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) {
    return "Authentication Error: The API key provided is invalid or expired. Please check your AI API key settings.";
  }

  // Clean prefixes
  msg = msg.replace(/^Error code: \d+ - /i, "");
  msg = msg.replace(/^Groq API call failed: /i, "");
  msg = msg.replace(/^OpenAI API call failed: /i, "");
  msg = msg.replace(/^Gemini API call failed: /i, "");
  msg = msg.replace(/^Mistral API call failed: /i, "");
  msg = msg.replace(/^Generation failed: /i, "");

  return msg;
};

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
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) {
      const parts = user.email.split('@')[0];
      return parts.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return 'User';
  };
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
  const [revealAnswers, setRevealAnswers] = useState(false);
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
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadWithOptions, setDownloadWithOptions] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState("pdf"); // 'pdf' or 'docx'
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

  // ── Model Settings State ──
  const MODEL_OPTIONS = {
    Gemini: ["gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-pro", "gemini-3-flash-preview"],
    OpenAI: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    Groq:   ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    Mistral:["mistral-large-latest", "mistral-small-latest", "open-mixtral-8x22b"],
  };
  const [msOrganization, setMsOrganization] = useState("Gemini");
  const [msModel, setMsModel] = useState("gemini-2.5-flash");
  const [msTemperature, setMsTemperature] = useState(1);
  const [msStopSequence, setMsStopSequence] = useState("");
  const [msMaxOutput, setMsMaxOutput] = useState(1000);
  const [msAdvancedOpen, setMsAdvancedOpen] = useState(false);
  const [msTopK, setMsTopK] = useState(2);
  const [msTopP, setMsTopP] = useState(0.95);
  const [msOutputLength, setMsOutputLength] = useState(1000);
  const [msApiKey, setMsApiKey] = useState("");

  // Load API Key when organization changes
  useLayoutEffect(() => {
    const keyMap = {
      Gemini: "gemini_api_key",
      OpenAI: "openai_api_key",
      Groq: "grok_api_key",
      Mistral: "mistral_api_key"
    };
    // Note: user and user.email might not be available immediately in this scope, 
    // so we rely on fetching it directly from authService or localStorage patterns 
    // as done in apiClient.js
    const storedUserStr = localStorage.getItem("user");
    let emailPrefix = "";
    if (storedUserStr && storedUserStr !== "undefined") {
      try {
        const u = JSON.parse(storedUserStr);
        if (u && u.email) emailPrefix = `${u.email}_`;
      } catch (e) { }
    }
    const storageKey = `${emailPrefix}${keyMap[msOrganization]}`;
    const savedKey = localStorage.getItem(storageKey);
    setMsApiKey(savedKey && savedKey !== "null" ? savedKey : "");
  }, [msOrganization]);

  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setMsApiKey(newKey);
    const keyMap = {
      Gemini: "gemini_api_key",
      OpenAI: "openai_api_key",
      Groq: "grok_api_key",
      Mistral: "mistral_api_key"
    };
    const storedUserStr = localStorage.getItem("user");
    let emailPrefix = "";
    if (storedUserStr && storedUserStr !== "undefined") {
      try {
        const u = JSON.parse(storedUserStr);
        if (u && u.email) emailPrefix = `${u.email}_`;
      } catch (e) { }
    }
    const storageKey = `${emailPrefix}${keyMap[msOrganization]}`;
    localStorage.setItem(storageKey, newKey);
  };

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

  const formatPydanticResponse = (data, requestedFormat = "Plain text", overrideProvideAnswer = null) => {
    if (!data) return "";

    const activeProvideAnswer = overrideProvideAnswer || provideAnswerValue;

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
          if (activeProvideAnswer !== "No") {
            if (q.answer) str += `   Answer: ${q.answer}\n`;
            if (q.explanation) str += `   Explanation: ${q.explanation}\n`;
          }
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
        if (activeProvideAnswer !== "No") {
          if (questionsData.answer) str += `   Answer: ${questionsData.answer}\n`;
          if (questionsData.explanation) str += `   Explanation: ${questionsData.explanation}\n`;
        }
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
    setLongProcessWarning(false);
    const timeoutId = setTimeout(() => {
      setLongProcessWarning(true);
    }, 5000);

    try {
      // Check if API Keys are configured
      const emailPrefix = user?.email ? `${user.email}_` : "";
      const openApiKey = localStorage.getItem(`${emailPrefix}openai_api_key`);
      const geminiApiKey = localStorage.getItem(`${emailPrefix}gemini_api_key`);
      const grokApiKey = localStorage.getItem(`${emailPrefix}grok_api_key`);
      const mistralApiKey = localStorage.getItem(`${emailPrefix}mistral_api_key`);
      if (!openApiKey && !geminiApiKey && !grokApiKey && !mistralApiKey) {
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
      showToast(`Failed to generate questions: ${cleanErrorMessage(errorMsg)}`, "error", 6000);
    } finally {
      clearTimeout(timeoutId);
      setLongProcessWarning(false);
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

  const handleDownloadPDF = (withOptions = true) => {
    const outputTextArea = document.getElementById("output");
    let text = outputTextArea.value;
    if (!withOptions) {
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
  const handleDownloadDOCX = (withOptions = true) => {
    let outputText = document.getElementById("output").value;
    if (!withOptions) {
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
              detectedSource = similarQuestion ? `Similar: ${similarQuestion.slice(0, 30)}...` : "Similar Question";
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
        topic: topicValue || similarQuestion?.slice(0, 30) || enterTheText?.slice(0, 30) || "General Topic",
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

  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.57);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.62);
    } catch (e) {
      console.warn("Audio Context chime failed to initialize:", e);
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
      const grokApiKey = localStorage.getItem(`${emailPrefix}grok_api_key`);
      const mistralApiKey = localStorage.getItem(`${emailPrefix}mistral_api_key`);
      if (!openApiKey && !geminiApiKey && !grokApiKey && !mistralApiKey) {
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
          
          playSuccessChime();
          addNotification(`${numQuestionsValue} questions generated successfully! We've loaded them in the viewer below.`, "success");
          showToast(`${numQuestionsValue} questions generated successfully!`);
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

        const modelHeaders = {
          'X-Selected-Provider': msOrganization,
          'X-Selected-Api-Key': msApiKey,
          'X-Selected-Model': msModel,
          'X-Model-Temperature': msTemperature,
          'X-Model-Max-Output': msMaxOutput,
          'X-Model-Stop': msStopSequence || '',
          'X-Model-Top-K': msTopK,
          'X-Model-Top-P': msTopP
        };

        const response = await apiClient.post(
          endpoint,
          formData,
          { headers: modelHeaders }
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
          
          playSuccessChime();
          const qCount = parseInt(numQuestionsValue) || 1;
          showToast(`${qCount} ${qCount === 1 ? 'question' : 'questions'} generated successfully!`);
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

        const modelHeaders = {
          'X-Selected-Provider': msOrganization,
          'X-Selected-Api-Key': msApiKey,
          'X-Selected-Model': msModel,
          'X-Model-Temperature': msTemperature,
          'X-Model-Max-Output': msMaxOutput,
          'X-Model-Stop': msStopSequence || '',
          'X-Model-Top-K': msTopK,
          'X-Model-Top-P': msTopP
        };

        const response = await apiClient.get(url, { headers: modelHeaders });
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
                ? `Similar Question`
                : `Provided Text`
          );
          saveQuizToHistory(outerEnvelope);
          
          playSuccessChime();
          const qCount = parseInt(numQuestionsValue) || 1;
          showToast(`${qCount} ${qCount === 1 ? 'question' : 'questions'} generated successfully!`);
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

      const rawErrorMsg = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || `Status: ${error.response?.status}`;
      const errorMsg = cleanErrorMessage(rawErrorMsg);

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
          showToast(`An unexpected error occurred: ${cleanErrorMessage(error.message) || "Please try again later."}`, "error", 6000);
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
  const triggerDownload = () => {
    setDownloadModalOpen(false);
    if (downloadFormat === "pdf") {
      handleDownloadPDF(downloadWithOptions);
    } else {
      handleDownloadDOCX(downloadWithOptions);
    }
  };

  const handleImageClick = (iconType) => {
    if (iconType === "copy") {
      handleCopyToClipboard();
    } else if (iconType === "download") {
      setDownloadModalOpen(true);
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
        return "Topic Parameters";
      case 3:
        return "Document Content";
      case 4:
        return "Similar Question Input";
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
        return "Topic active. Enter parameters below to generate questions based on it";
      case 3:
        return "Choose files from the source modal to generate questions from documents";
      case 4:
        return "Enter a question here to generate similar questions based on it";
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
          backgroundColor: toastType === 'error' ? '#fde8e8' : toastType === 'info' ? '#e1f5fe' : '#e8f5e9',
          color: toastType === 'error' ? '#c81e1e' : toastType === 'info' ? '#0288d1' : '#2e7d32',
          border: `1px solid ${toastType === 'error' ? '#f8b4b4' : toastType === 'info' ? '#b3e5fc' : '#a5d6a7'}`,
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 3000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontWeight: '550',
          whiteSpace: 'normal',
          maxWidth: '650px',
          width: 'max-content',
          textAlign: 'left',
          lineHeight: '1.4',
          wordBreak: 'break-word',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FontAwesomeIcon 
            icon={
              toastType === 'error' 
                ? faExclamationTriangle 
                : toastType === 'info' 
                  ? faInfoCircle 
                  : faCheckCircle
            } 
            style={{ fontSize: '18px', flexShrink: 0 }}
          />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Long Processing Warning Toast */}
      {longProcessWarning && (
        <div className="qw-processing-toast">
          <div className="qw-processing-content">
            <FontAwesomeIcon icon={faCircleNotch} className="qw-processing-spinner" />
            <span>Please hold on while the request is being processed.</span>
          </div>
          <div className="qw-buffer-bar-container">
            <div className="qw-buffer-bar-active" />
          </div>
        </div>
      )}

      <h1 className="question-gen-heading" style={{ color: '#1A5AFF', margin: '0 0 20px 0' }}>Welcome, {getDisplayName()}! 👋</h1>

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
            {activeButton === 2 ? (
              <div className="qw-topic-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '16px', 
                padding: '12px 0',
                width: '100%',
                maxHeight: '360px',
                overflowY: 'auto'
              }}>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Topic</label>
                  <input
                    type="text"
                    value={topicValue}
                    onChange={(e) => setTopicValue(e.target.value)}
                    placeholder="Enter the topic"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Sub topic</label>
                  <input
                    type="text"
                    value={subtopicValue}
                    onChange={(e) => setSubtopicValue(e.target.value)}
                    placeholder="Enter the Sub topic"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Example</label>
                  <input
                    type="text"
                    value={exampleValue}
                    onChange={(e) => setExampleValue(e.target.value)}
                    placeholder="Enter the example"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Concept emphasis</label>
                  <input
                    type="text"
                    value={conceptValue}
                    onChange={(e) => setConceptValue(e.target.value)}
                    placeholder="Eg. Classes and objects"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Constraints</label>
                  <input
                    type="text"
                    value={constraintsValue}
                    onChange={(e) => setConstraintsValue(e.target.value)}
                    placeholder="Eg. Avoid questions related"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div className="forrm-group-quiz" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px', textAlign: 'left' }}>Keywords</label>
                  <input
                    type="text"
                    value={keywordsValue}
                    onChange={(e) => setKeywordsValue(e.target.value)}
                    placeholder="Eg. inheritance, polymorphis"
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1a5aff'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
            ) : (
              <textarea
                id="text-content"
                value={activeButton === 4 ? similarQuestion : enterTheText}
                onChange={(e) => {
                  if (activeButton === 4) setSimilarQuestion(e.target.value);
                  else setEnterTheText(e.target.value);
                }}
                placeholder={getDynamicInputPlaceholder()}
              />
            )}
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
              <div className="d-flex align-items-center gap-3">
                <span>Generated Question</span>
                {provideAnswerValue === "No" && generatedQuestions.length > 0 && (
                  <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: '#4361ee', userSelect: 'none', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={revealAnswers} 
                      onChange={(e) => setRevealAnswers(e.target.checked)}
                      style={{ 
                        cursor: 'pointer', 
                        width: '14px', 
                        height: '14px', 
                        accentColor: '#4361ee' 
                      }} 
                    />
                    <span>Reveal Answers</span>
                  </label>
                )}
              </div>
              {outputText && generatedFromSource && (
                <span style={{ fontSize: '11px', color: '#4361ee', fontWeight: '600', backgroundColor: '#e6ecff', padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.3px' }}>
                  Generated from: {generatedFromSource}
                </span>
              )}
            </div>
            <textarea
              ref={outputRef}
              id="output"
              value={
                generatedQuestions && generatedQuestions.length > 0
                  ? formatPydanticResponse(generatedQuestions, formatValue, revealAnswers ? "Yes" : null)
                  : outputText
              }
              readOnly
              placeholder="Generated questions will appear here"
            />
            <div className="qw-text-actions">
              <FontAwesomeIcon icon={faComment} className="qw-action-icon" onClick={handleFeedback} title="Feedback" />
              {showFeed && <FeedbackPopup onClose={handleClosePopup} />}
              <FontAwesomeIcon icon={faCopy} className="qw-action-icon" onClick={handleCopyToClipboard} title="Copy" />
              <FontAwesomeIcon icon={faDownload} className="qw-action-icon" onClick={() => setDownloadModalOpen(true)} title="Download" />
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
          <div className="qw-section-title" style={{ display: 'flex', alignItems: 'center', userSelect: 'none', borderBottom: 'none', marginBottom: '8px' }}>
            <span>⚙️ Model Settings</span>
          </div>

          <div className="qw-model-settings-panel">
            <div className="qw-grid-3">
              {/* Organization / Provider */}
              <div className="forrm-group-quiz qw-ms-card">
                <label>🏢 ORGANIZATION</label>
                <select
                  value={msOrganization}
                  onChange={(e) => {
                    const org = e.target.value;
                    setMsOrganization(org);
                    setMsModel(MODEL_OPTIONS[org][0]);
                  }}
                >
                  {Object.keys(MODEL_OPTIONS).map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div className="forrm-group-quiz qw-ms-card">
                <label>🤖 MODEL</label>
                <select value={msModel} onChange={(e) => setMsModel(e.target.value)}>
                  {(MODEL_OPTIONS[msOrganization] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* API Key */}
              <div className="forrm-group-quiz qw-ms-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>🔑 API KEY</label>
                  <a
                    href={
                      msOrganization === "Gemini" ? "https://aistudio.google.com/app/apikey" :
                      msOrganization === "OpenAI" ? "https://platform.openai.com/api-keys" :
                      msOrganization === "Groq" ? "https://console.groq.com/keys" :
                      "https://console.mistral.ai/api-keys/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: 'var(--button-primary, #1a5aff)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    className="qw-api-link"
                  >
                    Get {msOrganization} Key ↗
                  </a>
                </div>
                <input
                  type="password"
                  placeholder={`Enter ${msOrganization} Key...`}
                  value={msApiKey}
                  onChange={handleApiKeyChange}
                />
              </div>
            </div>

            <div className="qw-grid-3">
              {/* Temperature */}
              <div className="forrm-group-quiz qw-ms-card">
                <label>🌡️ TEMPERATURE</label>
                <div className="qw-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={msTemperature}
                    onChange={(e) => setMsTemperature(Number(e.target.value))}
                    className="qw-range-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.05"
                    value={msTemperature}
                    onChange={(e) => setMsTemperature(Number(e.target.value))}
                    className="qw-slider-num"
                  />
                </div>
              </div>

              {/* Max Output */}
              <div className="forrm-group-quiz qw-ms-card">
                <label>📊 MAX OUTPUT</label>
                <div className="qw-slider-row">
                  <input
                    type="range"
                    min="100"
                    max="65536"
                    step="100"
                    value={msMaxOutput}
                    onChange={(e) => setMsMaxOutput(Number(e.target.value))}
                    className="qw-range-slider"
                  />
                  <input
                    type="number"
                    min="100"
                    max="65536"
                    value={msMaxOutput}
                    onChange={(e) => setMsMaxOutput(Number(e.target.value))}
                    className="qw-slider-num"
                  />
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="forrm-group-quiz qw-ms-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="qw-advanced-toggle"
                  onClick={() => setMsAdvancedOpen(v => !v)}
                >
                  Advanced Settings {msAdvancedOpen ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {/* Advanced Settings (collapsible) */}
              {msAdvancedOpen && (
                <div className="qw-grid-3 animate-fade-in" style={{ marginTop: '8px' }}>
                  <div className="forrm-group-quiz">
                    <label>Output Length</label>
                    <input
                      type="number"
                      min="1"
                      max="65536"
                      value={msOutputLength}
                      onChange={(e) => setMsOutputLength(Number(e.target.value))}
                    />
                  </div>
                  <div className="forrm-group-quiz">
                    <label>Top K</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={msTopK}
                      onChange={(e) => setMsTopK(Number(e.target.value))}
                    />
                  </div>
                  <div className="forrm-group-quiz">
                    <label>Top P</label>
                    <div className="qw-slider-row">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={msTopP}
                        onChange={(e) => setMsTopP(Number(e.target.value))}
                        className="qw-range-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={msTopP}
                        onChange={(e) => setMsTopP(Number(e.target.value))}
                        className="qw-slider-num"
                      />
                    </div>
                  </div>
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
          {isLoading && (
            <div className="qw-loading-banner animate-fade-in mb-3 text-start" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(67, 97, 238, 0.15)',
              borderRadius: '20px',
              padding: '20px 24px',
              boxShadow: '0 8px 32px rgba(67, 97, 238, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              animation: 'pulseGlow 2.5s infinite alternate ease-in-out'
            }}>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes spinReverse {
                  0% { transform: rotate(360deg); }
                  100% { transform: rotate(0deg); }
                }
                @keyframes pulseGlow {
                  0% { box-shadow: 0 8px 32px rgba(67, 97, 238, 0.04); border-color: rgba(67, 97, 238, 0.1); }
                  100% { box-shadow: 0 8px 32px rgba(67, 97, 238, 0.15); border-color: rgba(67, 97, 238, 0.35); }
                }
              `}</style>
              <div className="qw-loading-spinner-wrapper" style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                <div className="qw-loading-spinner-outer" style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '3px solid rgba(67, 97, 238, 0.1)',
                  borderTopColor: '#4361ee',
                  borderRadius: '50%',
                  animation: 'spin 1s infinite linear'
                }} />
                <div className="qw-loading-spinner-inner" style={{
                  position: 'absolute',
                  width: '70%',
                  height: '70%',
                  top: '15%',
                  left: '15%',
                  border: '3px solid rgba(246, 144, 80, 0.1)',
                  borderBottomColor: '#f69050',
                  borderRadius: '50%',
                  animation: 'spinReverse 1.5s infinite linear'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                  <span>Generating {numQuestionsValue} {parseInt(numQuestionsValue) === 1 ? 'Question' : 'Questions'}</span>
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(67, 97, 238, 0.15)', color: '#4361ee', fontSize: '11px', fontWeight: '600', padding: '4px 10px' }}>
                    {parseInt(numQuestionsValue) >= 10 ? 'Batch Process' : 'Active'}
                  </span>
                </h5>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#718096', lineHeight: '1.4' }}>
                  {parseInt(numQuestionsValue) >= 10 
                    ? "This will take a few minutes. We will notify you when the work is done." 
                    : "Crafting your custom educational questions. Please wait..."
                  }
                </p>
              </div>
            </div>
          )}

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

      {/* Premium Download Options Modal */}
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
                onClick={triggerDownload}
                style={{ backgroundColor: '#1A5AFF', borderColor: '#1A5AFF', fontWeight: '600', transition: 'all 0.2s' }}
              >
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionWhiz;
