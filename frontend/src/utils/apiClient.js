import axios from "axios";
import { authService } from "../components/Authentication/authService";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8081";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const user = await authService.getCurrentUser();
  const emailPrefix = user?.email ? `${user.email}_` : "";

  // Inject personal AI API Keys from localStorage
  const openApiKey = localStorage.getItem(`${emailPrefix}openai_api_key`);
  const geminiApiKey = localStorage.getItem(`${emailPrefix}gemini_api_key`);
  const grokApiKey = localStorage.getItem(`${emailPrefix}grok_api_key`);
  const mistralApiKey = localStorage.getItem(`${emailPrefix}mistral_api_key`);

  if (openApiKey && openApiKey.trim() !== "" && openApiKey !== "null") {
    config.headers["X-OpenAI-Key"] = openApiKey;
  }
  if (geminiApiKey && geminiApiKey.trim() !== "" && geminiApiKey !== "null") {
    config.headers["X-Gemini-Key"] = geminiApiKey;
  }
  if (grokApiKey && grokApiKey.trim() !== "" && grokApiKey !== "null") {
    config.headers["X-Grok-Key"] = grokApiKey;
  }
  if (mistralApiKey && mistralApiKey.trim() !== "" && mistralApiKey !== "null") {
    config.headers["X-Mistral-Key"] = mistralApiKey;
  }

  return config;
});

export const buildApiUrl = (path = "") => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
